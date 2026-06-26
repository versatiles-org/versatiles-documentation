import { readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import yaml from 'js-yaml';

interface Showcase {
	title: string;
	image?: string;
}

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SHOWCASES_DIR = resolve(ROOT, 'showcases');
const OUTPUT_DIR = resolve(ROOT, 'public/showcases');
const YAML_PATH = resolve(ROOT, 'showcases/showcases.yaml');

const WIDTH = 800;
const HEIGHT = 450;
const WEBP_QUALITY = 80;
const IMAGE_EXTS = /\.(png|jpe?g|webp)$/i;

async function main() {
	// Parse YAML
	const showcases = yaml.load(readFileSync(YAML_PATH, 'utf-8')) as Showcase[];
	const yamlSlugs = new Set(
		showcases.filter((s) => s.image).map((s) => s.image!.replace(IMAGE_EXTS, '')),
	);

	// Collect image slugs from source directory
	const imageFiles = existsSync(SHOWCASES_DIR)
		? readdirSync(SHOWCASES_DIR).filter((f) => IMAGE_EXTS.test(f))
		: [];
	const imageSlugs = new Set(imageFiles.map((f) => f.replace(IMAGE_EXTS, '')));

	let hasError = false;

	// Warn: unused image files (file exists but no YAML entry references it)
	for (const slug of imageSlugs) {
		if (!yamlSlugs.has(slug)) {
			console.warn(`⚠ Unused image: showcases/${slug}.* (no YAML entry with image: ${slug}.*)`);
		}
	}

	// Error: missing image files (YAML references an image but no file exists)
	for (const slug of yamlSlugs) {
		if (!imageSlugs.has(slug)) {
			console.error(`✗ Missing image: showcases/${slug}.* (referenced in YAML)`);
			hasError = true;
		}
	}

	// Warn: entries without screenshot
	for (const s of showcases) {
		if (!s.image) {
			console.warn(`⚠ No image: "${s.title}"`);
		}
	}

	if (hasError) {
		process.exit(1);
	}

	// Process images
	if (imageSlugs.size === 0) {
		console.log('No screenshots to process.');
		return;
	}

	mkdirSync(OUTPUT_DIR, { recursive: true });

	const toProcess = imageFiles.filter((f) => yamlSlugs.has(f.replace(IMAGE_EXTS, '')));

	await Promise.all(
		toProcess.map(async (file) => {
			const slug = file.replace(IMAGE_EXTS, '');
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
