import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

export interface Showcase {
	title: string;
	url: string;
	source: string;
	country: string;
	category: string;
	description: string;
	image?: string;
	slug?: string;
	tags: string[];
}

export interface ShowcasesData {
	showcases: Showcase[];
	countries: string[];
	categories: string[];
	tags: string[];
}

export default {
	watch: ['./showcases.yaml'],
	load(): ShowcasesData {
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const raw = readFileSync(resolve(__dirname, 'showcases.yaml'), 'utf-8');
		const showcases = yaml.load(raw) as Showcase[];

		showcases.forEach((s) => {
			if (s.image) {
				s.slug = s.image.replace(/\.(png|jpe?g|webp)$/i, '');
				s.image = `/showcases/${s.slug}.webp`;
			}
			if (!s.tags.includes(s.category)) s.tags = [s.category, ...s.tags];
		});

		showcases.sort((a, b) => a.source.localeCompare(b.source, 'en', { sensitivity: 'base' }));

		const countries = [...new Set(showcases.map((s) => s.country))].sort();
		const categories = [...new Set(showcases.map((s) => s.category))].sort();
		const tags = [...new Set(showcases.flatMap((s) => s.tags))].sort();

		return { showcases, countries, categories, tags };
	},
};
