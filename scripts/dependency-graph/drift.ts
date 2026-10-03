/**
 * Version drift: which repositories use an older release of the project's own
 * npm packages and crates than the one most recently published.
 *
 * This is a maintainer's tool, not documentation. Versions move with every
 * release and every lockfile refresh, so nothing here is written to the
 * committed page — `npm run sync:deps -- --drift` prints a report and exits.
 *
 * For every place a repository depends on an organisation package, three
 * versions are compared:
 *
 *   requested  the range in package.json / Cargo.toml ("^6.0.1")
 *   installed  what the lockfile resolved it to ("6.0.1")
 *   latest     what npm or crates.io currently serve ("6.0.3")
 *
 * Their relation decides the fix: a lockfile behind a range that already
 * admits the latest release only needs `npm update`; a range that excludes it
 * needs the manifest changed.
 */

import { dirname, posix } from 'path';
import { styleText } from 'util';
import semver from 'semver';
import type { NameMaps, RepoFile } from './collect';

export type Ecosystem = 'npm' | 'cargo';

/** One place where a repository depends on an organisation package. */
export interface Usage {
	ecosystem: Ecosystem;
	/** npm package or crate name. */
	name: string;
	/** Repository that publishes the package. */
	provider: string;
	/** Repository that depends on it. */
	consumer: string;
	/** Manifest that declares the dependency. */
	path: string;
	/** `dependencies`, `devDependencies`, `dev-dependencies`, … */
	section: string;
	/** The requirement exactly as written. */
	requested: string;
	/** Version the lockfile resolved it to, or null without a lockfile. */
	installed: string | null;
	/** Lockfile the installed version was read from. */
	lockPath: string | null;
}

export interface Release {
	version: string;
	/** ISO date of the release, when the registry says. */
	date: string | null;
	/** `manifest` means the package is not published and main's version is used instead. */
	source: 'registry' | 'manifest';
}

export type Status = 'range' | 'stale-lock' | 'unknown' | 'ahead' | 'current';

export interface Finding extends Usage {
	status: Status;
	/** How far behind the version in use is, or null when it is not. */
	behind: 'major' | 'minor' | 'patch' | null;
	/** Short explanation for anything that is not simply current. */
	note: string;
	/** Command or edit that would bring it up to date. */
	fix: string | null;
}

/* ------------------------------------------------------------------------ */
/* Manifests                                                                */
/* ------------------------------------------------------------------------ */

const NPM_SECTIONS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
];

function npmUsages(file: RepoFile, maps: NameMaps): Usage[] {
	let manifest: Record<string, unknown>;
	try {
		manifest = JSON.parse(file.text) as Record<string, unknown>;
	} catch {
		return []; // the collector already warns about it
	}
	const usages: Usage[] = [];
	for (const section of NPM_SECTIONS) {
		const entries = manifest[section];
		if (typeof entries !== 'object' || entries === null) continue;
		for (const [name, spec] of Object.entries(entries as Record<string, unknown>)) {
			const provider = maps.npm.get(name);
			if (!provider || provider === file.repo || typeof spec !== 'string') continue;
			usages.push({
				ecosystem: 'npm',
				name,
				provider,
				consumer: file.repo,
				path: file.path,
				section,
				requested: spec,
				installed: null,
				lockPath: null,
			});
		}
	}
	return usages;
}

/** A dependency entry in a Cargo.toml, with the fields that matter here. */
interface CargoRequirement {
	crate: string;
	section: string;
	version?: string;
	git?: string;
	path?: boolean;
	workspace?: boolean;
}

const CARGO_SECTION = /^\s*\[([^\]]+)\]/;
/** `name = …`, and the dotted form `name.workspace = true` / `name.version = "…"`. */
const CARGO_ENTRY = /^\s*([A-Za-z0-9_-]+)(?:\.([a-z-]+))?\s*=\s*(.+?)\s*$/;
const CARGO_DEPS = /(^|\.)(dependencies|dev-dependencies|build-dependencies)$/;

function cargoFields(target: CargoRequirement, text: string): void {
	target.version ??= /\bversion\s*=\s*"([^"]+)"/.exec(text)?.[1];
	target.git ??= /\bgit\s*=\s*"([^"]+)"/.exec(text)?.[1];
	if (/\bpath\s*=/.test(text)) target.path = true;
	if (/\bworkspace\s*=\s*true/.test(text)) target.workspace = true;
}

/**
 * Dependency entries of a Cargo.toml, including `[workspace.dependencies]`.
 * Like the collector, a line-based reader: it only has to recognise the three
 * ways a dependency is written, not all of TOML.
 */
export function cargoRequirements(text: string): CargoRequirement[] {
	const found: CargoRequirement[] = [];
	let section = '';
	let table: CargoRequirement | null = null;

	for (const line of text.split('\n')) {
		const header = CARGO_SECTION.exec(line);
		if (header) {
			section = header[1].trim();
			table = null;
			// `[dependencies.versatiles_core]`: the entry's fields follow as keys.
			const parts = section.split('.');
			const parent = parts.slice(0, -1).join('.');
			if (parts.length > 1 && CARGO_DEPS.test(parent)) {
				table = { crate: parts[parts.length - 1], section: parent };
				found.push(table);
			}
			continue;
		}
		if (table) {
			cargoFields(table, line);
			continue;
		}
		if (!CARGO_DEPS.test(section)) continue;
		const entry = CARGO_ENTRY.exec(line);
		if (!entry) continue;
		const requirement: CargoRequirement = { crate: entry[1], section };
		const value = entry[2] ? `${entry[2]} = ${entry[3]}` : entry[3];
		if (value.startsWith('"')) requirement.version = /^"([^"]*)"/.exec(value)?.[1];
		else cargoFields(requirement, value);
		found.push(requirement);
	}
	return found;
}

/**
 * A crate inherited with `workspace = true` is required once, in the root's
 * `[workspace.dependencies]`, so that table is where the usage is recorded —
 * and where a range would have to be changed.
 */
function cargoUsages(file: RepoFile, maps: NameMaps): Usage[] {
	const usages: Usage[] = [];
	for (const req of cargoRequirements(file.text)) {
		if (req.workspace) continue;
		const provider = maps.crate.get(req.crate);
		if (!provider || provider === file.repo) continue;

		let requested = req.version ?? '';
		if (!requested && req.git) requested = `git: ${req.git}`;
		if (!requested && req.path) requested = 'path';
		usages.push({
			ecosystem: 'cargo',
			name: req.crate,
			provider,
			consumer: file.repo,
			path: file.path,
			section: req.section,
			requested: requested || '(none)',
			installed: null,
			lockPath: null,
		});
	}
	return usages;
}

/**
 * Every place a repository depends on another repository's npm package or
 * crate. Dependencies inside one repository — workspaces, path crates — are
 * left out: they are always in step by construction.
 */
export function findUsages(files: RepoFile[], maps: NameMaps): Usage[] {
	return files.flatMap((file) => {
		if (file.role === 'package') return npmUsages(file, maps);
		if (file.role === 'cargo') return cargoUsages(file, maps);
		return [];
	});
}

/**
 * Version each organisation package declares on its default branch. Used as
 * "latest" for packages that are not published to a registry at all.
 */
export function manifestVersions(files: RepoFile[]): Map<string, string> {
	const versions = new Map<string, string>();
	const workspaceVersion = new Map<string, string>();
	for (const file of files) {
		if (file.role !== 'cargo') continue;
		const version = /^\s*\[workspace\.package\][^[]*?^\s*version\s*=\s*"([^"]+)"/ms.exec(
			file.text,
		);
		if (version) workspaceVersion.set(file.repo, version[1]);
	}
	for (const file of files) {
		if (file.role === 'package') {
			try {
				const { name, version } = JSON.parse(file.text) as {
					name?: unknown;
					version?: unknown;
				};
				if (typeof name === 'string' && typeof version === 'string')
					versions.set(name, version);
			} catch {
				// not valid JSON; reported by the collector
			}
		}
		if (file.role === 'cargo') {
			const block = /^\s*\[package\]([^[]*)/ms.exec(file.text)?.[1] ?? '';
			const name = /^\s*name\s*=\s*"([^"]+)"/m.exec(block)?.[1];
			const own = /^\s*version\s*=\s*"([^"]+)"/m.exec(block)?.[1];
			const inherited = /^\s*version\.workspace\s*=\s*true/m.test(block)
				? workspaceVersion.get(file.repo)
				: undefined;
			if (name && (own ?? inherited)) versions.set(name, (own ?? inherited)!);
		}
	}
	return versions;
}

/* ------------------------------------------------------------------------ */
/* Lockfiles                                                                */
/* ------------------------------------------------------------------------ */

const LOCKFILE: Record<Ecosystem, string> = { npm: 'package-lock.json', cargo: 'Cargo.lock' };

/** Where a manifest's lockfile may live: next to it, or in any directory above it. */
export function lockCandidates(manifestPath: string, ecosystem: Ecosystem): string[] {
	const candidates: string[] = [];
	let dir = dirname(manifestPath);
	for (;;) {
		candidates.push(dir === '.' ? LOCKFILE[ecosystem] : `${dir}/${LOCKFILE[ecosystem]}`);
		if (dir === '.') return candidates;
		dir = dirname(dir);
	}
}

/**
 * The version a lockfile resolved `usage.name` to. For npm, a nested install
 * next to the manifest wins over the hoisted one; for Cargo, where one lockfile
 * can hold several versions of a crate, the highest one the requirement admits.
 */
export function lockedVersion(usage: Usage, lockPath: string, text: string): string | null {
	if (usage.ecosystem === 'npm') {
		let lock: {
			packages?: Record<string, { version?: string }>;
			dependencies?: Record<string, { version?: string }>;
		};
		try {
			lock = JSON.parse(text) as typeof lock;
		} catch {
			return null;
		}
		const relative = posix.relative(dirname(lockPath), dirname(usage.path));
		const keys = [
			...(relative ? [`${relative}/node_modules/${usage.name}`] : []),
			`node_modules/${usage.name}`,
		];
		for (const key of keys) {
			const version = lock.packages?.[key]?.version;
			if (version) return version;
		}
		return lock.dependencies?.[usage.name]?.version ?? null; // lockfile v1
	}

	const versions: string[] = [];
	for (const block of text.split(/^\[\[package\]\]/m).slice(1)) {
		const name = /^name\s*=\s*"([^"]+)"/m.exec(block)?.[1];
		const version = /^version\s*=\s*"([^"]+)"/m.exec(block)?.[1];
		if (name === usage.name && version) versions.push(version);
	}
	if (versions.length === 0) return null;
	const range = toRange(usage);
	return (
		(range && semver.maxSatisfying(versions, range)) ??
		versions.sort(semver.compareLoose).at(-1) ??
		null
	);
}

/* ------------------------------------------------------------------------ */
/* Registries                                                               */
/* ------------------------------------------------------------------------ */

export function registryUrl(ecosystem: Ecosystem, name: string): string {
	return ecosystem === 'npm'
		? `https://registry.npmjs.org/${name.replace('/', '%2f')}`
		: `https://crates.io/api/v1/crates/${encodeURIComponent(name)}`;
}

/** The latest release from an npm packument or a crates.io crate document. */
export function parseRegistry(ecosystem: Ecosystem, body: unknown): Release | null {
	if (typeof body !== 'object' || body === null) return null;
	if (ecosystem === 'npm') {
		const doc = body as { 'dist-tags'?: { latest?: string }; time?: Record<string, string> };
		const version = doc['dist-tags']?.latest;
		return version ? { version, date: doc.time?.[version] ?? null, source: 'registry' } : null;
	}
	const doc = body as {
		crate?: { max_stable_version?: string | null; max_version?: string };
		versions?: { num: string; created_at?: string }[];
	};
	const version = doc.crate?.max_stable_version ?? doc.crate?.max_version;
	if (!version) return null;
	const date = doc.versions?.find((entry) => entry.num === version)?.created_at ?? null;
	return { version, date, source: 'registry' };
}

/* ------------------------------------------------------------------------ */
/* Assessment                                                               */
/* ------------------------------------------------------------------------ */

/**
 * The requirement as a node-semver range, or null if it is not one (a git URL,
 * a workspace protocol, a dist-tag). Cargo's bare `1.2.3` means `^1.2.3`, and
 * its comma-separated comparators are space-separated in node-semver.
 */
export function toRange(usage: Pick<Usage, 'ecosystem' | 'requested'>): string | null {
	let range = usage.requested.trim();
	if (usage.ecosystem === 'cargo') {
		range = range
			.split(',')
			.map((part) => part.trim())
			.map((part) => (/^\d/.test(part) ? `^${part}` : part))
			.join(' ');
	}
	return semver.validRange(range);
}

function distance(from: string, to: string): Finding['behind'] {
	switch (semver.diff(from, to)) {
		case 'major':
		case 'premajor':
			return 'major';
		case 'minor':
		case 'preminor':
			return 'minor';
		case null:
			return null;
		default:
			return 'patch';
	}
}

function fixFor(usage: Usage, status: Status, latest: string): string | null {
	const where = dirname(usage.path) === '.' ? '' : `cd ${dirname(usage.path)} && `;
	if (usage.ecosystem === 'npm') {
		if (status === 'stale-lock') return `${where}npm update ${usage.name}`;
		if (status !== 'range') return null;
		if (usage.section === 'peerDependencies') return `widen the peer range to include ${latest}`;
		const flag =
			usage.section === 'devDependencies'
				? ' -D'
				: usage.section === 'optionalDependencies'
					? ' -O'
					: '';
		return `${where}npm install${flag} ${usage.name}@^${latest}`;
	}
	if (status === 'stale-lock') return `${where}cargo update -p ${usage.name}`;
	if (status !== 'range') return null;
	return `set ${usage.name} = "${latest}" in ${usage.path}`;
}

/** Compares one usage against the latest release. */
export function assess(usage: Usage, latest: Release | null): Finding {
	const finding = (status: Status, note: string, behind: Finding['behind'] = null): Finding => ({
		...usage,
		status,
		behind,
		note,
		fix: latest ? fixFor(usage, status, latest.version) : null,
	});

	if (!latest || !semver.valid(latest.version)) {
		return finding('unknown', 'latest release unknown');
	}
	const range = toRange(usage);
	if (!range) return finding('unknown', `not a version range: ${usage.requested}`);

	const admitsLatest = semver.satisfies(latest.version, range, { includePrerelease: true });
	const inUse = usage.installed ?? semver.minVersion(range)?.version ?? null;

	if (!usage.installed) {
		if (admitsLatest) return finding('current', 'no lockfile, a fresh install gets the latest');
		return finding(
			'range',
			'range excludes latest (no lockfile)',
			inUse ? distance(inUse, latest.version) : null,
		);
	}
	if (!semver.valid(usage.installed)) return finding('unknown', `locked to ${usage.installed}`);
	if (semver.gt(usage.installed, latest.version))
		return finding('ahead', 'newer than the latest release');
	if (semver.eq(usage.installed, latest.version)) return finding('current', '');

	const behind = distance(usage.installed, latest.version);
	return admitsLatest
		? finding('stale-lock', 'range admits latest, lockfile is behind', behind)
		: finding('range', 'range excludes latest', behind);
}

/* ------------------------------------------------------------------------ */
/* Orchestration                                                            */
/* ------------------------------------------------------------------------ */

/** What the drift check needs from GitHub and the registries. */
export interface DriftSource {
	readFile(repo: string, path: string): Promise<string | null>;
	getRegistryJson(url: string): Promise<unknown>;
}

export interface DriftResult {
	findings: Finding[];
	/** Latest release per `ecosystem:name`. */
	releases: Map<string, Release | null>;
}

export const releaseKey = (usage: Pick<Usage, 'ecosystem' | 'name'>): string =>
	`${usage.ecosystem}:${usage.name}`;

export async function collectDrift(
	files: RepoFile[],
	maps: NameMaps,
	source: DriftSource,
	mapLimit: <T, R>(items: readonly T[], worker: (item: T) => Promise<R>) => Promise<R[]>,
): Promise<DriftResult> {
	const usages = findUsages(files, maps);

	// Each lockfile is fetched once, however many usages share it.
	const lockTexts = new Map<string, Promise<string | null>>();
	const readLock = (repo: string, path: string): Promise<string | null> => {
		const key = `${repo}/${path}`;
		if (!lockTexts.has(key)) lockTexts.set(key, source.readFile(repo, path));
		return lockTexts.get(key)!;
	};

	await mapLimit(usages, async (usage) => {
		for (const candidate of lockCandidates(usage.path, usage.ecosystem)) {
			const text = await readLock(usage.consumer, candidate);
			if (text === null) continue;
			usage.lockPath = candidate;
			usage.installed = lockedVersion(usage, candidate, text);
			return;
		}
	});

	const fromManifest = manifestVersions(files);
	const keys = [...new Map(usages.map((usage) => [releaseKey(usage), usage])).values()];
	const releases = new Map<string, Release | null>();
	await mapLimit(keys, async ({ ecosystem, name }) => {
		const body = await source.getRegistryJson(registryUrl(ecosystem, name));
		const published = parseRegistry(ecosystem, body);
		const version = fromManifest.get(name);
		releases.set(
			releaseKey({ ecosystem, name }),
			published ?? (version ? { version, date: null, source: 'manifest' } : null),
		);
	});

	const findings = usages.map((usage) => assess(usage, releases.get(releaseKey(usage)) ?? null));
	return { findings, releases };
}

/* ------------------------------------------------------------------------ */
/* Report                                                                   */
/* ------------------------------------------------------------------------ */

const STATUS_ORDER: Status[] = ['range', 'stale-lock', 'unknown', 'ahead', 'current'];

/** The statuses that mean a newer release exists and is not in use. */
const OUTDATED: Status[] = ['range', 'stale-lock'];

const STATUS_STYLE: Record<Status, { mark: string; color: Parameters<typeof styleText>[0] }> = {
	range: { mark: '✗', color: 'red' },
	'stale-lock': { mark: '↑', color: 'yellow' },
	unknown: { mark: '?', color: 'magenta' },
	ahead: { mark: '»', color: 'cyan' },
	current: { mark: '✓', color: 'green' },
};

function pad(text: string, width: number): string {
	return text + ' '.repeat(Math.max(0, width - [...text].length));
}

function age(date: string, now: Date): string {
	const days = Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000);
	if (days <= 0) return 'today';
	return days === 1 ? '1 day ago' : `${days} days ago`;
}

export interface ReportOptions {
	color: boolean;
	now: Date;
	/** Leave out packages whose every usage is current. */
	onlyOutdated: boolean;
	/**
	 * Breaks ties in the update order: of two repositories that do not depend
	 * on each other, the one with the lower rank is listed first.
	 */
	rank?: (repo: string) => number;
}

/**
 * The order in which to work through `repos` so that nothing has to be done
 * twice: a repository comes after every other one in the list whose packages
 * it uses, directly or through repositories that are not in the list. Updating
 * one of those means a new release of it, and whatever builds on that release
 * would be outdated again the moment it is published.
 *
 * Every usage counts, not only the outdated ones — a dependency that is current
 * today stops being so once its provider has been updated and released.
 *
 * Where the dependencies leave a choice, `rank` decides and the name settles
 * what is left. A cycle cannot be ordered; it is broken at the repository that
 * waits for the fewest others, so the rest of the list still comes out right.
 */
export function updateOrder(
	repos: string[],
	usages: Pick<Usage, 'consumer' | 'provider'>[],
	rank: (repo: string) => number = () => 0,
): string[] {
	const providers = new Map<string, Set<string>>();
	for (const { consumer, provider } of usages) {
		if (!providers.has(consumer)) providers.set(consumer, new Set());
		providers.get(consumer)!.add(provider);
	}

	// What each repository waits for, among the ones to be ordered.
	const listed = new Set(repos);
	const waitsFor = new Map<string, Set<string>>();
	for (const repo of listed) {
		const found = new Set<string>();
		const seen = new Set([repo]);
		const queue = [repo];
		while (queue.length > 0) {
			for (const provider of providers.get(queue.pop()!) ?? []) {
				if (seen.has(provider)) continue;
				seen.add(provider);
				if (listed.has(provider)) found.add(provider);
				queue.push(provider);
			}
		}
		waitsFor.set(repo, found);
	}

	const order: string[] = [];
	const remaining = new Set(listed);
	const open = (repo: string): number =>
		[...waitsFor.get(repo)!].filter((provider) => remaining.has(provider)).length;
	while (remaining.size > 0) {
		const next = [...remaining].sort(
			(a, b) => open(a) - open(b) || rank(a) - rank(b) || a.localeCompare(b),
		)[0];
		order.push(next);
		remaining.delete(next);
	}
	return order;
}

export function renderDrift(result: DriftResult, options: ReportOptions): string {
	const paint = (format: Parameters<typeof styleText>[0], text: string): string =>
		options.color ? styleText(format, text, { validateStream: false }) : text;

	const groups = new Map<string, Finding[]>();
	for (const finding of result.findings) {
		const key = releaseKey(finding);
		groups.set(key, [...(groups.get(key) ?? []), finding]);
	}

	const note = (finding: Finding): string =>
		[finding.behind ? `${finding.behind} behind` : '', finding.note].filter(Boolean).join(', ');
	const isRoot = (finding: Finding): boolean =>
		finding.path === 'package.json' || finding.path === 'Cargo.toml';

	const lines: string[] = [];
	const totals = new Map<Status, number>();

	for (const key of [...groups.keys()].sort()) {
		const findings = groups.get(key)!;
		for (const finding of findings)
			totals.set(finding.status, (totals.get(finding.status) ?? 0) + 1);
		if (options.onlyOutdated && findings.every((finding) => finding.status === 'current'))
			continue;

		const first = findings[0];
		const release = result.releases.get(key) ?? null;
		const header = [paint('bold', first.name), paint('bold', release?.version ?? '?')];
		const facts = [first.ecosystem, `from ${first.provider}`];
		if (release?.source === 'manifest') facts.push('not published, version on main');
		if (release?.date)
			facts.push(`released ${release.date.slice(0, 10)} (${age(release.date, options.now)})`);
		lines.push(`${header.join(' ')}  ${paint('dim', facts.join(' · '))}`);

		// "6.0.3 ×9 · 6.0.1 ×2": the spread at a glance, newest first.
		const spread = new Map<string, number>();
		for (const finding of findings) {
			const version = finding.installed ?? `${finding.requested} (unlocked)`;
			spread.set(version, (spread.get(version) ?? 0) + 1);
		}
		const ordered = [...spread].sort(([a], [b]) =>
			semver.valid(a) && semver.valid(b) ? semver.rcompare(a, b) : a.localeCompare(b),
		);
		lines.push(`  ${paint('dim', ordered.map(([v, n]) => `${v} ×${n}`).join(' · '))}`);

		const rows = [...findings].sort(
			(a, b) =>
				STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
				a.consumer.localeCompare(b.consumer) ||
				a.path.localeCompare(b.path),
		);
		const where = (finding: Finding): string =>
			isRoot(finding) ? finding.consumer : `${finding.consumer}/${dirname(finding.path)}`;
		const whereWidth = Math.max(...rows.map((row) => [...where(row)].length));
		const installedWidth = Math.max(...rows.map((row) => (row.installed ?? '—').length));
		const requestedWidth = Math.max(...rows.map((row) => row.requested.length));

		for (const row of rows) {
			const style = STATUS_STYLE[row.status];
			const cells = [
				paint(style.color, style.mark),
				pad(where(row), whereWidth),
				pad(row.installed ?? '—', installedWidth),
				paint('dim', pad(row.requested, requestedWidth)),
				row.section.startsWith('dev') ? paint('dim', 'dev') : '   ',
				note(row) ? paint(style.color, note(row)) : '',
			];
			lines.push(`  ${cells.join('  ')}`.trimEnd());
		}
		lines.push('');
	}
	if (lines.length > 0) lines.unshift(paint('underline', 'Packages and their dependents'), '');

	// The same findings the other way around: what each repository has to update.
	const dependents = new Map<string, Finding[]>();
	for (const finding of result.findings) {
		if (!OUTDATED.includes(finding.status)) continue;
		dependents.set(finding.consumer, [...(dependents.get(finding.consumer) ?? []), finding]);
	}
	if (dependents.size > 0)
		lines.push(
			paint('underline', 'Dependents and their outdated packages'),
			paint('dim', 'in the order to update them: each one after the repositories it builds on'),
			'',
		);

	for (const consumer of updateOrder([...dependents.keys()], result.findings, options.rank)) {
		const rows = dependents
			.get(consumer)!
			.sort(
				(a, b) =>
					STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
					a.name.localeCompare(b.name) ||
					a.path.localeCompare(b.path),
			);
		lines.push(`${paint('bold', consumer)}  ${paint('dim', `${rows.length} outdated`)}`);

		const what = (finding: Finding): string =>
			isRoot(finding) ? finding.name : `${finding.name} in ${dirname(finding.path)}`;
		const versions = (finding: Finding): string =>
			`${finding.installed ?? '—'} → ${result.releases.get(releaseKey(finding))?.version ?? '?'}`;
		const whatWidth = Math.max(...rows.map((row) => [...what(row)].length));
		const versionsWidth = Math.max(...rows.map((row) => [...versions(row)].length));
		const requestedWidth = Math.max(...rows.map((row) => row.requested.length));

		for (const row of rows) {
			const style = STATUS_STYLE[row.status];
			const cells = [
				paint(style.color, style.mark),
				pad(what(row), whatWidth),
				pad(versions(row), versionsWidth),
				paint('dim', pad(row.requested, requestedWidth)),
				row.section.startsWith('dev') ? paint('dim', 'dev') : '   ',
				paint(style.color, note(row)),
			];
			lines.push(`  ${cells.join('  ')}`.trimEnd());
		}
		lines.push('');
	}

	const summary = STATUS_ORDER.filter((status) => totals.get(status)).map(
		(status) => `${totals.get(status)} ${status === 'range' ? 'range excludes latest' : status}`,
	);
	lines.push(
		`${groups.size} packages, ${result.findings.length} usages` +
			(summary.length ? `: ${summary.join(', ')}` : ''),
	);
	return lines.join('\n');
}
