import { readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const THUMBS_DIR = resolve(ROOT, 'public/showcases');
const LOGO_PATH = resolve(ROOT, 'public/versatiles.svg');
const OUTPUT_PATH = resolve(ROOT, 'public/showcases-social.jpg');

const WIDTH = 1200;
const HEIGHT = 675;
const GAP = 1; // px between screenshots
const LOGO_HEIGHT = 300;
const BACKGROUND = '#1b1b1f';
const JPEG_QUALITY = 88; // ~175 kB; as PNG the same image is ~1.6 MB

/** Evenly spread `count` picks across `items`, deterministically. */
function sample<T>(items: T[], count: number): T[] {
	return Array.from({ length: count }, (_, i) => items[Math.floor((i * items.length) / count)]);
}

/**
 * Splits `total` pixels into `count` whole-pixel cells, separated by GAP.
 * The last cell absorbs the rounding remainder, so the cells fill `total`
 * exactly.
 */
function bands(total: number, count: number): { offset: number; size: number }[] {
	return Array.from({ length: count }, (_, i) => {
		const offset = Math.round((i * total) / count);
		const end = Math.round(((i + 1) * total) / count);
		return { offset, size: end - offset - (i < count - 1 ? GAP : 0) };
	});
}

/**
 * Builds the social media preview image for /showcases/: a wall of showcase
 * screenshots, dimmed towards the centre, with the VersaTiles logo in front.
 *
 * Runs after build:showcase-images, which produces the 800x450 thumbnails.
 */
async function main() {
	const thumbs = existsSync(THUMBS_DIR)
		? readdirSync(THUMBS_DIR)
				.filter((f) => f.endsWith('.webp'))
				.sort()
		: [];

	// Use the largest square number of screenshots we have, so the grid stays
	// even: 64 screenshots -> 8x8, 81 -> 9x9, ...
	const cols = Math.floor(Math.sqrt(thumbs.length));
	if (cols < 1) {
		console.warn('⚠ No showcase thumbnails found — skipping social image.');
		return;
	}
	const picked = sample(thumbs, cols * cols);

	// Cell offsets and sizes are rounded to whole pixels up front, so any GAP
	// works even when WIDTH/cols or HEIGHT/cols is fractional. The gap sits
	// between cells only, keeping the grid flush with the canvas edges.
	const columns = bands(WIDTH, cols);
	const rows = bands(HEIGHT, cols);

	const tiles = await Promise.all(
		picked.map(async (file, i) => {
			const column = columns[i % cols];
			const row = rows[Math.floor(i / cols)];
			return {
				input: await sharp(resolve(THUMBS_DIR, file))
					.resize(column.size, row.size, { fit: 'cover' })
					.toBuffer(),
				left: column.offset,
				top: row.offset,
			};
		}),
	);

	// Spotlight: darkens the centre so the logo stays readable, while the
	// screenshots keep their colour towards the edges.
	const spotlight = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}">
	<defs>
		<radialGradient id="spotlight" cx="50%" cy="50%" r="55%">
			<stop offset="0%" stop-color="#0d0d11" stop-opacity="0.9"/>
			<stop offset="40%" stop-color="#0d0d11" stop-opacity="0.72"/>
			<stop offset="100%" stop-color="#0d0d11" stop-opacity="0"/>
		</radialGradient>
	</defs>
	<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#spotlight)"/>
</svg>`);

	const logo = await sharp(LOGO_PATH, { density: 600 }).resize({ height: LOGO_HEIGHT }).toBuffer();

	mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

	await sharp({
		create: { width: WIDTH, height: HEIGHT, channels: 4, background: BACKGROUND },
	})
		.composite([...tiles, { input: spotlight }, { input: logo, gravity: 'centre' }])
		.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
		.toFile(OUTPUT_PATH);

	console.log(`✓ showcases-social.jpg (${cols}x${cols} of ${thumbs.length} screenshots)`);
}

main();
