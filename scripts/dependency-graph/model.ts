/** Types shared by the dependency graph collector and renderer. */

export const EDGE_KINDS = ['npm', 'cargo', 'docker', 'download', 'workflow', 'manual'] as const;

export type EdgeKind = (typeof EDGE_KINDS)[number];

/**
 * How an arrow is drawn in the interactive graph. Colour is deliberately not
 * part of it: the graph already spends colour on what a repository is, and a
 * second colour scale meaning something else would only compete with the first.
 * Width, dash pattern and the shape of the arrowhead carry the kind instead,
 * which also survives being printed or read by someone colour-blind.
 */
export interface EdgeLineStyle {
	width: number;
	/** SVG stroke-dasharray, or "none" for a solid line. */
	dash: string;
	head: 'filled' | 'hollow';
}

export interface EdgeKindMeta {
	/** Heading used for this kind's own section on the page. */
	title: string;
	/** One sentence explaining what such an arrow means. */
	summary: string;
	/** Mermaid arrow, so the static overview stays readable without edge labels. */
	arrow: string;
	/** Ranking used when one pair of repositories is linked in several ways. */
	weight: number;
	line: EdgeLineStyle;
}

export const EDGE_KIND_META: Record<EdgeKind, EdgeKindMeta> = {
	npm: {
		title: 'npm packages',
		summary: 'The repository lists a `@versatiles/…` package among its npm dependencies.',
		arrow: '-->',
		weight: 6,
		line: { width: 1.5, dash: 'none', head: 'filled' },
	},
	cargo: {
		title: 'Rust crates',
		summary: 'The repository depends on one of the project’s crates in `Cargo.toml`.',
		arrow: '-->',
		weight: 5,
		line: { width: 1.5, dash: 'none', head: 'hollow' },
	},
	docker: {
		title: 'Docker images',
		summary: 'A `Dockerfile` builds on an image produced by another repository.',
		arrow: '==>',
		weight: 4,
		line: { width: 3, dash: 'none', head: 'filled' },
	},
	download: {
		title: 'Downloaded artifacts',
		summary:
			'Build scripts or runtime code fetch release assets or raw files from another repository.',
		arrow: '-.->',
		weight: 3,
		line: { width: 1.5, dash: '8 4', head: 'filled' },
	},
	workflow: {
		title: 'CI and release automation',
		summary:
			'A GitHub Actions workflow uses an action, reusable workflow or dispatch of another repository.',
		arrow: '--o',
		weight: 2,
		line: { width: 1.5, dash: '1.5 3', head: 'filled' },
	},
	manual: {
		title: 'Declared by hand',
		summary:
			'A dependency no parser can see — recorded in `scripts/dependency-graph.yaml` with a note.',
		arrow: '-.->',
		weight: 1,
		line: { width: 1.5, dash: '9 3 1.5 3', head: 'hollow' },
	},
};

export interface Edge {
	/** Repository that depends on something. */
	from: string;
	/** Repository it depends on. */
	to: string;
	kind: EdgeKind;
	/** What exactly was found, e.g. an npm package name or an image tag. */
	detail: string;
	/** Path inside `from` that proves the edge; empty for manual edges. */
	path: string;
	/** 1-based line inside `path`, or 0 when unknown. */
	line: number;
}

/** One value from the tag vocabulary in the configuration. */
export interface TagInfo {
	id: string;
	title: string;
	/** Short line printed above the repositories carrying this tag. */
	summary: string;
}

export interface RepoNode {
	name: string;
	/**
	 * What the repository is. Several are more than one thing, so this is a list
	 * rather than a single value; the first entry is the primary one and decides
	 * colour and placement where only one can be shown.
	 */
	tags: string[];
	description: string | null;
	language: string | null;
	fork: boolean;
	archived: boolean;
}

export interface Graph {
	org: string;
	tags: TagInfo[];
	repos: RepoNode[];
	edges: Edge[];
}

/** Stable ordering, so regenerating without upstream changes produces no diff. */
export function sortEdges(edges: Edge[]): Edge[] {
	return [...edges].sort(
		(a, b) =>
			a.from.localeCompare(b.from) ||
			a.to.localeCompare(b.to) ||
			a.kind.localeCompare(b.kind) ||
			a.detail.localeCompare(b.detail) ||
			a.path.localeCompare(b.path) ||
			a.line - b.line,
	);
}
