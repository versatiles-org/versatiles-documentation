/**
 * Minimal GitHub reader for scripts/build-dependency-graph.ts.
 *
 * The graph is built from the organisation's public repositories rather than
 * from local clones, so it describes what is actually published — not what
 * happens to be checked out on somebody's laptop.
 *
 * One request per repository lists its files (`/repos/…/git/trees`); the
 * handful of files that can carry a dependency are then read from
 * raw.githubusercontent.com, which does not count against the API rate limit.
 */

import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';

/** Anything larger is data or a bundle, never a dependency manifest. */
const MAX_BLOB_BYTES = 512 * 1024;

/** Parallel requests: high enough to be quick, low enough to stay polite. */
const CONCURRENCY = 12;

/**
 * Caps requests in flight across the whole run. mapLimit is used at two levels
 * — repositories, and the files inside one — so without a shared gate the two
 * limits would multiply.
 */
class Gate {
	private active = 0;
	private readonly waiting: (() => void)[] = [];

	constructor(private readonly limit: number) {}

	async run<T>(task: () => Promise<T>): Promise<T> {
		if (this.active >= this.limit) await new Promise<void>((go) => this.waiting.push(go));
		this.active++;
		try {
			return await task();
		} finally {
			this.active--;
			this.waiting.shift()?.();
		}
	}
}

export interface RepoInfo {
	name: string;
	description: string | null;
	language: string | null;
	archived: boolean;
	fork: boolean;
	defaultBranch: string;
}

export interface RepoEntry {
	path: string;
	size: number;
}

/** Runs `worker` over `items`, at most CONCURRENCY at a time, preserving order. */
export async function mapLimit<T, R>(
	items: readonly T[],
	worker: (item: T) => Promise<R>,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;
	const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
		while (next < items.length) {
			const index = next++;
			results[index] = await worker(items[index]);
		}
	});
	await Promise.all(runners);
	return results;
}

/**
 * A token is not strictly required, but 60 unauthenticated requests per hour
 * are not enough for an organisation this size. Falling back to `gh auth token`
 * keeps local runs working without anyone having to export anything.
 */
function resolveToken(): string | undefined {
	const fromEnv = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
	if (fromEnv) return fromEnv;
	try {
		const token = execFileSync('gh', ['auth', 'token'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		return token || undefined;
	} catch {
		return undefined;
	}
}

/** Marker stored in the cache for a 404, so misses are not retried. */
const CACHED_404 = ' 404';

export class GitHub {
	private readonly headers: Record<string, string>;
	/** Set only with --cache: a developer convenience, never used by CI. */
	private readonly cacheDir: string | null;
	private readonly gate = new Gate(CONCURRENCY);
	private requests = 0;

	constructor(options: { cache: boolean }) {
		const token = resolveToken();
		if (!token) {
			console.warn(
				'[dependency-graph] no GitHub token found — expect rate limiting.\n' +
					'                  Set GITHUB_TOKEN or run `gh auth login`.',
			);
		}
		this.headers = {
			accept: 'application/vnd.github+json',
			'user-agent': 'versatiles-documentation/dependency-graph',
			...(token ? { authorization: `Bearer ${token}` } : {}),
		};
		this.cacheDir = options.cache
			? resolve(__dirname, '../../node_modules/.cache/dependency-graph')
			: null;
	}

	get requestCount(): number {
		return this.requests;
	}

	private cachePath(url: string): string | null {
		if (!this.cacheDir) return null;
		mkdirSync(this.cacheDir, { recursive: true });
		return resolve(this.cacheDir, createHash('sha256').update(url).digest('hex'));
	}

	/** Returns the response body, or null for 404. Retries transient failures. */
	private async get(url: string): Promise<string | null> {
		const cached = this.cachePath(url);
		if (cached && existsSync(cached)) {
			const body = readFileSync(cached, 'utf8');
			return body === CACHED_404 ? null : body;
		}

		let lastError = '';
		for (let attempt = 0; attempt < 4; attempt++) {
			if (attempt > 0) await new Promise((done) => setTimeout(done, 500 * 2 ** attempt));
			this.requests++;

			let response: Response;
			try {
				response = await this.gate.run(() => fetch(url, { headers: this.headers }));
			} catch (error) {
				lastError = error instanceof Error ? error.message : String(error);
				continue;
			}

			if (response.status === 404) {
				if (cached) writeFileSync(cached, CACHED_404);
				return null;
			}
			if (response.ok) {
				const body = await response.text();
				if (cached) writeFileSync(cached, body);
				return body;
			}

			// 403 and 429 with an exhausted budget are rate limiting rather than a
			// permission problem, so they are worth another attempt after a pause.
			lastError = `${response.status} ${response.statusText}`;
			const retryable =
				response.status >= 500 || response.status === 403 || response.status === 429;
			if (!retryable) break;
		}
		throw new Error(`${lastError} for ${url}`);
	}

	private async getJson<T>(url: string): Promise<T | null> {
		const body = await this.get(url);
		return body === null ? null : (JSON.parse(body) as T);
	}

	/** Public repositories of `org`, sorted by name. */
	async listRepos(org: string): Promise<RepoInfo[]> {
		interface ApiRepo {
			name: string;
			description: string | null;
			language: string | null;
			archived: boolean;
			fork: boolean;
			default_branch: string;
		}

		const repos: RepoInfo[] = [];
		for (let page = 1; ; page++) {
			const url = `${API}/orgs/${org}/repos?type=public&per_page=100&page=${page}`;
			const batch = await this.getJson<ApiRepo[]>(url);
			if (!batch?.length) break;
			for (const repo of batch) {
				repos.push({
					name: repo.name,
					description: repo.description,
					language: repo.language,
					archived: repo.archived,
					fork: repo.fork,
					defaultBranch: repo.default_branch,
				});
			}
			if (batch.length < 100) break;
		}
		return repos.sort((a, b) => a.name.localeCompare(b.name));
	}

	/** Every blob on the repository's default branch, with its size. */
	async listEntries(org: string, repo: RepoInfo): Promise<RepoEntry[]> {
		const url = `${API}/repos/${org}/${repo.name}/git/trees/${repo.defaultBranch}?recursive=1`;
		const tree = await this.getJson<{
			truncated?: boolean;
			tree?: { path: string; type: string; size?: number }[];
		}>(url);
		if (!tree?.tree) return [];
		if (tree.truncated) {
			console.warn(`[dependency-graph] ${repo.name}: file listing truncated by GitHub`);
		}
		return tree.tree
			.filter((entry) => entry.type === 'blob' && (entry.size ?? 0) <= MAX_BLOB_BYTES)
			.map((entry) => ({ path: entry.path, size: entry.size ?? 0 }));
	}

	async readFile(org: string, repo: RepoInfo, path: string): Promise<string | null> {
		return this.get(`${RAW}/${org}/${repo.name}/${repo.defaultBranch}/${path}`);
	}
}
