import { describe, expect, it } from 'vitest';
import { buildNameMaps, classify, collectEdges, type RepoFile } from './collect';
import type { GraphConfig } from './config';
import type { Edge } from './model';

function file(repo: string, path: string, text: string): RepoFile {
	const role = classify(path);
	if (!role) throw new Error(`${path} is not a file the collector reads`);
	return { repo, path, role, text };
}

function configure(overrides: Partial<GraphConfig> = {}): GraphConfig {
	return {
		org: 'versatiles-org',
		includeArchived: false,
		includeForks: true,
		tags: [{ id: 'library', title: 'Libraries', summary: 'Code to build on.' }],
		repositories: {},
		images: {},
		exclude: [],
		manual: [],
		ignore: [],
		...overrides,
	};
}

/** Runs the collector the way the builder does, and returns only what it found. */
function collect(
	files: RepoFile[],
	repos: string[],
	overrides: Partial<GraphConfig> = {},
): { edges: Edge[]; warnings: string[] } {
	const config = configure(overrides);
	const { maps, warnings } = buildNameMaps(files);
	const result = collectEdges(files, config, maps, new Set(repos), warnings);
	return { edges: result.edges, warnings: result.warnings };
}

const asPairs = (edges: Edge[]): string[] =>
	edges.map((edge) => `${edge.from} ${edge.kind} ${edge.to}`).sort();

describe('classify', () => {
	it('recognises the files that can declare a dependency', () => {
		expect(classify('package.json')).toBe('package');
		expect(classify('some/where/package.json')).toBe('package');
		expect(classify('Cargo.toml')).toBe('cargo');
		expect(classify('Dockerfile')).toBe('docker');
		expect(classify('build/api.dockerfile')).toBe(null); // build/ is output
		expect(classify('docker/Dockerfile.prod')).toBe('docker');
		expect(classify('compose.yaml')).toBe('docker');
		expect(classify('.github/workflows/ci.yml')).toBe('workflow');
		expect(classify('.github/actions/setup/action.yml')).toBe('workflow');
		expect(classify('src/index.ts')).toBe('source');
		expect(classify('bin/install.sh')).toBe('source');
	});

	it('skips generated output, vendored code and fixtures', () => {
		expect(classify('node_modules/x/package.json')).toBe(null);
		expect(classify('dist/index.js')).toBe(null);
		expect(classify('coverage/lcov-report/index.js')).toBe(null);
		expect(classify('target/debug/build.rs')).toBe(null);
		expect(classify('tests/integration/fixtures/setup.sh')).toBe(null);
		expect(classify('e2e/server.spec.ts')).toBe(null);
	});

	it('skips lockfiles, bundles, type declarations and tests', () => {
		expect(classify('package-lock.json')).toBe(null);
		expect(classify('src/vendor.min.js')).toBe(null);
		expect(classify('src/index.d.ts')).toBe(null);
		expect(classify('src/generate.test.ts')).toBe(null);
		expect(classify('src/generate.spec.ts')).toBe(null);
	});

	it('never reads Markdown, where badges and prose mention everything', () => {
		expect(classify('README.md')).toBe(null);
		expect(classify('docs/guide.md')).toBe(null);
	});
});

describe('buildNameMaps', () => {
	it('maps published names back to the repository that publishes them', () => {
		const { maps } = buildNameMaps([
			file('node-versatiles-server', 'package.json', '{"name":"@versatiles/server"}'),
			file(
				'versatiles-rs',
				'versatiles_core/Cargo.toml',
				'[package]\nname = "versatiles_core"\n',
			),
		]);
		expect(maps.npm.get('@versatiles/server')).toBe('node-versatiles-server');
		expect(maps.crate.get('versatiles_core')).toBe('versatiles-rs');
	});

	it('reports a name claimed by two repositories instead of picking one', () => {
		const { warnings } = buildNameMaps([
			file('one', 'package.json', '{"name":"@versatiles/style"}'),
			file('two', 'package.json', '{"name":"@versatiles/style"}'),
		]);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toContain('@versatiles/style');
	});
});

describe('npm dependencies', () => {
	const style = file('versatiles-style', 'package.json', '{"name":"@versatiles/style"}');

	it('is found in every kind of dependency field', () => {
		const consumer = file(
			'app',
			'package.json',
			JSON.stringify({
				name: 'app',
				dependencies: { '@versatiles/style': '^5.0.0' },
				devDependencies: { '@versatiles/style': '^5.0.0' },
			}),
		);
		const { edges } = collect([style, consumer], ['app', 'versatiles-style']);
		expect(edges).toHaveLength(1);
		expect(edges[0]).toMatchObject({ from: 'app', to: 'versatiles-style', kind: 'npm' });
		expect(edges[0].detail).toBe('@versatiles/style@^5.0.0');
	});

	it('follows a dependency that points straight at a repository', () => {
		const consumer = file(
			'app',
			'package.json',
			'{"name":"app","dependencies":{"thing":"github:versatiles-org/versatiles-style#main"}}',
		);
		const { edges } = collect([style, consumer], ['app', 'versatiles-style']);
		expect(asPairs(edges)).toEqual(['app npm versatiles-style']);
	});

	it('keeps each package separately, since one repository can publish several', () => {
		const other = file('versatiles-style', 'sub/package.json', '{"name":"@versatiles/sprites"}');
		const consumer = file(
			'app',
			'package.json',
			'{"name":"app","dependencies":{"@versatiles/style":"^5","@versatiles/sprites":"^1"}}',
		);
		const { edges } = collect([style, other, consumer], ['app', 'versatiles-style']);
		expect(edges).toHaveLength(2);
		expect(edges.map((edge) => edge.detail).sort()).toEqual([
			'@versatiles/sprites@^1',
			'@versatiles/style@^5',
		]);
	});

	it('reports a manifest it cannot parse rather than failing', () => {
		const broken = file('app', 'package.json', '{ not json');
		const { warnings } = collect([broken], ['app']);
		expect(warnings.some((warning) => warning.includes('not valid JSON'))).toBe(true);
	});
});

describe('Rust crates', () => {
	const core = file('versatiles-rs', 'core/Cargo.toml', '[package]\nname = "versatiles_core"\n');

	it('reads plain, dev and target dependency tables', () => {
		const consumer = file(
			'versatiles-studio',
			'src-tauri/Cargo.toml',
			[
				'[package]',
				'name = "studio"',
				'',
				'[dependencies]',
				'versatiles_core = "0.1"',
				'serde = "1"',
				'',
				'[dev-dependencies]',
				'versatiles_core = { version = "0.1" }',
			].join('\n'),
		);
		const { edges } = collect([core, consumer], ['versatiles-rs', 'versatiles-studio']);
		expect(edges).toHaveLength(1);
		expect(edges[0]).toMatchObject({
			to: 'versatiles-rs',
			kind: 'cargo',
			detail: 'versatiles_core',
		});
	});

	it('reads a dependency written as its own table header', () => {
		const consumer = file(
			'versatiles-studio',
			'Cargo.toml',
			'[package]\nname = "studio"\n\n[dependencies.versatiles_core]\nversion = "0.1"\n',
		);
		const { edges } = collect([core, consumer], ['versatiles-rs', 'versatiles-studio']);
		expect(asPairs(edges)).toEqual(['versatiles-studio cargo versatiles-rs']);
	});

	it('ignores a crate name that appears outside a dependency table', () => {
		const consumer = file(
			'versatiles-studio',
			'Cargo.toml',
			'[package]\nname = "studio"\ndescription = "versatiles_core is great"\n\n[features]\nversatiles_core = []\n',
		);
		const { edges } = collect([core, consumer], ['versatiles-rs', 'versatiles-studio']);
		expect(edges).toHaveLength(0);
	});
});

describe('Docker images', () => {
	const images = { 'versatiles/versatiles': 'versatiles-docker' };

	it('follows FROM through tags and digests', () => {
		const dockerfile = file(
			'tiles.versatiles.org',
			'Dockerfile',
			'FROM --platform=$BUILDPLATFORM versatiles/versatiles:latest\nRUN echo hi\n',
		);
		const { edges } = collect([dockerfile], ['tiles.versatiles.org', 'versatiles-docker'], {
			images,
		});
		expect(asPairs(edges)).toEqual(['tiles.versatiles.org docker versatiles-docker']);
	});

	it('does not mistake a build stage for an image', () => {
		const dockerfile = file(
			'versatiles-docker',
			'Dockerfile',
			[
				'FROM alpine:3 AS builder',
				'FROM builder AS runtime',
				'COPY --from=builder /app /app',
			].join('\n'),
		);
		const { edges, warnings } = collect([dockerfile], ['versatiles-docker'], {
			images: { builder: 'versatiles-docker' },
		});
		expect(edges).toHaveLength(0);
		expect(warnings).toHaveLength(0);
	});

	it('skips an image name that is still a shell variable', () => {
		const dockerfile = file(
			'versatiles-docker',
			'Dockerfile',
			'FROM ghcr.io/versatiles-org/$IMG\n',
		);
		const { warnings } = collect([dockerfile], ['versatiles-docker']);
		expect(warnings).toHaveLength(0);
	});

	it('reports an image that looks like ours but is not in the mapping', () => {
		const dockerfile = file('orthophotos', 'Dockerfile', 'FROM versatiles/versatiles-gdal:1\n');
		const { warnings } = collect([dockerfile], ['orthophotos']);
		expect(warnings.some((warning) => warning.includes('versatiles/versatiles-gdal'))).toBe(true);
	});
});

describe('downloaded artifacts', () => {
	it('follows release assets, raw files, API calls and clones', () => {
		const script = file(
			'tools',
			'src/setup.ts',
			[
				'const a = "https://github.com/versatiles-org/versatiles-rs/releases/latest/download/x";',
				'const b = "https://raw.githubusercontent.com/versatiles-org/versatiles-spec/main/v02.md";',
				'const c = "https://api.github.com/repos/versatiles-org/versatiles-fonts/releases";',
				'const d = "https://github.com/versatiles-org/versatiles-style.git";',
			].join('\n'),
		);
		const { edges } = collect(
			[script],
			['tools', 'versatiles-rs', 'versatiles-spec', 'versatiles-fonts', 'versatiles-style'],
		);
		expect(asPairs(edges)).toEqual([
			'tools download versatiles-fonts',
			'tools download versatiles-rs',
			'tools download versatiles-spec',
			'tools download versatiles-style',
		]);
	});

	it('follows a repository named as a bare slug in source', () => {
		const source = file(
			'versatiles-frontend',
			'frontends/config.ts',
			"githubSource('versatiles-org/versatiles-fonts', { prerelease: false })",
		);
		const { edges } = collect([source], ['versatiles-frontend', 'versatiles-fonts']);
		expect(asPairs(edges)).toEqual(['versatiles-frontend download versatiles-fonts']);
	});

	it('does not truncate a repository name to reach a shorter one', () => {
		// The API pattern once matched "versatiles-" out of "versatiles-docker".
		const workflow = file(
			'versatiles-frontend',
			'.github/workflows/release.yml',
			'run: curl https://api.github.com/repos/versatiles-org/versatiles-docker/actions/workflows/release.yml/dispatches\n',
		);
		const { edges, warnings } = collect([workflow], ['versatiles-frontend', 'versatiles-docker']);
		expect(warnings).toHaveLength(0);
		expect(asPairs(edges)).toEqual(['versatiles-frontend workflow versatiles-docker']);
	});

	it('treats a bare link to a repository as a mention, not a dependency', () => {
		const source = file(
			'app',
			'src/index.ts',
			'// see https://github.com/versatiles-org/versatiles-spec for details\n',
		);
		const { edges } = collect([source], ['app', 'versatiles-spec']);
		expect(edges).toHaveLength(0);
	});
});

describe('CI and release automation', () => {
	it('follows actions, cross-repository checkouts and dispatches', () => {
		const workflow = file(
			'planetiler-shortbread',
			'.github/workflows/ci.yml',
			[
				'      - uses: actions/checkout@v7',
				'        with:',
				'          repository: versatiles-org/planetiler',
				'      - uses: versatiles-org/node-release-tool/.github/workflows/release.yml@main',
			].join('\n'),
		);
		const { edges } = collect(
			[workflow],
			['planetiler-shortbread', 'planetiler', 'node-release-tool'],
		);
		expect(asPairs(edges)).toEqual([
			'planetiler-shortbread workflow node-release-tool',
			'planetiler-shortbread workflow planetiler',
		]);
	});

	it('leaves other organisations alone', () => {
		const workflow = file(
			'app',
			'.github/workflows/ci.yml',
			'      - uses: actions/checkout@v7\n      - uses: codecov/codecov-action@v7\n',
		);
		const { edges } = collect([workflow], ['app']);
		expect(edges).toHaveLength(0);
	});
});

describe('what the collector refuses to report', () => {
	const style = file('versatiles-style', 'package.json', '{"name":"@versatiles/style"}');

	it('drops a repository depending on itself', () => {
		const self = file(
			'versatiles-style',
			'sub/package.json',
			'{"name":"sub","dependencies":{"@versatiles/style":"^5"}}',
		);
		const { edges } = collect([style, self], ['versatiles-style']);
		expect(edges).toHaveLength(0);
	});

	it('drops a target outside the graph, and says where it came from', () => {
		const source = file(
			'app',
			'src/index.ts',
			'fetch("https://github.com/versatiles-org/gone/releases/latest")',
		);
		const { edges, warnings } = collect([source], ['app']);
		expect(edges).toHaveLength(0);
		expect(warnings[0]).toContain('"gone"');
		expect(warnings[0]).toContain('src/index.ts');
	});

	it('applies an ignore rule, and reports one that has stopped matching', () => {
		const consumer = file(
			'app',
			'package.json',
			'{"name":"app","dependencies":{"@versatiles/style":"^5"}}',
		);
		const config = configure({
			ignore: [
				{ from: 'app', to: 'versatiles-style', reason: 'a demo, not a dependency' },
				{ from: 'app', to: 'versatiles-spec', reason: 'no longer true' },
			],
		});
		const { maps, warnings } = buildNameMaps([style, consumer]);
		const result = collectEdges(
			[style, consumer],
			config,
			maps,
			new Set(['app', 'versatiles-style', 'versatiles-spec']),
			warnings,
		);
		expect(result.edges).toHaveLength(0);
		expect(result.ignoreHits.get(0)).toBe(1);
		expect(result.ignoreHits.has(1)).toBe(false);
	});
});

describe('hand-declared dependencies', () => {
	it('are included, carrying their note instead of a source link', () => {
		const { edges } = collect([], ['tiles.versatiles.org', 'planetiler-shortbread'], {
			manual: [
				{
					from: 'tiles.versatiles.org',
					to: 'planetiler-shortbread',
					kind: 'manual',
					note: 'serves the tilesets this pipeline produces',
				},
			],
		});
		expect(edges).toHaveLength(1);
		expect(edges[0].path).toBe('');
		expect(edges[0].detail).toBe('serves the tilesets this pipeline produces');
	});

	it('are reported, not silently dropped, when the target is out of the graph', () => {
		const { edges, warnings } = collect([], ['tiles.versatiles.org'], {
			manual: [
				{
					from: 'tiles.versatiles.org',
					to: 'archived-thing',
					kind: 'manual',
					note: 'historic',
				},
			],
		});
		expect(edges).toHaveLength(0);
		expect(warnings.some((warning) => warning.includes('archived-thing'))).toBe(true);
	});
});
