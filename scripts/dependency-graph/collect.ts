/**
 * Turns repository files into dependency edges.
 *
 * Every extractor is deliberately narrow: it looks at a specific kind of file
 * and reports what it found together with the line that proves it. Nothing
 * scans Markdown — README badges and prose links mention half the organisation
 * and would drown the graph in arrows that mean nothing.
 */

import type { GraphConfig } from './config';
import type { Edge } from './model';

/** What an extractor may do with a file. */
export type FileRole = 'package' | 'cargo' | 'docker' | 'workflow' | 'source';

export interface RepoFile {
	repo: string;
	path: string;
	role: FileRole;
	text: string;
}

/** Generated output, vendored code and test fixtures never define a dependency. */
const SKIP_DIR =
	/(^|\/)(node_modules|dist|build|out|target|coverage|docs|vendor|third_party|\.git|\.svelte-kit|\.vitepress|\.next|\.cache|test|tests|__tests__|__snapshots__|e2e|testdata|test-results|fixtures|playwright-report)\//;

const SKIP_FILE =
	/(^|\/)(package-lock\.json|.+\.lock|.+\.min\.js|.+\.d\.ts|.+\.map|.+\.(test|spec)\.[a-z]+)$/;

/**
 * This tool's own configuration and source code. Both are full of repository
 * names — the image mapping, the URL patterns, an example in a comment — and
 * none of them is a dependency of the repository that happens to host the
 * generator. Left in, they show up as the documentation depending on half the
 * organisation.
 */
const OWN_SOURCE = /^scripts\/dependency-graph(\.ya?ml|\/)/;

const DOCKERFILE = /(^|\/)(Dockerfile(\.[\w.-]+)?|[\w.-]+\.dockerfile)$/i;
const COMPOSE_FILE = /(^|\/)(docker-)?compose(\.[\w-]+)?\.ya?ml$/i;
const WORKFLOW_FILE = /^\.github\/(workflows\/[\w.-]+\.ya?ml|actions\/.+\/action\.ya?ml)$/;
const SOURCE_FILE = /\.(sh|bash|ts|js|mjs|cjs|ya?ml)$/;

/**
 * Decides whether a file is worth fetching, and which extractor gets it.
 * Returns null for the vast majority of files.
 */
export function classify(path: string): FileRole | null {
	if (SKIP_DIR.test(path) || SKIP_FILE.test(path) || OWN_SOURCE.test(path)) return null;
	if (WORKFLOW_FILE.test(path)) return 'workflow';
	if (path === 'package.json' || path.endsWith('/package.json')) return 'package';
	if (path === 'Cargo.toml' || path.endsWith('/Cargo.toml')) return 'cargo';
	if (DOCKERFILE.test(path) || COMPOSE_FILE.test(path)) return 'docker';
	if (SOURCE_FILE.test(path)) return 'source';
	return null;
}

/** 1-based line number of the first line containing `needle`, or 0. */
function lineOf(text: string, needle: string): number {
	const index = text.indexOf(needle);
	if (index === -1) return 0;
	return text.slice(0, index).split('\n').length;
}

/** Line number of a match offset inside `text`, or 0 if the offset is unknown. */
function lineAt(text: string, index: number | undefined): number {
	if (index === undefined) return 0;
	return text.slice(0, index).split('\n').length;
}

/**
 * Package and crate names do not match repository names — `@versatiles/server`
 * lives in `node-versatiles-server`, and one repository can publish a dozen
 * crates. Both maps are therefore derived from the manifests themselves.
 */
export interface NameMaps {
	npm: Map<string, string>;
	crate: Map<string, string>;
}

export function buildNameMaps(files: RepoFile[]): { maps: NameMaps; warnings: string[] } {
	const maps: NameMaps = { npm: new Map(), crate: new Map() };
	const warnings: string[] = [];

	const claim = (map: Map<string, string>, name: string, file: RepoFile, what: string): void => {
		const owner = map.get(name);
		if (owner && owner !== file.repo) {
			warnings.push(`${what} "${name}" is declared by both ${owner} and ${file.repo}`);
			return;
		}
		map.set(name, file.repo);
	};

	for (const file of files) {
		if (file.role === 'package') {
			let name: unknown;
			try {
				name = (JSON.parse(file.text) as { name?: unknown }).name;
			} catch {
				continue; // reported by the npm extractor
			}
			if (typeof name === 'string' && name) claim(maps.npm, name, file, 'npm package');
		}
		if (file.role === 'cargo') {
			const name = /^\s*\[package\][^[]*?^\s*name\s*=\s*"([^"]+)"/ms.exec(file.text)?.[1];
			if (name) claim(maps.crate, name, file, 'crate');
		}
	}
	return { maps, warnings };
}

interface Context {
	config: GraphConfig;
	maps: NameMaps;
	warnings: string[];
}

/** npm dependencies, plus dependency specs that point straight at a repository. */
function extractNpm(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	let manifest: Record<string, unknown>;
	try {
		manifest = JSON.parse(file.text) as Record<string, unknown>;
	} catch {
		context.warnings.push(`${file.repo}/${file.path}: not valid JSON`);
		return edges;
	}

	const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
	for (const field of fields) {
		const section = manifest[field];
		if (typeof section !== 'object' || section === null) continue;
		for (const [name, range] of Object.entries(section as Record<string, string>)) {
			const line = lineOf(file.text, `"${name}"`);
			const byName = context.maps.npm.get(name);
			if (byName) {
				edges.push({
					from: file.repo,
					to: byName,
					kind: 'npm',
					detail: `${name}@${range}`,
					path: file.path,
					line,
				});
				continue;
			}
			// "foo": "github:versatiles-org/bar" and friends.
			const bySpec = /versatiles-org\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:#|$)/.exec(String(range));
			if (bySpec) {
				edges.push({
					from: file.repo,
					to: bySpec[1],
					kind: 'npm',
					detail: `${name}@${range}`,
					path: file.path,
					line,
				});
			}
		}
	}
	return edges;
}

const CARGO_SECTION = /^\s*\[([^\]]+)\]/;
const CARGO_KEY = /^\s*([A-Za-z0-9_-]+)\s*=/;
/** `[dependencies]`, `[dev-dependencies]`, `[target.'…'.dependencies]`, … */
const CARGO_DEPS_SECTION = /(^|\.)(dependencies|dev-dependencies|build-dependencies)$/;

/**
 * A deliberately shallow TOML reader: it only has to recognise dependency
 * tables and their keys, and every name it produces is checked against the
 * crates the organisation actually publishes.
 */
function extractCargo(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	const lines = file.text.split('\n');
	let section = '';

	const add = (crate: string, index: number): void => {
		const target = context.maps.crate.get(crate);
		if (!target) return;
		edges.push({
			from: file.repo,
			to: target,
			kind: 'cargo',
			detail: crate,
			path: file.path,
			line: index + 1,
		});
	};

	lines.forEach((line, index) => {
		const header = CARGO_SECTION.exec(line);
		if (header) {
			section = header[1].trim();
			// `[dependencies.versatiles_core]` names the crate in the header itself.
			const parts = section.split('.');
			if (parts.length > 1 && CARGO_DEPS_SECTION.test(parts.slice(0, -1).join('.'))) {
				add(parts[parts.length - 1], index);
			}
			return;
		}
		if (!CARGO_DEPS_SECTION.test(section)) return;
		const key = CARGO_KEY.exec(line);
		if (key) add(key[1], index);
	});

	return edges;
}

const DOCKER_FROM = /^\s*FROM\s+(?:--\S+\s+)*(\S+)(?:\s+AS\s+(\S+))?/gim;
const DOCKER_COPY_FROM = /^\s*COPY\s+(?:[^\n]*?)--from=(\S+)/gim;
const COMPOSE_IMAGE = /^\s*image:\s*["']?([^\s"']+)/gim;
/** Images published under the organisation are recognised without configuration. */
const GHCR_IMAGE = /ghcr\.io\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/g;

/** Strips the tag or digest from an image reference. */
function imageName(reference: string): string {
	const withoutDigest = reference.split('@')[0];
	const slash = withoutDigest.lastIndexOf('/');
	const colon = withoutDigest.lastIndexOf(':');
	return colon > slash ? withoutDigest.slice(0, colon) : withoutDigest;
}

function extractDocker(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	const stages = new Set<string>();

	const add = (reference: string, index: number): void => {
		const name = imageName(reference);
		if (stages.has(name) || name.includes('$')) return;
		const target = context.config.images[name];
		if (!target) {
			if (/versatiles/i.test(name)) {
				context.warnings.push(
					`${file.repo}/${file.path}: image "${name}" is not listed under "images:"`,
				);
			}
			return;
		}
		edges.push({
			from: file.repo,
			to: target,
			kind: 'docker',
			detail: name,
			path: file.path,
			line: lineAt(file.text, index),
		});
	};

	// Build stages shadow image names, so collect them before resolving anything.
	for (const match of file.text.matchAll(DOCKER_FROM)) if (match[2]) stages.add(match[2]);

	for (const match of file.text.matchAll(DOCKER_FROM)) add(match[1], match.index);
	for (const match of file.text.matchAll(DOCKER_COPY_FROM)) add(match[1], match.index);
	if (COMPOSE_FILE.test(file.path)) {
		for (const match of file.text.matchAll(COMPOSE_IMAGE)) add(match[1], match.index);
	}
	return edges;
}

/** Container images can also be pulled from a shell script or a workflow. */
function extractImageReferences(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	for (const match of file.text.matchAll(GHCR_IMAGE)) {
		const name = imageName(match[0]);
		const target = context.config.images[name];
		if (!target) continue;
		edges.push({
			from: file.repo,
			to: target,
			kind: 'docker',
			detail: name,
			path: file.path,
			line: lineAt(file.text, match.index),
		});
	}
	return edges;
}

/** Puts the organisation name into a pattern that was written with an ORG placeholder. */
function withOrg(pattern: RegExp, org: string): RegExp {
	return new RegExp(
		pattern.source.replace('ORG', org.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
		'g',
	);
}

const WORKFLOW_USES = /uses:\s*["']?([A-Za-z0-9_.-]+\/[^\s"']+)/g;
const WORKFLOW_REPOSITORY = /repository:\s*["']?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/g;
/** One repository starting another's workflow run: `…/repos/ORG/NAME/actions/…`. */
const WORKFLOW_DISPATCH = /api\.github\.com\/repos\/ORG\/([A-Za-z0-9_.-]+)\/actions\/\S*/g;

/** Reusable workflows, custom actions, cross-repository checkouts and dispatches. */
function extractWorkflow(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	const org = `${context.config.org}/`;

	const add = (reference: string, index: number): void => {
		if (!reference.startsWith(org)) return;
		const target = reference.slice(org.length).split(/[/@]/)[0];
		edges.push({
			from: file.repo,
			to: target,
			kind: 'workflow',
			detail: reference,
			path: file.path,
			line: lineAt(file.text, index),
		});
	};

	for (const match of file.text.matchAll(WORKFLOW_USES)) add(match[1], match.index);
	for (const match of file.text.matchAll(WORKFLOW_REPOSITORY)) add(match[1], match.index);
	return edges;
}

/** A release in one repository that kicks off a build in another. */
function extractDispatches(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	for (const match of file.text.matchAll(withOrg(WORKFLOW_DISPATCH, context.config.org))) {
		edges.push({
			from: file.repo,
			to: match[1],
			kind: 'workflow',
			detail: match[0].replace(/^https?:\/\//, ''),
			path: file.path,
			line: lineAt(file.text, match.index),
		});
	}
	return edges;
}

/**
 * URLs that actually fetch something. A bare link to a repository is not a
 * dependency — a release asset, a raw file, an API call or a clone is.
 */
const DOWNLOAD_PATTERNS: RegExp[] = [
	/github\.com\/ORG\/([A-Za-z0-9_.-]+?)(?:\.git)?\/(?:releases|archive|raw|blob|tarball|zipball)\b/g,
	/github\.com\/ORG\/([A-Za-z0-9_.-]+)\.git\b/g,
	/raw\.githubusercontent\.com\/ORG\/([A-Za-z0-9_.-]+)\//g,
	// The first lookahead forbids a partial repository name, so that the second
	// one really does exclude workflow dispatches rather than truncating them.
	/api\.github\.com\/repos\/ORG\/([A-Za-z0-9_.-]+)(?![A-Za-z0-9_.-])(?!\/actions)/g,
];

/** `githubSource('versatiles-org/versatiles-fonts', …)` and similar. */
const QUOTED_SLUG = /["'`]ORG\/([A-Za-z0-9_.-]+)["'`]/g;

function extractDownloads(file: RepoFile, context: Context): Edge[] {
	const edges: Edge[] = [];
	const patterns = [...DOWNLOAD_PATTERNS];
	if (file.role === 'source') patterns.push(QUOTED_SLUG);

	for (const pattern of patterns) {
		for (const match of file.text.matchAll(withOrg(pattern, context.config.org))) {
			edges.push({
				from: file.repo,
				to: match[1],
				kind: 'download',
				detail: match[0],
				path: file.path,
				line: lineAt(file.text, match.index),
			});
		}
	}
	return edges;
}

function manualEdges(config: GraphConfig): Edge[] {
	return config.manual.map((edge) => ({
		from: edge.from,
		to: edge.to,
		kind: edge.kind,
		detail: edge.note,
		path: '',
		line: 0,
	}));
}

export interface CollectResult {
	edges: Edge[];
	warnings: string[];
	/** Edges dropped by an ignore rule, per rule, so stale rules can be reported. */
	ignoreHits: Map<number, number>;
}

/**
 * Runs every extractor over every file and returns the edges that survive
 * validation: no self-references, no unknown repositories, no ignored pairs.
 */
export function collectEdges(
	files: RepoFile[],
	config: GraphConfig,
	maps: NameMaps,
	repos: Set<string>,
	extraWarnings: string[],
): CollectResult {
	const context: Context = { config, maps, warnings: [...extraWarnings] };
	const found: Edge[] = manualEdges(config);

	for (const file of files) {
		switch (file.role) {
			case 'package':
				found.push(...extractNpm(file, context));
				break;
			case 'cargo':
				found.push(...extractCargo(file, context), ...extractDownloads(file, context));
				break;
			case 'docker':
				found.push(...extractDocker(file, context), ...extractDownloads(file, context));
				break;
			case 'workflow':
				found.push(
					...extractWorkflow(file, context),
					...extractDispatches(file, context),
					...extractImageReferences(file, context),
					...extractDownloads(file, context),
				);
				break;
			case 'source':
				found.push(
					...extractDispatches(file, context),
					...extractImageReferences(file, context),
					...extractDownloads(file, context),
				);
				break;
		}
	}

	const ignoreHits = new Map<number, number>();
	const isIgnored = (edge: Edge): boolean => {
		const index = config.ignore.findIndex(
			(rule) =>
				rule.from === edge.from &&
				rule.to === edge.to &&
				(rule.kind === undefined || rule.kind === edge.kind),
		);
		if (index === -1) return false;
		ignoreHits.set(index, (ignoreHits.get(index) ?? 0) + 1);
		return true;
	};

	const unknown = new Map<string, string>();
	const seen = new Set<string>();
	const edges: Edge[] = [];

	for (const edge of found) {
		if (edge.from === edge.to) continue;
		if (!repos.has(edge.to)) {
			// Renamed, deleted or private repositories, and false positives such
			// as an unexpanded shell variable, all end up here. A hand-declared
			// edge is different: someone meant it, so say why it disappeared.
			if (edge.kind === 'manual') {
				context.warnings.push(
					`manual edge ${edge.from} → ${edge.to} was dropped: ${edge.to} is not part of the graph`,
				);
			} else if (!unknown.has(edge.to)) {
				unknown.set(edge.to, `${edge.from}/${edge.path}:${edge.line}`);
			}
			continue;
		}
		if (!repos.has(edge.from) || isIgnored(edge)) continue;

		// One evidence row per file. Package and crate names are kept apart,
		// because a manifest can legitimately pull several of them from the same
		// repository; a script that mentions the same URL in four spellings is
		// still a single finding.
		const named = edge.kind === 'npm' || edge.kind === 'cargo';
		const key = [edge.from, edge.to, edge.kind, named ? edge.detail : '', edge.path].join(' ');
		if (seen.has(key)) continue;
		seen.add(key);
		edges.push(edge);
	}

	for (const [name, where] of [...unknown].sort()) {
		context.warnings.push(`dropped reference to unknown repository "${name}" (${where})`);
	}

	return { edges, warnings: context.warnings, ignoreHits };
}
