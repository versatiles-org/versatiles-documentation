<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import {
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type ForceLink,
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
	/** Where the layout wants this node, and how firmly it is held there. */
	targetX: number;
	targetY: number;
	anchor: number;
}

/** The relation kinds the generator defines, without importing them twice. */
type EdgeKind = GraphLink['kind'];

interface SimLink extends SimulationLinkDatum<SimNode> {
	source: SimNode;
	target: SimNode;
	kind: EdgeKind;
	/** Sideways shift, so links between the same pair do not lie on top of each other. */
	offset: number;
}

/** Horizontal distance between two layers, in layout units. */
const COLUMN = 240;
/** Smallest gap a dependency arrow has to span, measured between label boxes. */
const MIN_SPAN = 40;

/** The nodes are created once and never replaced: their positions are the state. */
const nodes: SimNode[] = data.nodes.map((node) => ({
	...node,
	w: 90,
	h: 22,
	targetX: 0,
	targetY: 0,
	anchor: 0.35,
}));
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

const kindWeight = new Map(data.kinds.map((kind) => [kind.id, kind.weight]));
const usedKinds = data.kinds.filter((kind) => links.some((link) => link.kind === kind.id));
const hues = new Map(
	data.groups.map((group, index) => [
		group.id,
		Math.round((index * 360) / data.groups.length + 25),
	]),
);
const groupTitles = new Map(data.groups.map((group) => [group.id, group.title]));

/* --------------------------------------------------------------------------
 * Filters
 * ----------------------------------------------------------------------- */

const kindOn = reactive<Record<string, boolean>>(
	Object.fromEntries(usedKinds.map((kind) => [kind.id, true])),
);
const roleOn = reactive({ productive: true, supporting: true });
const hideUnconnected = ref(true);

/**
 * What the filters leave standing. Hidden nodes stay in the DOM and keep their
 * position — they are only taken out of the simulation — so switching a filter
 * back on brings them in from where they were rather than from nowhere.
 */
const visible = computed(() => {
	const shown = new Map<string, boolean>();
	for (const node of nodes) shown.set(node.name, roleOn[node.role]);

	const activeLinks = links.filter(
		(link) => kindOn[link.kind] && shown.get(link.source.name) && shown.get(link.target.name),
	);

	if (hideUnconnected.value) {
		const touched = new Set(activeLinks.flatMap((link) => [link.source.name, link.target.name]));
		for (const node of nodes) if (!touched.has(node.name)) shown.set(node.name, false);
	}

	return { shown, links: activeLinks, nodes: nodes.filter((node) => shown.get(node.name)) };
});

/* --------------------------------------------------------------------------
 * Layering: which column a repository belongs in
 * ----------------------------------------------------------------------- */

/**
 * Gives every repository a layer, such that each dependency runs from a higher
 * layer to a lower one — left to right on screen.
 *
 * Dependencies are not quite a tree: versatiles-frontend triggers the Docker
 * build, and that build downloads a frontend release. A cycle like this cannot
 * be drawn in one direction, so the weakest link in it is set aside before the
 * layers are counted. Links are considered strongest first, which means a
 * build-time dependency is never the one sacrificed to a CI trigger.
 */
function layering(names: string[], active: SimLink[]): Map<string, number> {
	const forward = new Map(names.map((name) => [name, new Set<string>()]));

	const reaches = (from: string, to: string): boolean => {
		const stack = [from];
		const seen = new Set(stack);
		while (stack.length > 0) {
			const at = stack.pop() ?? '';
			if (at === to) return true;
			for (const next of forward.get(at) ?? []) {
				if (!seen.has(next)) {
					seen.add(next);
					stack.push(next);
				}
			}
		}
		return false;
	};

	const strongestFirst = [...active].sort(
		(a, b) =>
			(kindWeight.get(b.kind) ?? 0) - (kindWeight.get(a.kind) ?? 0) ||
			a.source.name.localeCompare(b.source.name) ||
			a.target.name.localeCompare(b.target.name),
	);
	for (const link of strongestFirst) {
		const from = link.source.name;
		const to = link.target.name;
		if (from === to || !forward.has(from) || !forward.has(to)) continue;
		// Accepting this link would close a cycle, so it does not define a layer.
		if (reaches(to, from)) continue;
		forward.get(from)?.add(to);
	}

	const depth = new Map<string, number>();
	const measureDepth = (name: string): number => {
		const known = depth.get(name);
		if (known !== undefined) return known;
		depth.set(name, 0);
		let deepest = 0;
		for (const next of forward.get(name) ?? []) {
			deepest = Math.max(deepest, 1 + measureDepth(next));
		}
		depth.set(name, deepest);
		return deepest;
	};
	for (const name of names) measureDepth(name);
	return depth;
}

/* --------------------------------------------------------------------------
 * Simulation
 * ----------------------------------------------------------------------- */

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
let linkForce: ForceLink<SimNode, SimLink> | undefined;
let observer: ResizeObserver | undefined;
/** The links the layout currently has to satisfy. */
let activeLinks: SimLink[] = [];
const activeLinkSet = new Set<SimLink>();

/**
 * Pushes the ends of every dependency apart until its arrow points rightwards
 * with room to spare. The column force alone only expresses a preference; this
 * one acts on the links themselves, so a node pulled off course by its
 * neighbours still ends up on the correct side of what it depends on.
 */
function directionForce(alpha: number): void {
	for (const link of activeLinks) {
		const gap = link.source.w / 2 + link.target.w / 2 + MIN_SPAN;
		const short = gap - ((link.target.x ?? 0) - (link.source.x ?? 0));
		if (short <= 0) continue;
		// Capped, so a badly placed node eases into position instead of bolting.
		const push = Math.min(short, 160) * 0.5 * alpha;
		link.source.vx = (link.source.vx ?? 0) - push;
		link.target.vx = (link.target.vx ?? 0) + push;
	}
}

function reducedMotion(): boolean {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/** Recomputes the columns and hands the simulation its new subgraph. */
function applyFilters(): void {
	if (!simulation || !linkForce) return;

	const shownNodes = visible.value.nodes;
	activeLinks = visible.value.links;
	activeLinkSet.clear();
	for (const link of activeLinks) activeLinkSet.add(link);

	const names = shownNodes.map((node) => node.name);
	const depth = layering(names, activeLinks);
	const deepest = Math.max(0, ...depth.values());

	// Repositories with nothing left to connect to get a quiet column of their
	// own, ahead of the deepest layer, instead of drifting through the picture.
	const loose = names.filter(
		(name) => !activeLinks.some((link) => link.source.name === name || link.target.name === name),
	);
	const looseOrder = new Map(loose.map((name, index) => [name, index]));

	for (const node of shownNodes) {
		const order = looseOrder.get(node.name);
		if (order === undefined) {
			node.targetX = (deepest - (depth.get(node.name) ?? 0)) * COLUMN;
			node.targetY = 0;
			node.anchor = 0.35;
		} else {
			node.targetX = -COLUMN;
			node.targetY = (order - (loose.length - 1) / 2) * 42;
			node.anchor = 0.9;
		}
	}

	simulation.nodes(shownNodes);
	linkForce.links(activeLinks);
	// A filter change reframes the picture; whatever the reader was looking at
	// may not even be on screen any more.
	userMoved = false;

	if (reducedMotion()) {
		simulation.alpha(1).stop();
		for (let step = 0; step < 300; step++) simulation.tick();
		frame.value++;
		fitView();
	} else {
		simulation.alpha(0.9).restart();
	}
}

function build(): void {
	linkForce = forceLink<SimNode, SimLink>([])
		.id((node) => node.name)
		.distance(110)
		.strength(0.3);

	simulation = forceSimulation<SimNode, SimLink>([])
		.force('link', linkForce)
		.force('charge', forceManyBody<SimNode>().strength(-420).distanceMax(520))
		.force(
			'column',
			forceX<SimNode>((node) => node.targetX).strength((node) => node.anchor),
		)
		.force('row', forceY<SimNode>((node) => node.targetY).strength(0.06))
		.force('direction', directionForce)
		// Registered last so it settles the overlaps the other forces create:
		// d3 applies forces in the order they were added.
		.force(
			'collide',
			forceCollide<SimNode>((node) => node.w / 2 + 12)
				.strength(0.9)
				.iterations(3),
		)
		.on('tick', () => {
			frame.value++;
			if (!userMoved) fitView();
		});
}

/* --------------------------------------------------------------------------
 * Camera
 * ----------------------------------------------------------------------- */

/**
 * The layout lives in its own coordinates, so the camera follows it: every tick
 * the view is refitted around the visible nodes. As soon as the reader pans,
 * zooms or drags something, that stops — the view is theirs from then on, until
 * they change a filter or ask for it back.
 */
let userMoved = false;

function fitView(): void {
	const element = svg.value;
	if (!element) return;

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const node of visible.value.nodes) {
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
		Math.max(0.2, (width - padding * 2) / Math.max(maxX - minX, 1)),
		Math.max(0.2, (height - padding * 2) / Math.max(maxY - minY, 1)),
	);
	const next = zoomIdentity
		.translate(width / 2 - ((minX + maxX) / 2) * scale, height / 2 - ((minY + maxY) / 2) * scale)
		.scale(scale);

	transform.value = next;
	// Keep d3-zoom's own state in step, or the next pan would jump.
	zoomBehaviour.transform(select(element), next);
}

function resetView(): void {
	// Anything the reader dragged out of place goes back to the layout.
	for (const node of nodes) {
		node.fx = null;
		node.fy = null;
	}
	userMoved = false;
	simulation?.alpha(0.8).restart();
	fitView();
}

const zoomBehaviour = zoom<SVGSVGElement, unknown>()
	.scaleExtent([0.2, 3])
	.on('zoom', (event: { transform: ZoomTransform; sourceEvent: unknown }) => {
		transform.value = event.transform;
		// sourceEvent is null when fitView moved the camera itself.
		if (event.sourceEvent) userMoved = true;
	});

/* --------------------------------------------------------------------------
 * Rendering
 * ----------------------------------------------------------------------- */

const view = computed(() => {
	const active = hovered.value;
	const shown = visible.value.shown;

	const neighbours = new Set<string>();
	if (active !== null) {
		neighbours.add(active);
		for (const link of activeLinks) {
			if (link.source.name === active) neighbours.add(link.target.name);
			if (link.target.name === active) neighbours.add(link.source.name);
		}
	}

	return {
		// Read so the render follows the simulation; the value itself is not used.
		tick: frame.value,
		nodes: nodes.map((node) => ({
			node,
			hidden: !shown.get(node.name),
			dimmed: active !== null && !neighbours.has(node.name),
		})),
		links: links.map((link) => ({
			link,
			path: edgePath(link),
			hidden: !activeLinkSet.has(link),
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

/* --------------------------------------------------------------------------
 * Interaction
 * ----------------------------------------------------------------------- */

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
	// Released nodes stay where they were put; "Reset view" reclaims them.
	simulation?.alphaTarget(0);
	dragging = undefined;
}

/* --------------------------------------------------------------------------
 * Lifecycle
 * ----------------------------------------------------------------------- */

watch(visible, applyFilters);

onMounted(() => {
	const element = root.value;
	if (!element) return;

	observer = new ResizeObserver(([entry]) => {
		const width = Math.max(280, entry.contentRect.width);
		const height = Math.max(280, entry.contentRect.height);
		if (width === size.value.width && height === size.value.height) return;
		size.value = { width, height };
		// The layout has its own coordinates, so only the camera has to react.
		fitView();
	});
	observer.observe(element);

	const box = element.getBoundingClientRect();
	size.value = { width: Math.max(280, box.width), height: Math.max(280, box.height) };

	measure();
	if (svg.value) select(svg.value).call(zoomBehaviour);
	build();

	// Deterministic starting positions, so the same filters always settle the same way.
	nodes.forEach((node, index) => {
		node.x = 0;
		node.y = (((index * 0.618033988749895) % 1) - 0.5) * 520;
	});

	applyFilters();
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
		<div class="controls">
			<div class="group" role="group" aria-label="Kinds of dependency">
				<span class="group-label">Dependencies</span>
				<button
					v-for="kind in usedKinds"
					:key="kind.id"
					type="button"
					class="chip"
					:class="[`kind-${kind.id}`, { off: !kindOn[kind.id] }]"
					:aria-pressed="kindOn[kind.id]"
					@click="kindOn[kind.id] = !kindOn[kind.id]"
				>
					<svg viewBox="0 0 26 8" aria-hidden="true"><path d="M1,4 L25,4" /></svg>
					{{ kind.title }}
				</button>
			</div>

			<div class="group" role="group" aria-label="Kinds of repository">
				<span class="group-label">Repositories</span>
				<button
					type="button"
					class="chip role"
					:class="{ off: !roleOn.productive }"
					:aria-pressed="roleOn.productive"
					@click="roleOn.productive = !roleOn.productive"
				>
					<span class="box" aria-hidden="true" />
					productive
				</button>
				<button
					type="button"
					class="chip role"
					:class="{ off: !roleOn.supporting }"
					:aria-pressed="roleOn.supporting"
					@click="roleOn.supporting = !roleOn.supporting"
				>
					<span class="box supporting" aria-hidden="true" />
					supporting
				</button>
				<button
					type="button"
					class="chip plain"
					:class="{ off: !hideUnconnected }"
					:aria-pressed="hideUnconnected"
					@click="hideUnconnected = !hideUnconnected"
				>
					hide unconnected
				</button>
			</div>

			<button type="button" class="chip plain reset" @click="resetView">Reset view</button>
		</div>

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
						:class="[`kind-${edge.link.kind}`, { dimmed: edge.dimmed, hidden: edge.hidden }]"
						:d="edge.path"
						:marker-end="`url(#dg-arrow-${edge.link.kind})`"
					/>

					<g
						v-for="entry in view.nodes"
						:key="entry.node.name"
						class="node"
						:class="[
							`role-${entry.node.role}`,
							{ dimmed: entry.dimmed, hidden: entry.hidden },
						]"
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
		</div>

		<figcaption class="status">
			Showing {{ visible.nodes.length }} of {{ nodes.length }} repositories and
			{{ visible.links.length }} of {{ links.length }} dependencies. Arrows run left to right,
			from a repository to what it depends on. Drag a node to pull it out, scroll to zoom, hover
			to isolate.
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

/* Controls --------------------------------------------------------------- */

.controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 16px;
	margin-bottom: 10px;
}

.group {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.group-label {
	color: var(--vp-c-text-3);
	font-size: 13px;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px 10px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 999px;
	background: var(--vp-c-bg);
	color: var(--vp-c-text-1);
	font-size: 13px;
	line-height: 1.5;
	transition:
		opacity 0.15s ease,
		border-color 0.15s ease;
}

.chip:hover {
	border-color: var(--vp-c-brand-1);
}

.chip.off {
	opacity: 0.45;
	color: var(--vp-c-text-3);
}

.chip svg {
	width: 26px;
	height: 8px;
	overflow: visible;
}

.chip path {
	fill: none;
	stroke: oklch(var(--dg-line-l) var(--dg-line-c) var(--dg-hue));
	stroke-width: 1.6;
}

.chip.kind-docker path {
	stroke-width: 2.6;
}
.chip.kind-download path {
	stroke-dasharray: 7 4;
}
.chip.kind-workflow path {
	stroke-dasharray: 2 3;
}
.chip.kind-manual path {
	stroke-dasharray: 1 4;
}

.chip .box {
	width: 20px;
	height: 12px;
	border-radius: 3px;
	border: 1.2px solid var(--vp-c-text-3);
	background: var(--vp-c-bg-soft);
}

.chip .box.supporting {
	border-style: dashed;
}

.reset {
	margin-left: auto;
}

/* Canvas ----------------------------------------------------------------- */

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

/* Nodes ------------------------------------------------------------------ */

.node {
	cursor: grab;
	transition: opacity 0.25s ease;
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

.node.hidden,
.link.hidden {
	opacity: 0;
	pointer-events: none;
}

/* Links ------------------------------------------------------------------ */

.link {
	fill: none;
	stroke-width: 1.4;
	transition: opacity 0.25s ease;
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

/* Caption ---------------------------------------------------------------- */

.status {
	margin-top: 8px;
	color: var(--vp-c-text-3);
	font-size: 13px;
	text-align: left;
}

@media (prefers-reduced-motion: reduce) {
	.node,
	.link,
	.chip {
		transition: none;
	}
}
</style>
