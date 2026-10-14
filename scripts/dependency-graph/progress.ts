/**
 * A one-line progress bar for scripts/build-dependency-graph.ts.
 *
 * Scanning the organisation takes several hundred requests, and without any
 * feedback a slow run cannot be told apart from a stuck one. The bar is drawn
 * only on an interactive terminal; in CI and in pipes it stays silent, so logs
 * are not flooded with carriage returns.
 */

/** The part of a stream the bar needs, so tests can pass a fake one. */
export interface ProgressStream {
	isTTY?: boolean;
	columns?: number;
	write(text: string): unknown;
}

const BAR_WIDTH = 24;

/** Redraws closer together than this are skipped; the eye cannot follow them. */
const MIN_INTERVAL_MS = 50;

export class Progress {
	/** Insertion-ordered, so units appear in the order they were first added. */
	private readonly counters = new Map<string, { done: number; total: number }>();
	private readonly enabled: boolean;
	private lastDraw = 0;

	constructor(
		private readonly title: string,
		private readonly stream: ProgressStream = process.stderr,
		private readonly now: () => number = Date.now,
	) {
		this.enabled = Boolean(stream.isTTY);
	}

	/** Announces `count` more items of `unit` that will be worked on. */
	add(unit: string, count: number): void {
		this.counter(unit).total += count;
		this.draw();
	}

	/** Marks one item of `unit` as finished. */
	tick(unit: string): void {
		this.counter(unit).done++;
		this.draw();
	}

	/** Runs `task` as one item of `unit`, counting it as finished even if it throws. */
	async track<T>(unit: string, task: () => Promise<T>): Promise<T> {
		try {
			return await task();
		} finally {
			this.tick(unit);
		}
	}

	/** Removes the bar, leaving the line free for whatever is printed next. */
	finish(): void {
		if (this.enabled) this.stream.write('\r\x1b[2K');
	}

	/** The text of the bar, without any terminal control sequences. */
	line(): string {
		let done = 0;
		let total = 0;
		const parts: string[] = [];
		for (const [unit, counter] of this.counters) {
			done += counter.done;
			total += counter.total;
			parts.push(`${counter.done}/${counter.total} ${unit}`);
		}
		const filled = total === 0 ? 0 : Math.round((done / total) * BAR_WIDTH);
		const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
		return `[dependency-graph] ${this.title} ${bar} ${parts.join(' · ')}`;
	}

	private counter(unit: string): { done: number; total: number } {
		let counter = this.counters.get(unit);
		if (!counter) {
			counter = { done: 0, total: 0 };
			this.counters.set(unit, counter);
		}
		return counter;
	}

	private draw(): void {
		if (!this.enabled) return;
		const time = this.now();
		if (time - this.lastDraw < MIN_INTERVAL_MS) return;
		this.lastDraw = time;
		// Cut to the terminal width: a wrapped line cannot be overwritten with \r.
		const text = [...this.line()].slice(0, Math.max(0, (this.stream.columns || 80) - 1));
		this.stream.write(`\r\x1b[2K${text.join('')}`);
	}
}
