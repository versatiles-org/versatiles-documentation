/**
 * Feeds the interactive dependency graph.
 *
 * `public/dependency-graph.json` is the full record, evidence and all. The
 * component only needs to draw arrows, so this loader hands it a compact
 * payload: one entry per repository, one per distinct relation, and the
 * vocabulary of relation kinds taken straight from the generator — the page and
 * the diagram cannot disagree about what "download" means if neither of them
 * owns the word.
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineLoader } from 'vitepress';
import { EDGE_KINDS, EDGE_KIND_META } from '../scripts/dependency-graph/model';
import type { EdgeKind, Graph, RepoRole } from '../scripts/dependency-graph/model';

export interface GraphKind {
	id: EdgeKind;
	title: string;
	/** Ordering, so a pair drawn once is drawn as its most substantial link. */
	weight: number;
}

export interface GraphNode {
	name: string;
	group: string;
	role: RepoRole;
	description: string | null;
	/** Distance to a repository that depends on nothing, used to lay out columns. */
	depth: number;
}

export interface GraphLink {
	from: string;
	to: string;
	kind: EdgeKind;
}

export interface GraphData {
	groups: { id: string; title: string }[];
	kinds: GraphKind[];
	nodes: GraphNode[];
	links: GraphLink[];
}

declare const data: GraphData;
export { data };

/**
 * How far a repository is from the end of a dependency chain: 0 for something
 * nothing else is built on top of, 1 for its direct dependents, and so on.
 * Cycles exist — two repositories can trigger each other's builds — so the
 * relaxation is capped rather than assuming a DAG.
 */
function depths(nodes: string[], links: GraphLink[]): Map<string, number> {
	const targets = new Map<string, string[]>(nodes.map((name) => [name, []]));
	for (const link of links) targets.get(link.from)?.push(link.to);

	const depth = new Map<string, number>(nodes.map((name) => [name, 0]));
	for (let round = 0; round < nodes.length; round++) {
		let moved = false;
		for (const name of nodes) {
			const reach = targets.get(name) ?? [];
			if (reach.length === 0) continue;
			const next = 1 + Math.max(...reach.map((target) => depth.get(target) ?? 0));
			if (next > (depth.get(name) ?? 0) && next < nodes.length) {
				depth.set(name, next);
				moved = true;
			}
		}
		if (!moved) break;
	}
	return depth;
}

export default defineLoader({
	watch: ['../public/dependency-graph.json'],
	load(): GraphData {
		const here = dirname(fileURLToPath(import.meta.url));
		const graph = JSON.parse(
			readFileSync(resolve(here, '../public/dependency-graph.json'), 'utf8'),
		) as Graph;

		// Several files can prove the same relation; the diagram draws it once.
		const seen = new Set<string>();
		const links: GraphLink[] = [];
		for (const edge of graph.edges) {
			const key = `${edge.from} ${edge.to} ${edge.kind}`;
			if (seen.has(key)) continue;
			seen.add(key);
			links.push({ from: edge.from, to: edge.to, kind: edge.kind });
		}

		const names = graph.repos.map((repo) => repo.name);
		const depth = depths(names, links);

		return {
			groups: graph.groups.map((group) => ({ id: group.id, title: group.title })),
			kinds: EDGE_KINDS.map((kind) => ({
				id: kind,
				title: EDGE_KIND_META[kind].title,
				weight: EDGE_KIND_META[kind].weight,
			})),
			nodes: graph.repos.map((repo) => ({
				name: repo.name,
				group: repo.group,
				role: repo.role,
				description: repo.description,
				depth: depth.get(repo.name) ?? 0,
			})),
			links,
		};
	},
});
