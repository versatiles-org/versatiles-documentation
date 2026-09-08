<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import dagre from '@dagrejs/dagre';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { data, type GraphLink, type GraphNode } from '../../../compendium/dependency_graph.data';

/** The relation kinds the generator defines, without importing them twice. */
type EdgeKind = GraphLink['kind'];

interface Point {
	x: number;
	y: number;
}

interface Box extends GraphNode {
	/** Label box, measured once from the rendered text. */
	w: number;
	h: number;
}

interface Link {
	source: Box;
	target: Box;
	kind: EdgeKind;
	/** Sideways shift, so links between the same pair do not lie on top of each other. */
	offset: number;
}

/** Gap between layers, and between neighbours inside one. */
const RANK_GAP = 90;
const NODE_GAP = 26;
/** How many points a routed edge is resampled to before being animated. */
const SHAPE_POINTS = 20;
const TWEEN_MS = 450;

const nodes: Box[] = data.nodes.map((node) => ({ ...node, w: 90, h: 22 }));
const byName = new Map(nodes.map((node) => [node.name, node]));

const links: Link[] = (() => {
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
		return [{ source, target, kind: link.kind, offset: (index % 2 ? -1 : 1) * (9 * index) }];
	});
})();

const kindWeight = new Map(data.kinds.map((kind) => [kind.id, kind.weight]));
const kindLine = new Map(data.kinds.map((kind) => [kind.id, kind.line]));

/** Width and dashes for a link, as inline attributes rather than a class per kind. */
function lineStyle(kind: EdgeKind): Record<string, string> {
	const line = kindLine.get(kind);
	return {
		'stroke-width': String(line?.width ?? 1.5),
		'stroke-dasharray': line?.dash ?? 'none',
	};
}
const usedKinds = data.kinds.filter((kind) => links.some((link) => link.kind === kind.id));
const hues = new Map(
	data.tags.map((tag, index) => [tag.id, Math.round((index * 360) / data.tags.length + 25)]),
);
const tagTitles = new Map(data.tags.map((tag) => [tag.id, tag.title]));

/** A repository can carry several tags; the first one decides its colour. */
function primaryTag(node: GraphNode): string {
	return node.tags[0] ?? '';
}

/* --------------------------------------------------------------------------
 * Filters
 * ----------------------------------------------------------------------- */

const kindOn = reactive<Record<string, boolean>>(
	Object.fromEntries(usedKinds.map((kind) => [kind.id, true])),
);
const tagOn = reactive<Record<string, boolean>>(
	Object.fromEntries(data.tags.map((tag) => [tag.id, true])),
);
const hideUnconnected = ref(true);

/**
 * What the filters leave standing. Hidden nodes stay in the DOM and keep their
 * last position — they are only left out of the layout — so switching a filter
 * back on brings them in from where they were rather than from nowhere.
 */
const visible = computed(() => {
	const shown = new Map<string, boolean>();
	// More than one tag can apply, so a repository stays as long as any of its
	// tags is switched on.
	for (const node of nodes) {
		shown.set(
			node.name,
			node.tags.some((tag) => tagOn[tag]),
		);
	}

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
 * Layout
 * ----------------------------------------------------------------------- */

interface Layout {
	nodes: Map<string, Point>;
	/** Routed polylines, keyed by the link's index in `links`. */
	edges: Map<number, Point[]>;
}

/**
 * Lays the graph out with dagre, which is what this kind of picture actually
 * needs: it ranks the repositories so every dependency points the same way,
 * orders each rank to cut down on crossings, lines the ranks up, and routes
 * long edges through the gaps between them instead of across the labels.
 *
 * Cycles — versatiles-frontend triggers the Docker build, which downloads a
 * frontend release — are broken by dagre itself. Edge weights are the kind
 * weights, so when it has to reverse one it reverses a CI trigger rather than
 * a build-time dependency.
 */
function computeLayout(): Layout {
	const shownNodes = visible.value.nodes;
	const activeLinks = visible.value.links;
	const connected = new Set(activeLinks.flatMap((link) => [link.source.name, link.target.name]));

	const graph = new dagre.graphlib.Graph({ multigraph: true, directed: true });
	graph.setGraph({
		rankdir: 'LR',
		ranksep: RANK_GAP,
		nodesep: NODE_GAP,
		edgesep: 14,
		marginx: 8,
		marginy: 8,
		acyclicer: 'greedy',
		ranker: 'network-simplex',
	});
	graph.setDefaultEdgeLabel(() => ({}));

	for (const node of shownNodes) {
		if (connected.has(node.name)) graph.setNode(node.name, { width: node.w, height: node.h });
	}
	const indexed: { link: Link; index: number }[] = [];
	links.forEach((link, index) => {
		if (!activeLinks.includes(link)) return;
		indexed.push({ link, index });
		graph.setEdge(
			link.source.name,
			link.target.name,
			{ weight: kindWeight.get(link.kind) ?? 1, minlen: 1 },
			String(index),
		);
	});

	dagre.layout(graph);

	const placed = new Map<string, Point>();
	for (const name of graph.nodes()) {
		const node = graph.node(name) as { x?: number; y?: number } | undefined;
		if (node?.x !== undefined && node.y !== undefined) placed.set(name, { x: node.x, y: node.y });
	}

	// Repositories with nothing left to connect to get a quiet column of their
	// own, to the left of everything, instead of padding out the first rank.
	const loose = shownNodes.filter((node) => !connected.has(node.name));
	if (loose.length > 0) {
		const height = (graph.graph() as { height?: number }).height ?? 0;
		const stack = loose.reduce((sum, node) => sum + node.h + 12, -12);
		const widest = Math.max(...loose.map((node) => node.w));
		let y = height / 2 - stack / 2;
		for (const node of loose) {
			placed.set(node.name, { x: -widest / 2 - RANK_GAP, y: y + node.h / 2 });
			y += node.h + 12;
		}
	}

	const routed = new Map<number, Point[]>();
	for (const { link, index } of indexed) {
		const edge = graph.edge({
			v: link.source.name,
			w: link.target.name,
			name: String(index),
		}) as { points?: Point[] } | undefined;
		const points = edge?.points ?? [];
		routed.set(index, points.length >= 2 ? bow(points, link.offset) : points);
	}

	return { nodes: placed, edges: routed };
}

/**
 * Bends parallel links apart. dagre routes them along the same line, so the
 * middle of each is pushed sideways while the ends stay on the node borders.
 */
function bow(points: Point[], offset: number): Point[] {
	if (offset === 0) return points;
	const first = points[0];
	const last = points[points.length - 1];
	const length = Math.hypot(last.x - first.x, last.y - first.y) || 1;
	const nx = -(last.y - first.y) / length;
	const ny = (last.x - first.x) / length;
	const span = points.length - 1;
	return points.map((point, index) => {
		const push = Math.sin((Math.PI * index) / span) * offset;
		return { x: point.x + nx * push, y: point.y + ny * push };
	});
}

/** Resamples a polyline to a fixed number of evenly spaced points. */
function resample(points: Point[], count: number): Point[] {
	if (points.length === 0) return [];
	if (points.length === 1) return Array.from({ length: count }, () => points[0]);

	const along = [0];
	for (let i = 1; i < points.length; i++) {
		along.push(
			along[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
		);
	}
	const total = along[along.length - 1] || 1;

	const out: Point[] = [];
	let segment = 1;
	for (let i = 0; i < count; i++) {
		const target = (total * i) / (count - 1);
		while (segment < points.length - 1 && along[segment] < target) segment++;
		const from = points[segment - 1];
		const to = points[segment];
		const span = along[segment] - along[segment - 1] || 1;
		const fraction = Math.min(1, Math.max(0, (target - along[segment - 1]) / span));
		out.push({
			x: from.x + (to.x - from.x) * fraction,
			y: from.y + (to.y - from.y) * fraction,
		});
	}
	return out;
}

/* --------------------------------------------------------------------------
 * Animation
 * ----------------------------------------------------------------------- */

const root = ref<HTMLElement>();
const figure = ref<HTMLElement>();
const svg = ref<SVGSVGElement>();
const ruler = ref<SVGTextElement>();
const ready = ref(false);
const expanded = ref(false);
const size = ref({ width: 960, height: 560 });
const transform = shallowRef<ZoomTransform>(zoomIdentity);
const hovered = ref<string | null>(null);

/** Bumped on every animation frame; the render reads it to stay in step. */
const frame = ref(0);

/** Where everything is drawn right now, which is what the tween moves. */
const shown: Layout = { nodes: new Map(), edges: new Map() };
let tween: { from: Layout; to: Layout; start: number } | undefined;
let raf = 0;

function reducedMotion(): boolean {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

function ease(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function settle(target: Layout): void {
	for (const [name, point] of target.nodes) shown.nodes.set(name, point);
	for (const [index, points] of target.edges) shown.edges.set(index, points);
	frame.value++;
	if (!userMoved) fitView();
}

/**
 * The layout is recomputed from scratch on every change, so both ends of the
 * move are known: nodes slide from where they were to where they belong, and
 * edges are resampled to a common point count so their shapes can do the same.
 * Anything that was not on screen before starts at its destination and fades in.
 */
function animateTo(target: Layout): void {
	if (reducedMotion()) {
		settle(target);
		return;
	}

	const from: Layout = { nodes: new Map(), edges: new Map() };
	for (const [name, point] of target.nodes) from.nodes.set(name, shown.nodes.get(name) ?? point);
	for (const [index, points] of target.edges) {
		const previous = shown.edges.get(index);
		from.edges.set(
			index,
			resample(previous && previous.length >= 2 ? previous : points, SHAPE_POINTS),
		);
	}
	const to: Layout = { nodes: target.nodes, edges: new Map() };
	for (const [index, points] of target.edges) to.edges.set(index, resample(points, SHAPE_POINTS));

	tween = { from, to, start: performance.now() };
	cancelAnimationFrame(raf);
	raf = requestAnimationFrame(step);
}

function step(now: number): void {
	if (!tween) return;
	const t = Math.min(1, (now - tween.start) / TWEEN_MS);
	const k = ease(t);

	for (const [name, end] of tween.to.nodes) {
		const begin = tween.from.nodes.get(name) ?? end;
		shown.nodes.set(name, {
			x: begin.x + (end.x - begin.x) * k,
			y: begin.y + (end.y - begin.y) * k,
		});
	}
	for (const [index, end] of tween.to.edges) {
		const begin = tween.from.edges.get(index) ?? end;
		shown.edges.set(
			index,
			end.map((point, i) => ({
				x: (begin[i]?.x ?? point.x) + (point.x - (begin[i]?.x ?? point.x)) * k,
				y: (begin[i]?.y ?? point.y) + (point.y - (begin[i]?.y ?? point.y)) * k,
			})),
		);
	}

	frame.value++;
	if (!userMoved) fitView();

	if (t < 1) raf = requestAnimationFrame(step);
	else tween = undefined;
}

function relayout(): void {
	// A filter change reframes the picture; whatever the reader was looking at
	// may not even be on screen any more.
	userMoved = false;
	animateTo(computeLayout());
}

/* --------------------------------------------------------------------------
 * Camera
 * ----------------------------------------------------------------------- */

/**
 * The layout has its own coordinates, so the camera fits itself around what is
 * on screen. Panning or zooming takes it over, until a filter changes or the
 * reader asks for it back.
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
		const at = shown.nodes.get(node.name);
		if (!at) continue;
		minX = Math.min(minX, at.x - node.w / 2);
		maxX = Math.max(maxX, at.x + node.w / 2);
		minY = Math.min(minY, at.y - node.h / 2);
		maxY = Math.max(maxY, at.y + node.h / 2);
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
	userMoved = false;
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
 * Full screen
 * ----------------------------------------------------------------------- */

/**
 * The Fullscreen API where it exists, and a fixed overlay where it does not —
 * iOS Safari allows it for video only. Both paths set the same class, so the
 * styling has one shape to worry about, and the resize observer re-fits the
 * camera either way.
 */
async function toggleExpanded(): Promise<void> {
	const element = figure.value;
	if (!element) return;

	if (expanded.value) {
		if (document.fullscreenElement) {
			try {
				await document.exitFullscreen();
			} catch {
				// Leaving the overlay behind would trap the reader; the class goes either way.
			}
		}
		expanded.value = false;
		return;
	}

	expanded.value = true;
	try {
		await element.requestFullscreen();
	} catch {
		// The overlay is the fallback, and it is already in place.
	}
}

function onFullscreenChange(): void {
	if (!document.fullscreenElement) expanded.value = false;
}

/** Escape leaves the overlay; real full screen handles that key itself. */
function onKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape' && expanded.value && !document.fullscreenElement) {
		expanded.value = false;
	}
}

/* --------------------------------------------------------------------------
 * Rendering
 * ----------------------------------------------------------------------- */

const view = computed(() => {
	const active = hovered.value;
	const shownNodes = visible.value.shown;
	const activeLinks = new Set(visible.value.links);

	const neighbours = new Set<string>();
	if (active !== null) {
		neighbours.add(active);
		for (const link of visible.value.links) {
			if (link.source.name === active) neighbours.add(link.target.name);
			if (link.target.name === active) neighbours.add(link.source.name);
		}
	}

	return {
		// Read so the render follows the animation; the value itself is not used.
		tick: frame.value,
		nodes: nodes.map((node) => ({
			node,
			at: shown.nodes.get(node.name) ?? { x: 0, y: 0 },
			hidden: !shownNodes.get(node.name),
			dimmed: active !== null && !neighbours.has(node.name),
		})),
		links: links.map((link, index) => ({
			link,
			path: pathOf(shown.edges.get(index) ?? []),
			hidden: !activeLinks.has(link),
			dimmed: active !== null && link.source.name !== active && link.target.name !== active,
		})),
	};
});

/** A polyline drawn as a smooth curve through its own corners. */
function pathOf(points: Point[]): string {
	if (points.length < 2) return '';
	const at = (point: Point): string => `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
	if (points.length === 2) return `M${at(points[0])} L${at(points[1])}`;

	let path = `M${at(points[0])}`;
	for (let i = 1; i < points.length - 1; i++) {
		const middle = {
			x: (points[i].x + points[i + 1].x) / 2,
			y: (points[i].y + points[i + 1].y) / 2,
		};
		path += ` Q${at(points[i])} ${at(middle)}`;
	}
	return `${path} L${at(points[points.length - 1])}`;
}

/** Native tooltip: what the repository is, and where it sits in the project. */
function describe(node: Box): string {
	const tags = node.tags.map((tag) => tagTitles.get(tag) ?? tag).join(', ');
	return `${node.name} — ${tags}${node.description ? `. ${node.description}` : ''}`;
}

/** Reads the real width of every label, so boxes and ranks match the text. */
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
 * Lifecycle
 * ----------------------------------------------------------------------- */

let observer: ResizeObserver | undefined;

watch(visible, relayout);

onMounted(() => {
	const element = root.value;
	if (!element) return;

	observer = new ResizeObserver(([entry]) => {
		const width = Math.max(280, entry.contentRect.width);
		const height = Math.max(280, entry.contentRect.height);
		if (width === size.value.width && height === size.value.height) return;
		size.value = { width, height };
		// The layout has its own coordinates, so only the camera has to react.
		if (!userMoved) fitView();
	});
	observer.observe(element);
	document.addEventListener('fullscreenchange', onFullscreenChange);
	document.addEventListener('keydown', onKeydown);

	const box = element.getBoundingClientRect();
	size.value = { width: Math.max(280, box.width), height: Math.max(280, box.height) };

	measure();
	if (svg.value) select(svg.value).call(zoomBehaviour);
	settle(computeLayout());
	ready.value = true;
});

onBeforeUnmount(() => {
	cancelAnimationFrame(raf);
	observer?.disconnect();
	document.removeEventListener('fullscreenchange', onFullscreenChange);
	document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
	<figure ref="figure" class="dependency-graph" :class="{ expanded }">
		<div class="controls">
			<div class="group" role="group" aria-label="Kinds of dependency">
				<span class="group-label">Dependencies</span>
				<button
					v-for="kind in usedKinds"
					:key="kind.id"
					type="button"
					class="chip"
					:class="{ off: !kindOn[kind.id] }"
					:aria-pressed="kindOn[kind.id]"
					@click="kindOn[kind.id] = !kindOn[kind.id]"
				>
					<svg viewBox="0 0 30 10" aria-hidden="true">
						<path
							d="M1,5 L21,5"
							:style="lineStyle(kind.id)"
							:marker-end="`url(#dg-arrow-${kind.id})`"
						/>
					</svg>
					{{ kind.title }}
				</button>
			</div>

			<div class="group" role="group" aria-label="Kinds of repository">
				<span class="group-label">Repositories</span>
				<button
					v-for="tag in data.tags"
					:key="tag.id"
					type="button"
					class="chip tag"
					:class="{ off: !tagOn[tag.id] }"
					:style="{ '--dg-hue': hues.get(tag.id) ?? 0 }"
					:aria-pressed="tagOn[tag.id]"
					:title="tag.summary"
					@click="tagOn[tag.id] = !tagOn[tag.id]"
				>
					<span class="box" aria-hidden="true" />
					{{ tag.title }}
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

			<div class="group end">
				<button type="button" class="chip plain" @click="resetView">Reset view</button>
				<button
					type="button"
					class="chip plain"
					:aria-pressed="expanded"
					@click="toggleExpanded"
				>
					{{ expanded ? 'Exit full screen' : 'Full screen' }}
				</button>
			</div>
		</div>

		<div ref="root" class="canvas">
			<svg
				ref="svg"
				class="stage"
				:viewBox="`0 0 ${size.width} ${size.height}`"
				:aria-label="`Dependencies between ${nodes.length} repositories`"
			>
				<defs>
					<marker
						v-for="kind in usedKinds"
						:id="`dg-arrow-${kind.id}`"
						:key="kind.id"
						class="arrow"
						:class="`head-${kind.line.head}`"
						viewBox="0 0 12 12"
						:refX="kind.line.head === 'hollow' ? 10.5 : 10"
						refY="6"
						markerWidth="8"
						markerHeight="8"
						markerUnits="userSpaceOnUse"
						orient="auto-start-reverse"
					>
						<path d="M1,1.5 L11,6 L1,10.5 z" />
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
						:class="{ dimmed: edge.dimmed, hidden: edge.hidden }"
						:style="lineStyle(edge.link.kind)"
						:d="edge.path"
						:marker-end="`url(#dg-arrow-${edge.link.kind})`"
					/>

					<g
						v-for="entry in view.nodes"
						:key="entry.node.name"
						class="node"
						:class="{ dimmed: entry.dimmed, hidden: entry.hidden }"
						:style="{ '--dg-hue': hues.get(primaryTag(entry.node)) ?? 0 }"
						:transform="`translate(${entry.at.x},${entry.at.y})`"
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
			from a repository to what it depends on. Scroll to zoom, drag the background to pan, hover
			a repository to isolate it.
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
	/* Edges are deliberately grey: colour belongs to the tags. */
	--dg-edge: oklch(0.52 0 0);

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
	--dg-edge: oklch(0.72 0 0);
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

.group.end {
	margin-left: auto;
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
	width: 30px;
	height: 10px;
	overflow: visible;
}

.chip path {
	fill: none;
	stroke: var(--dg-edge);
}

.chip.tag .box {
	width: 20px;
	height: 12px;
	border-radius: 3px;
	border: 1.2px solid oklch(var(--dg-stroke-l) var(--dg-stroke-c) var(--dg-hue));
	background: oklch(var(--dg-fill-l) var(--dg-fill-c) var(--dg-hue));
}

/* Full screen ------------------------------------------------------------ */

.dependency-graph.expanded {
	position: fixed;
	inset: 0;
	z-index: 60;
	display: flex;
	flex-direction: column;
	width: auto;
	margin: 0;
	padding: 12px 16px 8px;
	background: var(--vp-c-bg);
}

.dependency-graph.expanded .canvas {
	flex: 1;
	height: auto;
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
	transition: opacity 0.25s ease;
}

.node rect {
	fill: oklch(var(--dg-fill-l) var(--dg-fill-c) var(--dg-hue));
	stroke: oklch(var(--dg-stroke-l) var(--dg-stroke-c) var(--dg-hue));
	stroke-width: 1.2;
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

/*
 * Width, dashes and arrowhead come from the kind vocabulary as inline
 * attributes, so there is no rule per kind here — only the ink they share.
 */
.link {
	fill: none;
	stroke: var(--dg-edge);
	stroke-linecap: round;
	transition: opacity 0.25s ease;
}

.arrow path {
	stroke: var(--dg-edge);
}

.arrow.head-filled path {
	fill: var(--dg-edge);
	stroke: none;
}

/* Hollow heads are punched out of the canvas, so the line cannot show through. */
.arrow.head-hollow path {
	fill: var(--vp-c-bg-alt);
	stroke-width: 1.6;
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
