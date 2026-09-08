/**
 * Feeds the interactive dependency graph.
 *
 * `public/dependency-graph.json` is the full record, evidence and all. The
 * component only needs to draw arrows, so this loader hands it a compact
 * payload: one entry per repository, one per distinct relation, and the
 * vocabulary of relation kinds taken straight from the generator — the page and
 * the diagram cannot disagree about what "download" means if neither of them
 * owns the word.
 *
 * Layering is deliberately not done here: the component recomputes it whenever
 * a filter changes, and one implementation is easier to trust than two.
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineLoader } from 'vitepress';
import { EDGE_KINDS, EDGE_KIND_META } from '../scripts/dependency-graph/model';
import type { EdgeKind, EdgeLineStyle, Graph, TagInfo } from '../scripts/dependency-graph/model';

export interface GraphKind {
	id: EdgeKind;
	title: string;
	/** Ordering, so a pair drawn once is drawn as its most substantial link. */
	weight: number;
	/** How the arrow is drawn: width, dashes and arrowhead, but no colour. */
	line: EdgeLineStyle;
}

export interface GraphNode {
	name: string;
	/** Most characteristic first; the first entry decides the colour. */
	tags: string[];
	description: string | null;
}

export interface GraphLink {
	from: string;
	to: string;
	kind: EdgeKind;
}

export interface GraphData {
	tags: TagInfo[];
	kinds: GraphKind[];
	nodes: GraphNode[];
	links: GraphLink[];
}

declare const data: GraphData;
export { data };

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

		return {
			tags: graph.tags,
			kinds: EDGE_KINDS.map((kind) => ({
				id: kind,
				title: EDGE_KIND_META[kind].title,
				weight: EDGE_KIND_META[kind].weight,
				line: EDGE_KIND_META[kind].line,
			})),
			nodes: graph.repos.map((repo) => ({
				name: repo.name,
				tags: repo.tags,
				description: repo.description,
			})),
			links,
		};
	},
});
