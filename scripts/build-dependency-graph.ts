/**
 * Builds the "Repository dependencies" compendium page.
 *
 * The VersaTiles repositories depend on each other in half a dozen different
 * ways — npm packages, Rust crates, Docker base images, release assets pulled
 * by install scripts, reusable CI workflows — and each of those is declared in
 * a different file format. This script reads all of them from GitHub and turns
 * them into one diagram, so the shape of the project can be seen rather than
 * reconstructed.
 *
 * The generated files are committed. A build therefore needs no network access,
 * and a change somewhere in the organisation arrives as a reviewable diff
 * instead of a silent deploy.
 *
 *   npm run sync:deps              # regenerate the page
 *   npm run sync:deps -- --check   # fail if it is out of date
 *   npm run sync:deps -- --cache   # reuse responses from the last run
 *
 * A GitHub token is read from GITHUB_TOKEN, GH_TOKEN or `gh auth token`.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as prettier from 'prettier';
import { loadConfig, validateConfig, CONFIG_PATH } from './dependency-graph/config';
import { GitHub, mapLimit, type RepoInfo } from './dependency-graph/github';
import { buildNameMaps, classify, collectEdges, type RepoFile } from './dependency-graph/collect';
import { renderJson, renderPage } from './dependency-graph/render';
import { sortEdges, type Graph, type RepoNode } from './dependency-graph/model';

const ROOT = resolve(__dirname, '..');
const TARGET_PAGE = 'compendium/dependency_graph.md';
const TARGET_DATA = 'public/dependency-graph.json';

/** Repositories that fit no configured group still have to go somewhere. */
const FALLBACK_GROUP = {
	id: 'uncategorised',
	title: 'Not yet categorised',
	summary: 'Added to the organisation since this page was last curated.',
};

interface Options {
	check: boolean;
	cache: boolean;
}

function parseArgs(argv: string[]): Options {
	const unknown = argv.filter((arg) => !['--check', '--cache'].includes(arg));
	if (unknown.length > 0) throw new Error(`unknown option(s): ${unknown.join(', ')}`);
	return { check: argv.includes('--check'), cache: argv.includes('--cache') };
}

/** Reads every file of a repository that could declare a dependency. */
async function readRepo(github: GitHub, org: string, repo: RepoInfo): Promise<RepoFile[]> {
	const entries = await github.listEntries(org, repo);
	const wanted = entries
		.map((entry) => ({ path: entry.path, role: classify(entry.path) }))
		.filter((entry): entry is { path: string; role: NonNullable<typeof entry.role> } =>
			Boolean(entry.role),
		);

	const files = await mapLimit(wanted, async ({ path, role }) => {
		const text = await github.readFile(org, repo, path);
		return text === null ? null : { repo: repo.name, path, role, text };
	});
	return files.filter((file): file is RepoFile => file !== null);
}

async function main(): Promise<void> {
	const { check, cache } = parseArgs(process.argv.slice(2));
	const config = loadConfig(ROOT);
	const github = new GitHub({ cache });

	const allRepos = await github.listRepos(config.org);
	const problems = validateConfig(config, new Set(allRepos.map((repo) => repo.name)));
	if (problems.length > 0) {
		throw new Error(`${problems.length} configuration problem(s):\n  ${problems.join('\n  ')}`);
	}

	// Decide what the graph covers before spending any requests on it.
	const skipped: { name: string; reason: string }[] = [];
	const repos = allRepos.filter((repo) => {
		if (config.exclude.includes(repo.name)) {
			skipped.push({ name: repo.name, reason: 'excluded in the configuration' });
			return false;
		}
		if (repo.archived && !config.includeArchived) {
			skipped.push({ name: repo.name, reason: 'archived' });
			return false;
		}
		if (repo.fork && !config.includeForks) {
			skipped.push({ name: repo.name, reason: 'a fork of an upstream project' });
			return false;
		}
		return true;
	});

	console.log(`[dependency-graph] reading ${repos.length} repositories of ${config.org} …`);
	const files = (await mapLimit(repos, (repo) => readRepo(github, config.org, repo))).flat();
	console.log(
		`[dependency-graph] scanned ${files.length} files in ${github.requestCount} requests`,
	);

	const { maps, warnings: mapWarnings } = buildNameMaps(files);
	const names = new Set(repos.map((repo) => repo.name));
	const { edges, warnings, ignoreHits } = collectEdges(files, config, maps, names, mapWarnings);

	config.ignore.forEach((rule, index) => {
		if (!ignoreHits.has(index)) {
			warnings.push(`ignore rule ${rule.from} → ${rule.to} matched nothing and can be removed`);
		}
	});

	const groupOf = new Map<string, string>();
	for (const group of config.groups) {
		for (const repo of group.repos) groupOf.set(repo, group.id);
	}
	const uncategorised = repos.filter((repo) => !groupOf.has(repo.name)).map((repo) => repo.name);
	if (uncategorised.length > 0) {
		warnings.push(
			`not listed under "groups:" in ${CONFIG_PATH}: ${uncategorised.sort().join(', ')}`,
		);
	}

	const nodes: RepoNode[] = repos.map((repo) => ({
		name: repo.name,
		group: groupOf.get(repo.name) ?? FALLBACK_GROUP.id,
		description: repo.description,
		language: repo.language,
		fork: repo.fork,
		archived: repo.archived,
	}));

	const graph: Graph = {
		org: config.org,
		groups: [
			...config.groups.map((group) => ({
				id: group.id,
				title: group.title,
				summary: group.summary,
			})),
			...(uncategorised.length > 0 ? [FALLBACK_GROUP] : []),
		],
		repos: nodes,
		edges: sortEdges(edges),
	};

	const page = renderPage({
		graph,
		branches: new Map(repos.map((repo) => [repo.name, repo.defaultBranch])),
		skipped,
	});

	// Both outputs go through prettier, so that `npm run format` finds nothing
	// left to change and --check cannot fail on formatting alone. The config has
	// per-extension overrides, so it has to be resolved for each file separately.
	const format = async (
		path: string,
		content: string,
	): Promise<{ path: string; content: string }> => {
		const absolute = resolve(ROOT, path);
		const options = await prettier.resolveConfig(absolute);
		return { path, content: await prettier.format(content, { ...options, filepath: absolute }) };
	};
	const targets = [await format(TARGET_PAGE, page), await format(TARGET_DATA, renderJson(graph))];

	for (const warning of warnings) console.warn(`[dependency-graph] ${warning}`);

	const stale = targets.filter(({ path, content }) => {
		const absolute = resolve(ROOT, path);
		return !existsSync(absolute) || readFileSync(absolute, 'utf8') !== content;
	});

	if (check) {
		if (stale.length === 0) {
			console.log('[dependency-graph] page is up to date');
			return;
		}
		console.error('The dependency graph no longer matches the repositories:');
		for (const { path } of stale) console.error(`  ${path}`);
		console.error('Run `npm run sync:deps` and commit the result.');
		process.exit(1);
	}

	for (const { path, content } of targets) writeFileSync(resolve(ROOT, path), content);
	console.log(
		`[dependency-graph] ${graph.repos.length} repositories, ${graph.edges.length} dependencies` +
			(stale.length === 0 ? ' (unchanged)' : `, updated ${stale.length} file(s)`),
	);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
