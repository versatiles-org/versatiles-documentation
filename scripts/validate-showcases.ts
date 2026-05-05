import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';

interface Showcase {
	title: string;
	category: string;
	tags: string[];
}

const raw = readFileSync(resolve(__dirname, '../showcases/showcases.yaml'), 'utf-8');
const showcases = yaml.load(raw) as Showcase[];

const tagCounts = new Map<string, number>();
showcases.forEach((s) => {
	const merged = s.tags.includes(s.category) ? s.tags : [s.category, ...s.tags];
	merged.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
});

const singletons = [...tagCounts.entries()]
	.filter(([, n]) => n === 1)
	.map(([t]) => t)
	.sort();

if (singletons.length) {
	console.error(
		`[showcases] tags/categories used only once (possible typos): ${singletons.join(', ')}`,
	);
	process.exit(1);
}

console.log('[showcases] all tags/categories are used at least twice');
