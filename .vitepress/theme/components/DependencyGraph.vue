<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import {
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type Simulation,
	type SimulationLinkDatum,
	type SimulationNodeDatum,
} from 'd3-force';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { data, type GraphLink, type GraphNode } from '../../../compendium/dependency_graph.data';

interface SimNode extends SimulationNodeDatum, GraphNode {
	/** Label box, measured once from the rendered text. */
	w: number;
	h: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
	source: SimNode;
	target: SimNode;
	kind: string;
	/** Sideways shift, so links between the same pair do not lie on top of each other. */
	offset: number;
}

/** The nodes are created once and never replaced: their positions are the state. */
const nodes: SimNode[] = data.nodes.map((node) => ({ ...node, w: 90, h: 22 }));
const byName = new Map(nodes.map((node) => [node.name, node]));

const links: SimLink[] = (() => {
	// Parallel links get alternating offsets. Both directions of a pair share a
	// counter, so a mutual dependency draws as two arcs rather than one line.
	const seen = new Map<string, number>();
	return data.links.flatMap((link: GraphLink) => {
		const source = byName.get(link.from);
		const target = byName.get(link.to);
		if (!source || !target) return [];
		const pair = [link.from, link.to].sort().join(' ');
		const index = seen.get(pair) ?? 0;
		seen.set(pair, index + 1);
		return [{ source, target, kind: link.kind, offset: (index % 2 ? -1 : 1) * (8 + 8 * index) }];
	});
})();

const hues = new Map(
	data.groups.map((group, index) => [
		group.id,
		Math.round((index * 360) / data.groups.length + 25),
	]),
);
const groupTitles = new Map(data.groups.map((group) => [group.id, group.title]));
const usedKinds = data.kinds.filter((kind) => links.some((link) => link.kind === kind.id));

const root = ref<HTMLElement>();
const svg = ref<SVGSVGElement>();
const ruler = ref<SVGTextElement>();
const ready = ref(false);
const size = ref({ width: 960, height: 560 });
const transform = shallowRef<ZoomTransform>(zoomIdentity);
const hovered = ref<string | null>(null);

/** Bumped on every simulation tick; the render reads it to stay in step. */
const frame = ref(0);

let simulation: Simulation<SimNode, SimLink> | undefined;
let observer: ResizeObserver | undefined;

const view = computed(() => {
	const active = hovered.value;
	return {
		// Read so the render follows the simulation; the value itself is not used.
		tick: frame.value,
		nodes: nodes.map((node) => ({
			node,
			dimmed:
				active !== null &&
				active !== node.name &&
				!links.some(
					(link) =>
						(link.source.name === active && link.target.name === node.name) ||
						(link.target.name === active && link.source.name === node.name),
				),
		})),
		links: links.map((link) => ({
			link,
			path: edgePath(link),
			dimmed: active !== null && link.source.name !== active && link.target.name !== active,
		})),
	};
});

/** Native tooltip: what the repository is, and where it sits in the project. */
function describe(node: SimNode): string {
	const group = groupTitles.get(node.group) ?? node.group;
	const role = node.role === 'supporting' ? ', supporting' : '';
	return `${node.name} — ${group}${role}${node.description ? `. ${node.description}` : ''}`;
}

/** Where a line leaving `node` towards (dx, dy) crosses its label box. */
function border(node: SimNode, dx: number, dy: number): { x: number; y: number } {
	const halfWidth = node.w / 2 + 4;
	const halfHeight = node.h / 2 + 4;
	const scale = Math.min(
		halfWidth / Math.max(Math.abs(dx), 1e-6),
		halfHeight / Math.max(Math.abs(dy), 1e-6),
	);
	return { x: (node.x ?? 0) + dx * scale, y: (node.y ?? 0) + dy * scale };
}

function edgePath(link: SimLink): string {
	const sx = link.source.x ?? 0;
	const sy = link.source.y ?? 0;
	const tx = link.target.x ?? 0;
	const ty = link.target.y ?? 0;
	const length = Math.hypot(tx - sx, ty - sy) || 1;
	// The control point sits beside the midpoint, perpendicular to the line.
	const cx = (sx + tx) / 2 - ((ty - sy) / length) * link.offset;
	const cy = (sy + ty) / 2 + ((tx - sx) / length) * link.offset;
	const from = border(link.source, cx - sx, cy - sy);
	const to = border(link.target, cx - tx, cy - ty);
	return `M${from.x.toFixed(1)},${from.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`;
}

/** Reads the real width of every label, so boxes and collisions match the text. */
function measure(): void {
	const element = ruler.value;
	if (!element) return;
	for (const node of nodes) {
		element.textContent = node.name;
		const box = element.getBBox();
		node.w = Math.round(box.width) + 16;
		node.h = Math.round(box.height) + 10;
	}
	element.textContent = '';
}

/**
 * Repositories with no relations at all. They are part of the picture — a dozen
 * of them is itself worth seeing — but left to the force layout they drift
 * across the canvas and crowd out everything that does connect, so they get a
 * quiet column of their own down the left edge.
 */
const isolated = new Map<string, number>();
{
	const connected = new Set(links.flatMap((link) => [link.source.name, link.target.name]));
	for (const node of nodes) {
		if (!connected.has(node.name)) isolated.set(node.name, isolated.size);
	}
}

const maxDepth = Math.max(1, ...nodes.map((node) => node.depth));

/**
 * Columns by dependency depth: what nothing is built on sits on the right, so
 * arrows point rightwards — the same reading order as the static diagram.
 */
function columnX(node: SimNode, width: number): number {
	if (isolated.has(node.name)) return width * 0.045;
	return width * (0.92 - (node.depth / maxDepth) * 0.7);
}

/** Only the isolated column is placed vertically; the rest is up to the forces. */
function rowY(node: SimNode, height: number): number {
	const order = isolated.get(node.name);
	if (order === undefined) return height / 2;
	return height * (0.05 + (order / Math.max(isolated.size - 1, 1)) * 0.9);
}

/** Held together in one place because a resize has to reapply all of them. */
function placementForces(
	width: number,
	height: number,
): {
	column: ReturnType<typeof forceX<SimNode>>;
	row: ReturnType<typeof forceY<SimNode>>;
} {
	return {
		column: forceX<SimNode>((node) => columnX(node, width)).strength((node) =>
			isolated.has(node.name) ? 0.9 : 0.34,
		),
		row: forceY<SimNode>((node) => rowY(node, height)).strength((node) =>
			isolated.has(node.name) ? 0.6 : 0.07,
		),
	};
}

function build(): void {
	const { width, height } = size.value;

	nodes.forEach((node, index) => {
		if (node.x === undefined) {
			node.x = columnX(node, width);
			// Golden-ratio spread: deterministic, so the layout is reproducible.
			node.y = isolated.has(node.name)
				? rowY(node, height)
				: height * (((index * 0.618033988749895) % 1) * 0.86 + 0.07);
		}
	});

	const placement = placementForces(width, height);
	simulation = forceSimulation<SimNode, SimLink>(nodes)
		.force(
			'link',
			forceLink<SimNode, SimLink>(links)
				.id((node) => node.name)
				.distance(85)
				.strength(0.45),
		)
		// Isolated nodes barely push: their column should stay narrow.
		.force(
			'charge',
			forceManyBody<SimNode>()
				.strength((node) => (isolated.has(node.name) ? -40 : -260))
				.distanceMax(400),
		)
		.force('collide', forceCollide<SimNode>((node) => node.w / 2 + 12).strength(0.9))
		.force('column', placement.column)
		.force('row', placement.row)
		.on('tick', () => {
			frame.value++;
			if (!userMoved) fitView();
		});

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		simulation.stop();
		for (let step = 0; step < 300; step++) simulation.tick();
		frame.value++;
	}
}

/**
 * A force layout has no idea how big the viewport is, so the camera follows it:
 * every tick the view is refitted around the nodes. As soon as the reader pans,
 * zooms or drags something, that stops — the view is theirs from then on, until
 * they ask for it back.
 */
let userMoved = false;

function fitView(): void {
	const element = svg.value;
	if (!element) return;

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const node of nodes) {
		minX = Math.min(minX, (node.x ?? 0) - node.w / 2);
		maxX = Math.max(maxX, (node.x ?? 0) + node.w / 2);
		minY = Math.min(minY, (node.y ?? 0) - node.h / 2);
		maxY = Math.max(maxY, (node.y ?? 0) + node.h / 2);
	}
	if (!Number.isFinite(minX)) return;

	const padding = 24;
	const { width, height } = size.value;
	const scale = Math.min(
		1.1,
		Math.max(0.25, (width - padding * 2) / Math.max(maxX - minX, 1)),
		Math.max(0.25, (height - padding * 2) / Math.max(maxY - minY, 1)),
	);
	const next = zoomIdentity
		.translate(width / 2 - ((minX + maxX) / 2) * scale, height / 2 - ((minY + maxY) / 2) * scale)
		.scale(scale);

	transform.value = next;
	// Keep d3-zoom's own state in step, or the next pan would jump.
	zoomBehaviour.transform(select(element), next);
}

function resetView(): void {
	userMoved = false;
	simulation?.alpha(0.6).restart();
	fitView();
}

const zoomBehaviour = zoom<SVGSVGElement, unknown>()
	.scaleExtent([0.25, 3])
	.on('zoom', (event: { transform: ZoomTransform; sourceEvent: unknown }) => {
		transform.value = event.transform;
		// sourceEvent is null when fitView moved the camera itself.
		if (event.sourceEvent) userMoved = true;
	});

/** Node dragging. d3-zoom owns the canvas, so the nodes handle their own pointers. */
let dragging: SimNode | undefined;

function graphPoint(event: PointerEvent): { x: number; y: number } {
	const box = svg.value?.getBoundingClientRect();
	const scale = transform.value.k;
	return {
		x: (event.clientX - (box?.left ?? 0) - transform.value.x) / scale,
		y: (event.clientY - (box?.top ?? 0) - transform.value.y) / scale,
	};
}

function startDrag(event: PointerEvent, node: SimNode): void {
	event.stopPropagation();
	(event.target as Element).setPointerCapture(event.pointerId);
	dragging = node;
	userMoved = true;
	const point = graphPoint(event);
	node.fx = point.x;
	node.fy = point.y;
	simulation?.alphaTarget(0.25).restart();
}

function moveDrag(event: PointerEvent): void {
	if (!dragging) return;
	const point = graphPoint(event);
	dragging.fx = point.x;
	dragging.fy = point.y;
}

function endDrag(): void {
	if (!dragging) return;
	// Released nodes stay where they were put; a reset lets the layout reclaim them.
	simulation?.alphaTarget(0);
	dragging = undefined;
}

onMounted(() => {
	const element = root.value;
	if (!element) return;

	observer = new ResizeObserver(([entry]) => {
		const width = Math.max(320, entry.contentRect.width);
		const height = Math.max(320, entry.contentRect.height);
		if (width === size.value.width && height === size.value.height) return;
		size.value = { width, height };
		const placement = placementForces(width, height);
		simulation
			?.force('column', placement.column)
			.force('row', placement.row)
			.alpha(0.3)
			.restart();
	});
	observer.observe(element);

	const box = element.getBoundingClientRect();
	size.value = { width: Math.max(320, box.width), height: Math.max(320, box.height) };

	measure();
	if (svg.value) select(svg.value).call(zoomBehaviour);
	build();
	fitView();
	ready.value = true;
});

onBeforeUnmount(() => {
	simulation?.stop();
	observer?.disconnect();
});
</script>

<template>
	<figure class="dependency-graph">
		<div ref="root" class="canvas">
			<svg
				ref="svg"
				class="stage"
				:viewBox="`0 0 ${size.width} ${size.height}`"
				:aria-label="`Dependencies between ${nodes.length} repositories`"
				@pointermove="moveDrag"
				@pointerup="endDrag"
				@pointercancel="endDrag"
			>
				<defs>
					<marker
						v-for="kind in usedKinds"
						:id="`dg-arrow-${kind.id}`"
						:key="kind.id"
						class="arrow"
						:class="`kind-${kind.id}`"
						viewBox="0 0 10 10"
						refX="9"
						refY="5"
						markerWidth="7"
						markerHeight="7"
						markerUnits="userSpaceOnUse"
						orient="auto-start-reverse"
					>
						<path d="M0,0.5 L10,5 L0,9.5 z" />
					</marker>
				</defs>

				<!-- Off-screen ruler, used once to measure the labels. -->
				<text ref="ruler" class="label ruler" x="-9999" y="-9999" />

				<g
					v-if="ready"
					:transform="`translate(${transform.x},${transform.y}) scale(${transform.k})`"
				>
					<path
						v-for="(edge, index) in view.links"
						:key="index"
						class="link"
						:class="[`kind-${edge.link.kind}`, { dimmed: edge.dimmed }]"
						:d="edge.path"
						:marker-end="`url(#dg-arrow-${edge.link.kind})`"
					/>

					<g
						v-for="entry in view.nodes"
						:key="entry.node.name"
						class="node"
						:class="[`role-${entry.node.role}`, { dimmed: entry.dimmed }]"
						:style="{ '--dg-hue': hues.get(entry.node.group) ?? 0 }"
						:transform="`translate(${entry.node.x ?? 0},${entry.node.y ?? 0})`"
						@pointerdown="startDrag($event, entry.node)"
						@pointerenter="hovered = entry.node.name"
						@pointerleave="hovered = null"
					>
						<title>{{ describe(entry.node) }}</title>
						<rect
							:x="-entry.node.w / 2"
							:y="-entry.node.h / 2"
							:width="entry.node.w"
							:height="entry.node.h"
							rx="5"
						/>
						<text class="label" dy="0.35em">{{ entry.node.name }}</text>
					</g>
				</g>
			</svg>

			<p v-if="!ready" class="loading">Preparing the layout…</p>

			<button class="reset" type="button" @click="resetView">Reset view</button>
		</div>

		<figcaption class="legend">
			<span v-for="kind in usedKinds" :key="kind.id" class="swatch" :class="`kind-${kind.id}`">
				<svg viewBox="0 0 26 8" aria-hidden="true"><path d="M1,4 L25,4" /></svg>
				{{ kind.title }}
			</span>
			<span class="swatch role"
				><span class="box supporting" aria-hidden="true" /> supporting repository</span
			>
			<span class="hint">Drag the nodes, scroll to zoom, hover to isolate.</span>
		</figcaption>
	</figure>
</template>

<style scoped>
/*
 * Every colour is oklch with a per-group hue passed in as --dg-hue, so the six
 * groups stay distinguishable and the whole palette moves in one step between
 * light and dark mode.
 */
.dependency-graph {
	--dg-fill-l: 0.95;
	--dg-fill-c: 0.045;
	--dg-stroke-l: 0.62;
	--dg-stroke-c: 0.11;
	--dg-line-l: 0.58;
	--dg-line-c: 0.13;

	margin: 24px 0;

	/*
	 * A dependency graph in a 688px prose column is unreadable, so the figure
	 * steps outside it: centred, never wider than the viewport minus a gutter.
	 */
	width: min(100vw - 48px, 1000px);
	margin-inline: calc(50% - min(50vw - 24px, 500px));
}

/*
 * Written as a plain descendant selector: scoped CSS keeps the class on the
 * last element of the selector, so `.dark` stays a real ancestor. Wrapping it
 * in :global() instead drops the descendant part and the override lands on
 * <html>, where the element's own values beat it.
 */
.dark .dependency-graph {
	--dg-fill-l: 0.27;
	--dg-fill-c: 0.04;
	--dg-stroke-l: 0.68;
	--dg-stroke-c: 0.1;
	--dg-line-l: 0.7;
	--dg-line-c: 0.12;
}

.canvas {
	position: relative;
	height: clamp(420px, 62vh, 720px);
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-alt);
	overflow: hidden;
}

.stage {
	display: block;
	width: 100%;
	height: 100%;
	touch-action: none;
	cursor: grab;
}

.stage:active {
	cursor: grabbing;
}

.loading {
	position: absolute;
	inset: 0;
	display: grid;
	place-content: center;
	margin: 0;
	color: var(--vp-c-text-3);
}

.reset {
	position: absolute;
	top: 10px;
	right: 10px;
	padding: 4px 10px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg);
	color: var(--vp-c-text-2);
	font-size: 12px;
}

.reset:hover {
	border-color: var(--vp-c-brand-1);
	color: var(--vp-c-brand-1);
}

/* Nodes ------------------------------------------------------------------ */

.node {
	cursor: grab;
	transition: opacity 0.2s ease;
}

.node rect {
	fill: oklch(var(--dg-fill-l) var(--dg-fill-c) var(--dg-hue));
	stroke: oklch(var(--dg-stroke-l) var(--dg-stroke-c) var(--dg-hue));
	stroke-width: 1.2;
}

.node.role-supporting rect {
	stroke-dasharray: 4 3;
	fill-opacity: 0.55;
}

.node .label {
	fill: var(--vp-c-text-1);
	font-size: 12px;
	text-anchor: middle;
	pointer-events: none;
	user-select: none;
}

.label.ruler {
	font-size: 12px;
}

.node.dimmed,
.link.dimmed {
	opacity: 0.12;
}

/* Links ------------------------------------------------------------------ */

.link {
	fill: none;
	stroke-width: 1.4;
	transition: opacity 0.2s ease;
}

.kind-npm {
	--dg-hue: 265;
}
.kind-cargo {
	--dg-hue: 45;
}
.kind-docker {
	--dg-hue: 215;
}
.kind-download {
	--dg-hue: 150;
}
.kind-workflow {
	--dg-hue: 330;
}
.kind-manual {
	--dg-hue: 285;
}

.link.kind-docker {
	stroke-width: 2.4;
}
.link.kind-download {
	stroke-dasharray: 7 4;
}
.link.kind-workflow {
	stroke-dasharray: 2 3;
}
.link.kind-manual {
	stroke-dasharray: 1 4;
	stroke-linecap: round;
}

.link,
.arrow path {
	stroke: oklch(var(--dg-line-l) var(--dg-line-c) var(--dg-hue));
}

.arrow path {
	fill: oklch(var(--dg-line-l) var(--dg-line-c) var(--dg-hue));
	stroke: none;
}

/* Legend ----------------------------------------------------------------- */

.legend {
	display: flex;
	flex-wrap: wrap;
	gap: 6px 18px;
	margin-top: 10px;
	color: var(--vp-c-text-2);
	font-size: 13px;
	text-align: left;
}

.swatch {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.swatch svg {
	width: 26px;
	height: 8px;
	overflow: visible;
}

.swatch path {
	fill: none;
	stroke: oklch(var(--dg-line-l) var(--dg-line-c) var(--dg-hue));
	stroke-width: 1.6;
}

.swatch.kind-docker path {
	stroke-width: 2.6;
}
.swatch.kind-download path {
	stroke-dasharray: 7 4;
}
.swatch.kind-workflow path {
	stroke-dasharray: 2 3;
}
.swatch.kind-manual path {
	stroke-dasharray: 1 4;
}

.swatch .box {
	width: 22px;
	height: 12px;
	border-radius: 3px;
	border: 1.2px dashed var(--vp-c-text-3);
	background: var(--vp-c-bg-soft);
}

.hint {
	width: 100%;
	color: var(--vp-c-text-3);
}

@media (prefers-reduced-motion: reduce) {
	.node,
	.link {
		transition: none;
	}
}
</style>
