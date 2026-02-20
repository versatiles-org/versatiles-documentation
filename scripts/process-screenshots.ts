import { readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import yaml from 'js-yaml';

interface Showcase {
	title: string;
	thumbnail?: string;
}

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SHOWCASES_DIR = resolve(ROOT, 'showcases');
const OUTPUT_DIR = resolve(ROOT, 'public/showcases');
const YAML_PATH = resolve(ROOT, 'showcases/showcases.yaml');

const WIDTH = 800;
const HEIGHT = 450;
const WEBP_QUALITY = 80;

async function main() {
	// Parse YAML
	const showcases = yaml.load(readFileSync(YAML_PATH, 'utf-8')) as Showcase[];
	const yamlSlugs = new Set(showcases.filter((s) => s.thumbnail).map((s) => s.thumbnail!));

	// Collect PNG slugs
	const pngFiles = existsSync(SHOWCASES_DIR)
		? readdirSync(SHOWCASES_DIR).filter((f) => f.endsWith('.png'))
		: [];
	const pngSlugs = new Set(pngFiles.map((f) => basename(f, '.png')));

	let hasError = false;

	// Warn: unused PNG files (PNG exists but no YAML entry references it)
	for (const slug of pngSlugs) {
		if (!yamlSlugs.has(slug)) {
			console.warn(
				`⚠ Unused PNG: compendium/showcases/${slug}.png (no YAML entry with thumbnail: ${slug})`,
			);
		}
	}

	// Error: missing PNG files (YAML references a thumbnail but no PNG exists)
	for (const slug of yamlSlugs) {
		if (!pngSlugs.has(slug)) {
			console.error(`✗ Missing PNG: compendium/showcases/${slug}.png (referenced in YAML)`);
			hasError = true;
		}
	}

	// Warn: entries without screenshot
	for (const s of showcases) {
		if (!s.thumbnail) {
			console.warn(`⚠ No thumbnail: "${s.title}"`);
		}
	}

	if (hasError) {
		process.exit(1);
	}

	// Process images
	if (pngSlugs.size === 0) {
		console.log('No screenshots to process.');
		return;
	}

	mkdirSync(OUTPUT_DIR, { recursive: true });

	const toProcess = pngFiles.filter((f) => yamlSlugs.has(basename(f, '.png')));

	await Promise.all(
		toProcess.map(async (file) => {
			const slug = basename(file, '.png');
			const input = resolve(SHOWCASES_DIR, file);
			const output = resolve(OUTPUT_DIR, `${slug}.webp`);
			await sharp(input)
				.resize(WIDTH, HEIGHT, { fit: 'cover' })
				.webp({ quality: WEBP_QUALITY, effort: 6 })
				.toFile(output);
			console.log(`✓ ${slug}.webp`);
		}),
	);

	console.log(`Processed ${toProcess.length} screenshot(s).`);
}

main();
