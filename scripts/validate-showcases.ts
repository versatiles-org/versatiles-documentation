import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';

interface Showcase {
	title: string;
	url: string;
	category: string;
	image: string;
	tags: string[];
}

const SHOWCASES_DIR = resolve(__dirname, '../showcases');
const IMAGE_EXTS = /\.(png|jpe?g|webp)$/i;

const raw = readFileSync(resolve(SHOWCASES_DIR, 'showcases.yaml'), 'utf-8');
const showcases = yaml.load(raw) as Showcase[];

let hasError = false;

/** Suggests a screenshot filename for an entry, e.g. "Montreux Noël" -> "montreux-noel.png" */
function suggestImageName(title: string): string {
	const slug = title
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return `${slug}.png`;
}

const missingImages = showcases.filter((s) => !s.image);
if (missingImages.length) {
	console.error(
		`[showcases] ${missingImages.length} entr${missingImages.length === 1 ? 'y is' : 'ies are'} missing an "image" field.`,
	);
	console.error('Screenshot each URL below, save it under showcases/ as the given file name,');
	console.error('then add "image: <file name>" to the entry.\n');
	for (const s of missingImages) {
		console.error(`  ${suggestImageName(s.title)}`);
		console.error(`    title: ${s.title}`);
		console.error(`    url:   ${s.url}\n`);
	}
	hasError = true;
}

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
	hasError = true;
}

if (hasError) {
	process.exit(1);
}

// Warnings below never fail validation: a missing screenshot only degrades the card.
const imageSlugs = new Set(
	(existsSync(SHOWCASES_DIR) ? readdirSync(SHOWCASES_DIR) : [])
		.filter((f) => IMAGE_EXTS.test(f))
		.map((f) => f.replace(IMAGE_EXTS, '')),
);
const yamlSlugs = new Set(showcases.map((s) => s.image.replace(IMAGE_EXTS, '')));

for (const slug of imageSlugs) {
	if (!yamlSlugs.has(slug)) {
		console.warn(`⚠ Unused image: showcases/${slug}.* (no YAML entry with image: ${slug}.*)`);
	}
}

const missingScreenshots = showcases.filter(
	(s) => !imageSlugs.has(s.image.replace(IMAGE_EXTS, '')),
);
for (const s of missingScreenshots) {
	console.warn(`⚠ Missing screenshot: showcases/${s.image}\n    capture ${s.url}`);
}
if (missingScreenshots.length) {
	console.warn(
		`⚠ ${missingScreenshots.length} screenshot(s) missing — those cards render without an image.`,
	);
}

console.log(`[showcases] ${showcases.length} entries valid`);
