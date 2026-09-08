import { describe, expect, it } from 'vitest';
import { EDGE_KINDS, EDGE_KIND_META, sortEdges, type Edge } from './model';

const edge = (from: string, to: string, kind: Edge['kind'], detail = ''): Edge => ({
	from,
	to,
	kind,
	detail,
	path: '',
	line: 0,
});

describe('the vocabulary of dependency kinds', () => {
	it('describes every kind', () => {
		for (const kind of EDGE_KINDS) {
			const meta = EDGE_KIND_META[kind];
			expect(meta.title, kind).toBeTruthy();
			expect(meta.summary, kind).toBeTruthy();
		}
	});

	it('ranks them unambiguously, so one pair always draws the same way', () => {
		const weights = EDGE_KINDS.map((kind) => EDGE_KIND_META[kind].weight);
		expect(new Set(weights).size).toBe(EDGE_KINDS.length);
	});

	it('gives each kind a drawable line', () => {
		for (const kind of EDGE_KINDS) {
			const { line } = EDGE_KIND_META[kind];
			expect(line.width, kind).toBeGreaterThan(0);
			expect(line.opacity, kind).toBeGreaterThan(0);
			expect(line.opacity, kind).toBeLessThanOrEqual(1);
			expect(['filled', 'hollow'], kind).toContain(line.head);
			// "none" or an SVG dash pattern; anything else would silently draw solid.
			expect(line.dash === 'none' || /^[\d.\s]+$/.test(line.dash), kind).toBe(true);
		}
	});

	it('tells the kinds apart by something other than colour', () => {
		const shapes = EDGE_KINDS.map((kind) => {
			const { line } = EDGE_KIND_META[kind];
			return `${line.width}|${line.dash}|${line.head}`;
		});
		expect(new Set(shapes).size, 'two kinds would be drawn identically').toBe(EDGE_KINDS.length);
	});
});

describe('sortEdges', () => {
	it('orders by source, then target, then kind, so output does not churn', () => {
		const sorted = sortEdges([
			edge('b', 'a', 'npm'),
			edge('a', 'z', 'npm'),
			edge('a', 'a', 'npm'),
			edge('a', 'a', 'cargo'),
		]);
		expect(sorted.map((e) => `${e.from}-${e.to}-${e.kind}`)).toEqual([
			'a-a-cargo',
			'a-a-npm',
			'a-z-npm',
			'b-a-npm',
		]);
	});

	it('is stable whatever order it is given', () => {
		const edges = [
			edge('b', 'c', 'npm', 'two'),
			edge('a', 'c', 'docker', 'one'),
			edge('a', 'c', 'npm', 'three'),
		];
		const once = sortEdges(edges).map((e) => e.detail);
		const again = sortEdges([...edges].reverse()).map((e) => e.detail);
		expect(again).toEqual(once);
	});

	it('leaves the input alone', () => {
		const edges = [edge('b', 'a', 'npm'), edge('a', 'b', 'npm')];
		sortEdges(edges);
		expect(edges[0].from).toBe('b');
	});
});
