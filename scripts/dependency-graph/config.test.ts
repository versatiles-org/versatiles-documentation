import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { CONFIG_PATH, loadConfig, validateConfig, type GraphConfig } from './config';

/** Writes a configuration into a throwaway directory and loads it back. */
function load(yaml: string): GraphConfig {
	const root = mkdtempSync(resolve(tmpdir(), 'dependency-graph-'));
	mkdirSync(resolve(root, 'scripts'), { recursive: true });
	writeFileSync(resolve(root, CONFIG_PATH), yaml);
	return loadConfig(root);
}

const MINIMAL = `
org: versatiles-org
tags:
  - id: library
    title: Libraries
    summary: Code to build on.
repositories:
  'versatiles-rs': [library]
`;

describe('loadConfig', () => {
	it('reads the vocabulary and the repositories', () => {
		const config = load(MINIMAL);
		expect(config.org).toBe('versatiles-org');
		expect(config.tags).toEqual([
			{ id: 'library', title: 'Libraries', summary: 'Code to build on.' },
		]);
		expect(config.repositories['versatiles-rs']).toEqual(['library']);
	});

	it('keeps archived repositories out and forks in, unless told otherwise', () => {
		expect(load(MINIMAL).includeArchived).toBe(false);
		expect(load(MINIMAL).includeForks).toBe(true);
		expect(load(`${MINIMAL}\ninclude_archived: true\ninclude_forks: false\n`)).toMatchObject({
			includeArchived: true,
			includeForks: false,
		});
	});

	it('refuses a tag no repository could mean', () => {
		expect(() => load(`${MINIMAL.replace('[library]', '[libary]')}`)).toThrow(/undefined tag/);
	});

	it('refuses a repository with no tags at all', () => {
		expect(() => load(MINIMAL.replace('[library]', '[]'))).toThrow(/non-empty list/);
	});

	it('refuses a configuration with no vocabulary', () => {
		expect(() => load('org: versatiles-org\n')).toThrow(/at least one tag/);
	});

	it('names the field that is wrong', () => {
		expect(() => load(MINIMAL.replace('title: Libraries', 'title: 7'))).toThrow(
			/tags\[0\].title/,
		);
	});
});

describe('validateConfig', () => {
	const known = new Set(['versatiles-rs', 'versatiles-docker']);

	it('passes a configuration that matches the organisation', () => {
		expect(validateConfig(load(MINIMAL), known)).toEqual([]);
	});

	it('catches a repository that no longer exists, wherever it is named', () => {
		const config = load(`${MINIMAL}
exclude: ['gone-one']
images:
  versatiles/versatiles: gone-two
manual:
  - from: gone-three
    to: versatiles-rs
    kind: manual
    note: historic
ignore:
  - from: versatiles-rs
    to: gone-four
    reason: noise
`);
		const problems = validateConfig(config, known).join('\\n');
		for (const name of ['gone-one', 'gone-two', 'gone-three', 'gone-four']) {
			expect(problems).toContain(name);
		}
	});

	it('catches a repository listed under a renamed name', () => {
		const config = load(MINIMAL.replace("'versatiles-rs'", "'versatiles-rust'"));
		expect(validateConfig(config, known)).toEqual([
			'repositories: unknown repository "versatiles-rust"',
		]);
	});

	it('catches a tag defined twice, and a tag repeated on one repository', () => {
		const config = load(`
org: versatiles-org
tags:
  - id: library
    title: Libraries
    summary: Code to build on.
  - id: library
    title: Duplicate
    summary: Same id again.
repositories:
  'versatiles-rs': [library, library]
`);
		const problems = validateConfig(config, known);
		expect(problems).toContain('tags: "library" is defined twice');
		expect(problems).toContain('repositories.versatiles-rs repeats a tag');
	});

	it('collects every problem rather than stopping at the first', () => {
		const config = load(
			MINIMAL.replace("'versatiles-rs'", "'gone'") + "\nexclude: ['also-gone']\n",
		);
		expect(validateConfig(config, known)).toHaveLength(2);
	});
});
