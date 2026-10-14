import { describe, expect, it } from 'vitest';
import { Progress, type ProgressStream } from './progress';

function fakeStream(isTTY: boolean, columns = 200): ProgressStream & { output: string[] } {
	const output: string[] = [];
	return { isTTY, columns, output, write: (text: string) => output.push(text) };
}

describe('Progress', () => {
	it('counts each unit and fills the bar with the overall share', () => {
		const progress = new Progress('scanning', fakeStream(false));
		progress.add('repositories', 2);
		progress.add('files', 2);
		progress.tick('repositories');
		progress.tick('files');
		expect(progress.line()).toBe(
			`[dependency-graph] scanning ${'█'.repeat(12)}${'░'.repeat(12)} 1/2 repositories · 1/2 files`,
		);
	});

	it('draws an empty bar before anything is announced', () => {
		expect(new Progress('scanning', fakeStream(false)).line()).toBe(
			`[dependency-graph] scanning ${'░'.repeat(24)} `,
		);
	});

	it('stays silent when the stream is not a terminal', async () => {
		const stream = fakeStream(false);
		const progress = new Progress('scanning', stream);
		progress.add('files', 1);
		await progress.track('files', () => Promise.resolve(1));
		progress.finish();
		expect(stream.output).toEqual([]);
	});

	it('redraws on a terminal, throttled, cut to its width, and clears the line at the end', () => {
		const stream = fakeStream(true, 30);
		let time = 1000;
		const progress = new Progress('scanning', stream, () => time);
		progress.add('files', 2);
		progress.tick('files'); // within the interval: skipped
		time += 100;
		progress.tick('files');
		progress.finish();
		expect(stream.output).toHaveLength(3);
		expect(stream.output[0]).toBe('\r\x1b[2K[dependency-graph] scanning ░');
		expect(stream.output[2]).toBe('\r\x1b[2K');
	});

	it('counts a task as finished even when it throws', async () => {
		const progress = new Progress('scanning', fakeStream(false));
		progress.add('files', 1);
		await expect(
			progress.track('files', () => Promise.reject(new Error('boom'))),
		).rejects.toThrow('boom');
		expect(progress.line()).toContain('1/1 files');
	});
});
