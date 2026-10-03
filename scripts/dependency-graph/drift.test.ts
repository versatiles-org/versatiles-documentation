import { describe, expect, it } from 'vitest';
import { buildNameMaps, classify, type RepoFile } from './collect';
import {
	assess,
	cargoRequirements,
	collectDrift,
	findUsages,
	lockCandidates,
	lockedVersion,
	manifestVersions,
	parseRegistry,
	registryUrl,
	renderDrift,
	updateOrder,
	toRange,
	type DriftSource,
	type Release,
	type Usage,
} from './drift';
import { mapLimit } from './github';

function file(repo: string, path: string, text: string): RepoFile {
	const role = classify(path);
	if (!role) throw new Error(`${path} is not a file the collector reads`);
	return { repo, path, role, text };
}

const pkg = (name: string, extra: Record<string, unknown> = {}): string =>
	JSON.stringify({ name, version: '1.0.0', ...extra });

function usage(overrides: Partial<Usage> = {}): Usage {
	return {
		ecosystem: 'npm',
		name: '@versatiles/style',
		provider: 'versatiles-style',
		consumer: 'versatiles-frontend',
		path: 'package.json',
		section: 'dependencies',
		requested: '^6.0.1',
		installed: '6.0.1',
		lockPath: 'package-lock.json',
		...overrides,
	};
}

const release = (version: string): Release => ({ version, date: null, source: 'registry' });

describe('findUsages', () => {
	it('lists npm dependencies on other repositories, with their section', () => {
		const files = [
			file('versatiles-style', 'package.json', pkg('@versatiles/style')),
			file(
				'versatiles-frontend',
				'package.json',
				pkg('versatiles-frontend', {
					dependencies: { '@versatiles/style': '^6.0.1', lodash: '^4' },
					devDependencies: { '@versatiles/style': '^6.0.1' },
				}),
			),
		];
		const { maps } = buildNameMaps(files);
		const found = findUsages(files, maps).map((u) => `${u.consumer} ${u.section} ${u.requested}`);
		expect(found).toEqual([
			'versatiles-frontend dependencies ^6.0.1',
			'versatiles-frontend devDependencies ^6.0.1',
		]);
	});

	it('leaves out packages from the same repository', () => {
		const files = [
			file('mono', 'a/package.json', pkg('@versatiles/a')),
			file(
				'mono',
				'b/package.json',
				pkg('@versatiles/b', { dependencies: { '@versatiles/a': '*' } }),
			),
		];
		const { maps } = buildNameMaps(files);
		expect(findUsages(files, maps)).toEqual([]);
	});

	it('records a workspace crate in the root table, not in the members inheriting it', () => {
		const files = [
			file(
				'versatiles-rs',
				'versatiles_core/Cargo.toml',
				'[package]\nname = "versatiles_core"\n',
			),
			file(
				'versatiles-studio',
				'Cargo.toml',
				'[workspace]\n\n[workspace.dependencies]\nversatiles_core = "4.12.2"\n',
			),
			file(
				'versatiles-studio',
				'src-tauri/Cargo.toml',
				'[package]\nname = "studio"\n\n[dependencies]\nversatiles_core.workspace = true\n',
			),
		];
		const { maps } = buildNameMaps(files);
		const found = findUsages(files, maps);
		expect(found).toHaveLength(1);
		expect(found[0]).toMatchObject({
			path: 'Cargo.toml',
			section: 'workspace.dependencies',
			requested: '4.12.2',
		});
	});
});

describe('cargoRequirements', () => {
	it('reads the three ways a dependency is written', () => {
		const text = [
			'[dependencies]',
			'a = "1.2"',
			'b = { version = "0.3", features = ["x"] }',
			'c = { git = "https://github.com/versatiles-org/c" }',
			'd.workspace = true',
			'',
			'[dev-dependencies.e]',
			'version = "2"',
			'',
			'[package.metadata]',
			'f = "9"',
		].join('\n');
		expect(cargoRequirements(text)).toEqual([
			{ crate: 'a', section: 'dependencies', version: '1.2' },
			{ crate: 'b', section: 'dependencies', version: '0.3' },
			{ crate: 'c', section: 'dependencies', git: 'https://github.com/versatiles-org/c' },
			{ crate: 'd', section: 'dependencies', workspace: true },
			{ crate: 'e', section: 'dev-dependencies', version: '2' },
		]);
	});
});

describe('manifestVersions', () => {
	it('reads npm versions and Cargo versions, inherited ones included', () => {
		const files = [
			file('style', 'package.json', pkg('@versatiles/style', { version: '6.0.3' })),
			file('rs', 'Cargo.toml', '[workspace.package]\nversion = "4.15.0"\n'),
			file('rs', 'core/Cargo.toml', '[package]\nname = "core"\nversion.workspace = true\n'),
			file('rs', 'own/Cargo.toml', '[package]\nname = "own"\nversion = "0.1.0"\n'),
		];
		expect(Object.fromEntries(manifestVersions(files))).toEqual({
			'@versatiles/style': '6.0.3',
			core: '4.15.0',
			own: '0.1.0',
		});
	});
});

describe('lockfiles', () => {
	it('looks next to the manifest first, then upwards', () => {
		expect(lockCandidates('a/b/package.json', 'npm')).toEqual([
			'a/b/package-lock.json',
			'a/package-lock.json',
			'package-lock.json',
		]);
		expect(lockCandidates('Cargo.toml', 'cargo')).toEqual(['Cargo.lock']);
	});

	it('prefers a nested npm install over the hoisted one', () => {
		const lock = JSON.stringify({
			packages: {
				'node_modules/@versatiles/style': { version: '5.13.1' },
				'app/node_modules/@versatiles/style': { version: '6.0.3' },
			},
		});
		expect(lockedVersion(usage({ path: 'app/package.json' }), 'package-lock.json', lock)).toBe(
			'6.0.3',
		);
		expect(lockedVersion(usage({ path: 'other/package.json' }), 'package-lock.json', lock)).toBe(
			'5.13.1',
		);
	});

	it('reads version 1 npm lockfiles', () => {
		const lock = JSON.stringify({ dependencies: { '@versatiles/style': { version: '5.0.0' } } });
		expect(lockedVersion(usage(), 'package-lock.json', lock)).toBe('5.0.0');
		expect(lockedVersion(usage(), 'package-lock.json', 'not json')).toBeNull();
	});

	it('picks the highest locked crate version the requirement admits', () => {
		const lock = [
			'[[package]]\nname = "versatiles_core"\nversion = "3.9.0"\n',
			'[[package]]\nname = "versatiles_core"\nversion = "4.12.2"\n',
			'[[package]]\nname = "other"\nversion = "9.0.0"\n',
		].join('\n');
		const cargo = usage({ ecosystem: 'cargo', name: 'versatiles_core', requested: '3.1' });
		expect(lockedVersion(cargo, 'Cargo.lock', lock)).toBe('3.9.0');
		expect(lockedVersion({ ...cargo, requested: 'git: x' }, 'Cargo.lock', lock)).toBe('4.12.2');
		expect(lockedVersion({ ...cargo, name: 'missing' }, 'Cargo.lock', lock)).toBeNull();
	});
});

describe('registries', () => {
	it('builds registry URLs', () => {
		expect(registryUrl('npm', '@versatiles/style')).toBe(
			'https://registry.npmjs.org/@versatiles%2fstyle',
		);
		expect(registryUrl('cargo', 'versatiles_core')).toBe(
			'https://crates.io/api/v1/crates/versatiles_core',
		);
	});

	it('reads the latest release and its date', () => {
		expect(
			parseRegistry('npm', {
				'dist-tags': { latest: '6.0.3' },
				time: { '6.0.3': '2026-09-28' },
			}),
		).toEqual({ version: '6.0.3', date: '2026-09-28', source: 'registry' });
		expect(
			parseRegistry('cargo', {
				crate: { max_stable_version: '4.15.0', max_version: '5.0.0-beta' },
				versions: [{ num: '4.15.0', created_at: '2026-09-20' }],
			}),
		).toEqual({ version: '4.15.0', date: '2026-09-20', source: 'registry' });
		expect(parseRegistry('npm', null)).toBeNull();
		expect(parseRegistry('npm', {})).toBeNull();
		expect(parseRegistry('cargo', { crate: {} })).toBeNull();
	});
});

describe('toRange', () => {
	it('reads Cargo requirements with Cargo’s defaults', () => {
		expect(toRange({ ecosystem: 'cargo', requested: '4.12' })).toBe('>=4.12.0 <5.0.0-0');
		expect(toRange({ ecosystem: 'cargo', requested: '>=1, <2' })).toBe('>=1.0.0 <2.0.0-0');
		expect(toRange({ ecosystem: 'cargo', requested: '=1.2.3' })).toBe('1.2.3');
	});

	it('rejects what is not a range', () => {
		expect(toRange({ ecosystem: 'npm', requested: 'github:versatiles-org/x' })).toBeNull();
		expect(toRange({ ecosystem: 'npm', requested: 'workspace:*' })).toBeNull();
	});
});

describe('assess', () => {
	it('tells a stale lockfile from a range that needs changing', () => {
		expect(assess(usage(), release('6.0.3'))).toMatchObject({
			status: 'stale-lock',
			behind: 'patch',
			fix: 'npm update @versatiles/style',
		});
		expect(
			assess(usage({ requested: '^5.13.1', installed: '5.13.1' }), release('6.0.3')),
		).toMatchObject({
			status: 'range',
			behind: 'major',
			fix: 'npm install @versatiles/style@^6.0.3',
		});
	});

	it('suggests fixes that fit the section and location', () => {
		const old = { requested: '^5.0.0', installed: '5.0.0' };
		expect(assess(usage({ ...old, section: 'devDependencies' }), release('6.0.0')).fix).toBe(
			'npm install -D @versatiles/style@^6.0.0',
		);
		expect(assess(usage({ ...old, section: 'optionalDependencies' }), release('6.0.0')).fix).toBe(
			'npm install -O @versatiles/style@^6.0.0',
		);
		expect(assess(usage({ ...old, section: 'peerDependencies' }), release('6.0.0')).fix).toBe(
			'widen the peer range to include 6.0.0',
		);
		expect(assess(usage({ path: 'web/package.json' }), release('6.1.0'))).toMatchObject({
			behind: 'minor',
			fix: 'cd web && npm update @versatiles/style',
		});

		const cargo = usage({
			ecosystem: 'cargo',
			name: 'versatiles_core',
			path: 'Cargo.toml',
			requested: '4.12.2',
			installed: '4.12.2',
		});
		expect(assess(cargo, release('4.15.0')).fix).toBe('cargo update -p versatiles_core');
		expect(assess(cargo, release('5.0.0')).fix).toBe(
			'set versatiles_core = "5.0.0" in Cargo.toml',
		);
	});

	it('reports current, ahead and unknown', () => {
		expect(assess(usage({ installed: '6.0.3' }), release('6.0.3')).status).toBe('current');
		expect(assess(usage({ installed: '6.1.0' }), release('6.0.3')).status).toBe('ahead');
		expect(assess(usage(), null).status).toBe('unknown');
		expect(assess(usage({ requested: 'github:x/y' }), release('6.0.3')).status).toBe('unknown');
		expect(assess(usage({ installed: 'weird' }), release('6.0.3')).status).toBe('unknown');
	});

	it('judges an unlocked dependency by its range alone', () => {
		expect(assess(usage({ installed: null }), release('6.0.3')).status).toBe('current');
		expect(
			assess(usage({ installed: null, requested: '^1.1.0' }), release('2.2.0')),
		).toMatchObject({ status: 'range', behind: 'major' });
	});
});

describe('collectDrift', () => {
	it('reads lockfiles once and falls back to the manifest for unpublished packages', async () => {
		const files = [
			file('versatiles-style', 'package.json', pkg('@versatiles/style', { version: '6.0.3' })),
			file('private-lib', 'package.json', pkg('@versatiles/private', { version: '0.2.0' })),
			file(
				'frontend',
				'package.json',
				pkg('frontend', {
					dependencies: { '@versatiles/style': '^6.0.1', '@versatiles/private': '^0.1.0' },
				}),
			),
		];
		const { maps } = buildNameMaps(files);
		const reads: string[] = [];
		const source: DriftSource = {
			readFile: (repo, path) => {
				reads.push(`${repo}/${path}`);
				return Promise.resolve(
					JSON.stringify({
						packages: {
							'node_modules/@versatiles/style': { version: '6.0.1' },
							'node_modules/@versatiles/private': { version: '0.1.0' },
						},
					}),
				);
			},
			getRegistryJson: (url) =>
				Promise.resolve(
					url.includes('style')
						? { 'dist-tags': { latest: '6.0.3' }, time: { '6.0.3': '2026-09-20T00:00:00Z' } }
						: null,
				),
		};

		const result = await collectDrift(files, maps, source, mapLimit);
		expect(reads).toEqual(['frontend/package-lock.json']);
		expect(result.findings.map((f) => `${f.name} ${f.status}`).sort()).toEqual([
			'@versatiles/private range',
			'@versatiles/style stale-lock',
		]);
		expect(result.releases.get('npm:@versatiles/private')).toEqual({
			version: '0.2.0',
			date: null,
			source: 'manifest',
		});

		const report = renderDrift(result, {
			color: false,
			now: new Date('2026-09-28T00:00:00Z'),
			onlyOutdated: false,
		});
		expect(report).toContain('@versatiles/style 6.0.3  npm · from versatiles-style');
		expect(report).toContain('released 2026-09-20 (8 days ago)');
		expect(report).toContain('not published, version on main');
		expect(report).not.toContain('npm update');
		expect(report).toContain('frontend  2 outdated');
		expect(report).toMatch(/2 packages, 2 usages: 1 range excludes latest, 1 stale-lock$/);
	});
});

describe('renderDrift', () => {
	const now = new Date('2026-09-28T00:00:00Z');

	it('shows the spread of versions and puts the worst first', () => {
		const findings = [
			assess(usage({ consumer: 'a', installed: '6.0.3' }), release('6.0.3')),
			assess(
				usage({ consumer: 'b', requested: '^5.0.0', installed: '5.0.0' }),
				release('6.0.3'),
			),
			assess(usage({ consumer: 'c', path: 'web/package.json' }), release('6.0.3')),
		];
		const report = renderDrift(
			{ findings, releases: new Map([['npm:@versatiles/style', release('6.0.3')]]) },
			{ color: false, now, onlyOutdated: false },
		);
		const lines = report.split('\n');
		expect(lines[0]).toBe('Packages and their dependents');
		expect(lines[3]).toBe('  6.0.3 ×1 · 6.0.1 ×1 · 5.0.0 ×1');
		expect(lines[4]).toMatch(/^ {2}✗ {2}b /);
		expect(lines[5]).toMatch(/^ {2}↑ {2}c\/web /);
		expect(lines[6]).toMatch(/^ {2}✓ {2}a /);
	});

	it('lists, per dependent, the packages it is behind on', () => {
		const style = release('6.0.3');
		const core = usage({ name: '@versatiles/core', provider: 'versatiles-core' });
		const findings = [
			assess(usage({ consumer: 'a', installed: '6.0.3' }), style),
			assess(usage({ consumer: 'b', path: 'web/package.json' }), style),
			assess(usage({ consumer: 'b', requested: '^5.0.0', installed: '5.0.0' }), style),
			assess({ ...core, consumer: 'b', section: 'devDependencies' }, release('6.1.0')),
			assess({ ...core, consumer: 'c', installed: '7.0.0' }, release('6.1.0')),
		];
		const releases = new Map([
			['npm:@versatiles/style', style],
			['npm:@versatiles/core', release('6.1.0')],
		]);
		const report = renderDrift(
			{ findings, releases },
			{ color: false, now, onlyOutdated: false },
		);
		const section = report.split('after the repositories it builds on\n\n')[1].split('\n');
		expect(section.slice(0, 5)).toEqual([
			'b  3 outdated',
			'  ✗  @versatiles/style         5.0.0 → 6.0.3  ^5.0.0       major behind, range excludes latest',
			'  ↑  @versatiles/core          6.0.1 → 6.1.0  ^6.0.1  dev  minor behind, range admits latest, lockfile is behind',
			'  ↑  @versatiles/style in web  6.0.1 → 6.0.3  ^6.0.1       patch behind, range admits latest, lockfile is behind',
			'',
		]);
		// a is current and c is ahead: neither has anything to update.
		expect(section[5]).toMatch(/^2 packages, 5 usages/);
	});

	it('can leave out packages that are fully current, and colours on request', () => {
		const findings = [assess(usage({ installed: '6.0.3' }), release('6.0.3'))];
		const result = { findings, releases: new Map([['npm:@versatiles/style', release('6.0.3')]]) };
		expect(renderDrift(result, { color: false, now, onlyOutdated: true })).toBe(
			'1 packages, 1 usages: 1 current',
		);
		expect(renderDrift(result, { color: true, now, onlyOutdated: false })).toContain('\u001b[');
	});

	it('says how long ago a release was', () => {
		const at = (date: string): Release => ({ version: '6.0.3', date, source: 'registry' });
		const findings = [assess(usage({ installed: '6.0.3' }), release('6.0.3'))];
		const render = (date: string): string =>
			renderDrift(
				{ findings, releases: new Map([['npm:@versatiles/style', at(date)]]) },
				{ color: false, now, onlyOutdated: false },
			);
		expect(render('2026-09-28T00:00:00Z')).toContain('(today)');
		expect(render('2026-09-27T00:00:00Z')).toContain('(1 day ago)');
	});
});

describe('updateOrder', () => {
	const uses = (consumer: string, provider: string) => ({ consumer, provider });

	it('lists a repository after everything it builds on', () => {
		const usages = [
			uses('app', 'style'),
			uses('style', 'release-tool'),
			uses('app', 'container'),
		];
		expect(updateOrder(['app', 'container', 'release-tool', 'style'], usages)).toEqual([
			'container',
			'release-tool',
			'style',
			'app',
		]);
	});

	it('sees a dependency through a repository that is not in the list', () => {
		const usages = [uses('app', 'middle'), uses('middle', 'base')];
		expect(updateOrder(['app', 'base'], usages)).toEqual(['base', 'app']);
	});

	it('lets the rank decide between repositories that are independent', () => {
		const rank = (repo: string): number => ['helper', 'core', 'site'].indexOf(repo);
		expect(updateOrder(['core', 'site', 'helper'], [], rank)).toEqual(['helper', 'core', 'site']);
	});

	it('puts a dependency first even against the rank', () => {
		const rank = (repo: string): number => (repo === 'site' ? 0 : 1);
		expect(updateOrder(['site', 'core'], [uses('site', 'core')], rank)).toEqual(['core', 'site']);
	});

	it('still orders the rest when two repositories depend on each other', () => {
		const usages = [uses('a', 'b'), uses('b', 'a'), uses('c', 'a'), uses('a', 'base')];
		expect(updateOrder(['c', 'b', 'a', 'base'], usages)).toEqual(['base', 'a', 'b', 'c']);
	});
});
