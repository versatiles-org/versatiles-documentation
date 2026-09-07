// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import Showcases from './components/Showcases.vue';
import DependencyGraph from './components/DependencyGraph.vue';

export default {
	extends: DefaultTheme,
	Layout: () => {
		return h(DefaultTheme.Layout, null, {
			// https://vitepress.dev/guide/extending-default-theme#layout-slots
		});
	},
	enhanceApp({ app }) {
		app.component('Showcases', Showcases);
		app.component('DependencyGraph', DependencyGraph);
	},
} satisfies Theme;
