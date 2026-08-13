/** Module shims for the non-TS assets the theme imports; Vite resolves these at build time. */

declare module '*.vue' {
	import type { DefineComponent } from 'vue';
	const component: DefineComponent;
	export default component;
}

declare module '*.css';

/** Ships no types and has no @types package; used as a markdown-it plugin in config.mts. */
declare module 'markdown-it-task-lists';
