import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
	{
		ignores: ['.vitepress/dist/**', '.vitepress/cache/**', 'node_modules/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...pluginVue.configs['flat/recommended'],
	{
		files: ['**/*.vue'],
		languageOptions: {
			globals: {
				URL: 'readonly',
			},
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
