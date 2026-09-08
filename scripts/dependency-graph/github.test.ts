import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHub, mapLimit, type RepoInfo } from './github';

/** A token from the environment keeps the constructor away from the `gh` binary. */
function client(): GitHub {
	vi.stubEnv('GITHUB_TOKEN', 'test-token');
	return new GitHub({ cache: false });
}

function reply(body: unknown, status = 200): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: String(status),
		text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
	} as Response;
}

const repo = (name: string, overrides: Partial<RepoInfo> = {}): RepoInfo => ({
	name,
	description: null,
	language: null,
	archived: false,
	fork: false,
	defaultBranch: 'main',
	...overrides,
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe('mapLimit', () => {
	it('keeps results in the order of the input, not of completion', async () => {
		const result = await mapLimit([30, 10, 20], async (delay) => {
			await new Promise((done) => setTimeout(done, delay));
			return delay;
		});
		expect(result).toEqual([30, 10, 20]);
	});

	it('never runs more than a dozen at once', async () => {
		let running = 0;
		let peak = 0;
		await mapLimit(
			Array.from({ length: 40 }, (_, i) => i),
			async () => {
				running++;
				peak = Math.max(peak, running);
				await new Promise((done) => setTimeout(done, 1));
				running--;
				return null;
			},
		);
		expect(peak).toBeLessThanOrEqual(12);
		expect(peak).toBeGreaterThan(1);
	});

	it('copes with nothing to do', async () => {
		expect(await mapLimit([], () => Promise.resolve(null))).toEqual([]);
	});
});

describe('listRepos', () => {
	it('follows pagination until a short page arrives', async () => {
		const page = (count: number, from: number): unknown[] =>
			Array.from({ length: count }, (_, i) => ({
				name: `repo-${String(from + i).padStart(3, '0')}`,
				description: null,
				language: null,
				archived: false,
				fork: false,
				default_branch: 'main',
			}));
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(reply(page(100, 0)))
			.mockResolvedValueOnce(reply(page(7, 100)));
		vi.stubGlobal('fetch', fetchMock);

		const repos = await client().listRepos('versatiles-org');
		expect(repos).toHaveLength(107);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(String(fetchMock.mock.calls[1][0])).toContain('page=2');
	});

	it('asks only for public repositories, and sorts what comes back', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			reply([
				{ name: 'zebra', default_branch: 'main', archived: false, fork: false },
				{ name: 'alpha', default_branch: 'trunk', archived: true, fork: true },
			]),
		);
		vi.stubGlobal('fetch', fetchMock);

		const repos = await client().listRepos('versatiles-org');
		expect(String(fetchMock.mock.calls[0][0])).toContain('type=public');
		expect(repos.map((r) => r.name)).toEqual(['alpha', 'zebra']);
		// The API spells it default_branch; everything downstream expects camelCase.
		expect(repos[0]).toMatchObject({ defaultBranch: 'trunk', archived: true, fork: true });
	});
});

describe('listEntries', () => {
	it('returns only blobs, and leaves out anything too big to be a manifest', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				reply({
					tree: [
						{ path: 'package.json', type: 'blob', size: 400 },
						{ path: 'src', type: 'tree' },
						{ path: 'data/planet.pmtiles', type: 'blob', size: 900 * 1024 },
						{ path: 'no-size', type: 'blob' },
					],
				}),
			),
		);
		const entries = await client().listEntries('versatiles-org', repo('versatiles-rs'));
		expect(entries.map((entry) => entry.path)).toEqual(['package.json', 'no-size']);
	});

	it('says so when GitHub truncates the listing', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({ truncated: true, tree: [] })));
		await client().listEntries('versatiles-org', repo('huge'));
		expect(warn.mock.calls.flat().join(' ')).toContain('truncated');
		warn.mockRestore();
	});

	it('treats a repository with no tree as empty rather than failing', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply({}, 404)));
		expect(await client().listEntries('versatiles-org', repo('empty'))).toEqual([]);
	});
});

describe('readFile', () => {
	it('reads from raw.githubusercontent, which the API rate limit does not cover', async () => {
		const fetchMock = vi.fn().mockResolvedValue(reply('name = "versatiles"'));
		vi.stubGlobal('fetch', fetchMock);

		const text = await client().readFile('versatiles-org', repo('versatiles-rs'), 'Cargo.toml');
		expect(text).toBe('name = "versatiles"');
		expect(String(fetchMock.mock.calls[0][0])).toBe(
			'https://raw.githubusercontent.com/versatiles-org/versatiles-rs/main/Cargo.toml',
		);
	});

	it('returns nothing for a file that is not there', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply('', 404)));
		expect(await client().readFile('versatiles-org', repo('x'), 'gone.json')).toBe(null);
	});
});

describe('when GitHub misbehaves', () => {
	it('retries a server error and counts both attempts', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(reply('', 502))
			.mockResolvedValueOnce(reply('recovered'));
		vi.stubGlobal('fetch', fetchMock);

		const github = client();
		expect(await github.readFile('versatiles-org', repo('x'), 'a.txt')).toBe('recovered');
		expect(github.requestCount).toBe(2);
	});

	it('gives up at once on an error that retrying cannot fix', async () => {
		const fetchMock = vi.fn().mockResolvedValue(reply('', 401));
		vi.stubGlobal('fetch', fetchMock);

		await expect(client().readFile('versatiles-org', repo('x'), 'a.txt')).rejects.toThrow(/401/);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('names the URL it failed on', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply('', 400)));
		await expect(client().readFile('versatiles-org', repo('x'), 'a.txt')).rejects.toThrow(
			/raw\.githubusercontent\.com/,
		);
	});
});
