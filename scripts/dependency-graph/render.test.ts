import { describe, expect, it } from 'vitest';
import { renderPage } from './render';
import type { Graph, RepoNode } from './model';

const repo = (name: string, tags: string[], description: string | null = null): RepoNode => ({
	name,
	tags,
	description,
	language: null,
	fork: false,
	archived: false,
});

const graph: Graph = {
	org: 'versatiles-org',
	tags: [
		{ id: 'library', title: 'Libraries', summary: 'Code to build on.' },
		{ id: 'project', title: 'Project', summary: 'What keeps the project running.' },
	],
	repos: [
		repo('versatiles-rs', ['library', 'project'], 'The core toolkit'),
		repo('versatiles-style', ['library'], null),
		repo('node-release-tool', ['project'], 'Release automation'),
	],
	edges: [
		{
			from: 'versatiles-style',
			to: 'node-release-tool',
			kind: 'npm',
			detail: '@versatiles/release-tool@^2',
			path: 'package.json',
			line: 12,
		},
		{
			from: 'versatiles-style',
			to: 'versatiles-rs',
			kind: 'manual',
			detail: 'ships the styles it produces',
			path: '',
			line: 0,
		},
	],
};

const page = renderPage({
	graph,
	branches: new Map([['versatiles-style', 'main']]),
	skipped: [{ name: 'old-thing', reason: 'archived' }],
});

describe('renderPage', () => {
	it('starts with frontmatter, so the graph gets the full page width', () => {
		expect(page.startsWith('---\naside: false\n---\n')).toBe(true);
	});

	it('marks the file as generated', () => {
		expect(page).toContain('do not edit');
		expect(page).toContain('scripts/build-dependency-graph.ts');
	});

	it('places the interactive graph, and no static diagram beside it', () => {
		expect(page).toContain('<DependencyGraph />');
		expect(page).not.toContain('```mermaid');
		expect(page).not.toContain('static diagram');
	});

	it('gives each tag a section, in the order the vocabulary defines', () => {
		expect(page.indexOf('### Libraries')).toBeGreaterThan(-1);
		expect(page.indexOf('### Libraries')).toBeLessThan(page.indexOf('### Project'));
		expect(page).toContain('Code to build on.');
	});

	it('lists a repository once, under its first tag', () => {
		const libraries = page.slice(page.indexOf('### Libraries'), page.indexOf('### Project'));
		const project = page.slice(page.indexOf('### Project'));
		expect(libraries).toContain('[versatiles-rs](');
		expect(project).not.toContain('[versatiles-rs](');
	});

	it('names the other tags a repository carries', () => {
		const row = page.split('\n').find((line) => line.includes('[versatiles-rs]'));
		expect(row).toContain('Project');
	});

	it('counts what each repository depends on and what depends on it', () => {
		const style = page.split('\n').find((line) => line.includes('[versatiles-style]')) ?? '';
		const cells = style.split('|').map((cell) => cell.trim());
		expect(cells.slice(-3, -1)).toEqual(['2', '0']);
	});

	it('links every finding back to the line it came from', () => {
		expect(page).toContain(
			'https://github.com/versatiles-org/versatiles-style/blob/main/package.json#L12',
		);
	});

	it('points a hand-declared dependency at the configuration instead', () => {
		expect(page).toContain('ships the styles it produces');
		expect(page).toContain('`scripts/dependency-graph.yaml`');
	});

	it('puts the evidence behind a details block, not in the way', () => {
		expect(page).toContain('::: details Where these 1 links come from');
	});

	it('says which repositories are left out and why', () => {
		expect(page).toContain('old-thing');
		expect(page).toContain('archived');
	});

	it('escapes a pipe so it cannot break out of a table cell', () => {
		const withPipe = renderPage({
			graph: {
				...graph,
				repos: [repo('odd', ['library'], 'reads a|b files')],
				edges: [],
			},
			branches: new Map(),
			skipped: [],
		});
		expect(withPipe).toContain('reads a\\|b files');
	});

	it('leaves out a tag that nothing carries', () => {
		const unused = renderPage({
			graph: {
				...graph,
				tags: [...graph.tags, { id: 'ghost', title: 'Ghost', summary: 'Nothing has this.' }],
			},
			branches: new Map(),
			skipped: [],
		});
		expect(unused).not.toContain('### Ghost');
	});
});
