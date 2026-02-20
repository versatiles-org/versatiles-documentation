import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

export interface Showcase {
	title: string;
	url: string;
	source: string;
	country: string;
	description: string;
	thumbnail?: string;
	tags: string[];
}

export interface ShowcasesData {
	showcases: Showcase[];
	countries: string[];
	tags: string[];
}

export default {
	watch: ['./showcases.yaml'],
	load(): ShowcasesData {
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const raw = readFileSync(resolve(__dirname, 'showcases.yaml'), 'utf-8');
		const showcases = yaml.load(raw) as Showcase[];

		const countries = [...new Set(showcases.map((s) => s.country))].sort();
		const tags = [...new Set(showcases.flatMap((s) => s.tags))].sort();

		return { showcases, countries, tags };
	},
};
