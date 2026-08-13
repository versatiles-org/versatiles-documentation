import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
	{
		ignores: ['.vitepress/dist/**', '.vitepress/cache/**', 'node_modules/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	...pluginVue.configs['flat/recommended'],
	{
		// Type-aware rules: the project service resolves each file through tsconfig.json,
		// which is why .vue files have to be listed in its "include".
		files: ['**/*.ts', '**/*.mts', '**/*.vue'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.vue'],
			},
		},
	},
	{
		// Plain JS config files have no type information to lint against.
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		...tseslint.configs.disableTypeChecked,
	},
	{
		files: ['**/*.vue'],
		languageOptions: {
			// Components run in the browser: URL, document, ResizeObserver, rAF …
			globals: globals.browser,
			parserOptions: {
				parser: tseslint.parser,
			},
		},
	},
	{
		rules: {
			'vue/multi-word-component-names': 'off',
		},
	},
	prettier,
);
