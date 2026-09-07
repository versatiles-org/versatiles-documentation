/** Types shared by the dependency graph collector and renderer. */

export const EDGE_KINDS = ['npm', 'cargo', 'docker', 'download', 'workflow', 'manual'] as const;

export type EdgeKind = (typeof EDGE_KINDS)[number];

export interface EdgeKindMeta {
	/** Heading used for this kind's own section on the page. */
	title: string;
	/** One sentence explaining what such an arrow means. */
	summary: string;
	/** Mermaid arrow, so the overview stays readable without edge labels. */
	arrow: string;
	/** Ranking used when one pair of repositories is linked in several ways. */
	weight: number;
}

export const EDGE_KIND_META: Record<EdgeKind, EdgeKindMeta> = {
	npm: {
		title: 'npm packages',
		summary: 'The repository lists a `@versatiles/…` package among its npm dependencies.',
		arrow: '-->',
		weight: 6,
	},
	cargo: {
		title: 'Rust crates',
		summary: 'The repository depends on one of the project’s crates in `Cargo.toml`.',
		arrow: '-->',
		weight: 5,
	},
	docker: {
		title: 'Docker images',
		summary: 'A `Dockerfile` builds on an image produced by another repository.',
		arrow: '==>',
		weight: 4,
	},
	download: {
		title: 'Downloaded artifacts',
		summary:
			'Build scripts or runtime code fetch release assets or raw files from another repository.',
		arrow: '-.->',
		weight: 3,
	},
	workflow: {
		title: 'CI and release automation',
		summary:
			'A GitHub Actions workflow uses an action, reusable workflow or dispatch of another repository.',
		arrow: '--o',
		weight: 2,
	},
	manual: {
		title: 'Declared by hand',
		summary:
			'A dependency no parser can see — recorded in `scripts/dependency-graph.yaml` with a note.',
		arrow: '-.->',
		weight: 1,
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

/**
 * Whether a repository is part of what the project ships, or part of what keeps
 * the project running. The split is editorial and lives in the configuration.
 */
export type RepoRole = 'productive' | 'supporting';

export interface RepoNode {
	name: string;
	group: string;
	role: RepoRole;
	description: string | null;
	language: string | null;
	fork: boolean;
	archived: boolean;
}

export interface GraphGroup {
	id: string;
	title: string;
	/** Short line printed above the group's repositories. */
	summary: string;
}

export interface Graph {
	org: string;
	groups: GraphGroup[];
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
