/** Module shims for the non-TS assets the theme imports; Vite resolves these at build time. */

declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent;
	export default component;
}

declare module '*.css';

/**
 * Ships no types and has no @types package; used as a markdown-it plugin in config.mts.
 * The parameter is `unknown` on purpose: VitePress bundles its own markdown-it types,
 * which drift from @types/markdown-it, so referencing either one breaks `md.use()`.
 */
declare module 'markdown-it-task-lists' {
	const taskLists: (md: unknown, options?: unknown) => void;
	export default taskLists;
}
