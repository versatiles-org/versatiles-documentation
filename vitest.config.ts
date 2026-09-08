import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		silent: true,
		include: ['scripts/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			// text for the console, lcov for codecov, json-summary for a quick look.
			reporter: ['text', 'lcov', 'json-summary'],
			reportsDirectory: 'coverage',
			include: ['scripts/**/*.ts'],
			exclude: [
				'scripts/**/*.test.ts',
				/*
				 * Command line entry points: each one runs its work at import time,
				 * so a test that imported it would start fetching from GitHub or
				 * writing files. What they orchestrate is covered through the
				 * modules underneath them.
				 */
				'scripts/build-dependency-graph.ts',
				'scripts/build-showcase-images.ts',
				'scripts/build-social-image.ts',
				'scripts/sync-spec.ts',
				'scripts/validate-showcases.ts',
			],
		},
	},
});
