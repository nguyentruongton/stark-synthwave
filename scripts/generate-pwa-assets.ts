import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const FULL_SVG_PATH = path.join(PUBLIC_DIR, "icon.svg");
const NO_BG_SVG_PATH = path.join(PUBLIC_DIR, "icon-nobg.svg");

/**
 * Creates a PNG-wrapped ICO buffer for 32x32 favicon.ico.
 * Modern browsers and OSes support PNG-compressed icons within ICO container.
 */
function createIcoFromPng(pngBuffer: Buffer): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // Reserved
	header.writeUInt16LE(1, 2); // ICO type (1 = icon)
	header.writeUInt16LE(1, 4); // 1 image

	const directoryEntry = Buffer.alloc(16);
	directoryEntry.writeUInt8(32, 0); // Width 32 (0 means 256)
	directoryEntry.writeUInt8(32, 1); // Height 32
	directoryEntry.writeUInt8(0, 2); // Color palette (0 = no palette)
	directoryEntry.writeUInt8(0, 3); // Reserved
	directoryEntry.writeUInt16LE(1, 4); // Color planes
	directoryEntry.writeUInt16LE(32, 6); // Bits per pixel (32-bit RGBA)
	directoryEntry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
	directoryEntry.writeUInt32LE(22, 12); // Image offset (6 + 16 = 22)

	return Buffer.concat([header, directoryEntry, pngBuffer]);
}

/**
 * Generates an SVG string for Android Maskable icon:
 * - Edge-to-edge full bleed gradient background (#12062C -> #231052 -> #09031B)
 * - Centered NoBG icon art scaled to 78% (safely inside the 80% maskable safe zone)
 */
function createMaskableSvg(noBgInnerContent: string): string {
	return `
<svg width="720" height="720" viewBox="0 0 720 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg_gradient" x1="0" y1="0" x2="720" y2="720" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#12062C"/>
      <stop offset="52%" stop-color="#231052"/>
      <stop offset="100%" stop-color="#09031B"/>
    </linearGradient>
  </defs>
  <!-- Full-bleed background ensuring no white/transparent borders when clipped -->
  <rect width="720" height="720" fill="url(#bg_gradient)" />
  <!-- Scaled and centered artwork within the 80% safe zone circle (diameter 576px) -->
  <g transform="translate(79.2, 79.2) scale(0.78)">
    ${noBgInnerContent}
  </g>
</svg>
  `.trim();
}

/**
 * Generates an SVG string for Apple Touch Icon:
 * iOS home screen rounds the icon and does not allow transparent backgrounds (turns black).
 * So we use the edge-to-edge synthwave cosmic background with the full squircle badge centered.
 */
function createAppleTouchSvg(fullSvgInnerContent: string): string {
	return `
<svg width="720" height="720" viewBox="0 0 720 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="apple_bg" x1="0" y1="0" x2="720" y2="720" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#12062C"/>
      <stop offset="52%" stop-color="#231052"/>
      <stop offset="100%" stop-color="#09031B"/>
    </linearGradient>
  </defs>
  <!-- Edge-to-edge solid synthwave background -->
  <rect width="720" height="720" fill="url(#apple_bg)" />
  <g transform="translate(18, 18) scale(0.95)">
    ${fullSvgInnerContent}
  </g>
</svg>
  `.trim();
}

/**
 * Extracts the inner content of an SVG (strips <svg> and </svg> tags).
 */
function extractSvgInner(svgContent: string): string {
	const startMatch = svgContent.indexOf(">");
	const endMatch = svgContent.lastIndexOf("</svg>");
	if (startMatch === -1 || endMatch === -1) {
		return svgContent;
	}
	return svgContent.slice(startMatch + 1, endMatch).trim();
}

async function main() {
	console.log("🎨 Starting PWA & Brand Asset Generation...");

	// 1. Read input SVGs
	const fullSvgRaw = await fs.readFile(FULL_SVG_PATH, "utf-8");
	const noBgSvgRaw = await fs.readFile(NO_BG_SVG_PATH, "utf-8");

	const fullSvgInner = extractSvgInner(fullSvgRaw);
	const noBgSvgInner = extractSvgInner(noBgSvgRaw);

	// 2. Prepare Master SVGs
	console.log("📦 Writing public/icon.svg and public/favicon.svg...");
	await fs.writeFile(path.join(PUBLIC_DIR, "icon.svg"), fullSvgRaw, "utf-8");
	await fs.writeFile(path.join(PUBLIC_DIR, "favicon.svg"), fullSvgRaw, "utf-8");

	// 3. Generate Favicon PNGs (16, 32, 48)
	console.log("🖼️ Generating Favicon PNGs...");
	const sizes = [16, 32, 48];
	for (const size of sizes) {
		const targetPath = path.join(PUBLIC_DIR, `favicon-${size}.png`);
		await sharp(Buffer.from(fullSvgRaw))
			.resize(size, size)
			.png({ quality: 100, compressionLevel: 9 })
			.toFile(targetPath);
		console.log(`  ✓ favicon-${size}.png (${size}x${size})`);
	}

	// 4. Generate favicon.ico (32x32)
	console.log("🖼️ Generating favicon.ico...");
	const png32Buffer = await sharp(Buffer.from(fullSvgRaw))
		.resize(32, 32)
		.png({ quality: 100 })
		.toBuffer();
	const icoBuffer = createIcoFromPng(png32Buffer);
	await fs.writeFile(path.join(PUBLIC_DIR, "favicon.ico"), icoBuffer);
	console.log("  ✓ favicon.ico (32x32)");

	// 5. Generate Apple Touch Icon (180x180)
	console.log("🍎 Generating apple-touch-icon.png...");
	const appleSvg = createAppleTouchSvg(fullSvgInner);
	await sharp(Buffer.from(appleSvg))
		.resize(180, 180)
		.png({ quality: 100, compressionLevel: 9 })
		.toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));
	console.log("  ✓ apple-touch-icon.png (180x180)");

	// 6. Generate Standard PWA Icons (purpose: "any")
	console.log("📱 Generating PWA Icons (purpose: any)...");
	const pwaSizes = [192, 512];
	for (const size of pwaSizes) {
		const targetPath = path.join(PUBLIC_DIR, `icon-${size}.png`);
		await sharp(Buffer.from(fullSvgRaw))
			.resize(size, size)
			.png({ quality: 100, compressionLevel: 9 })
			.toFile(targetPath);
		console.log(`  ✓ icon-${size}.png (${size}x${size})`);
	}

	// 7. Generate Android Maskable PWA Icons (purpose: "maskable")
	console.log("📱 Generating PWA Icons (purpose: maskable)...");
	const maskableSvg = createMaskableSvg(noBgSvgInner);
	for (const size of pwaSizes) {
		const targetPath = path.join(PUBLIC_DIR, `icon-maskable-${size}.png`);
		await sharp(Buffer.from(maskableSvg))
			.resize(size, size)
			.png({ quality: 100, compressionLevel: 9 })
			.toFile(targetPath);
		console.log(`  ✓ icon-maskable-${size}.png (${size}x${size})`);
	}

	// 8. Generate Social Share Open Graph Image (1200x630)
	console.log("🌐 Generating Open Graph Image (1200x630)...");
	const ogSvgPath = path.join(PUBLIC_DIR, "og-image.svg");
	const ogSvgRaw = await fs.readFile(ogSvgPath, "utf-8");
	const ogPngPath = path.join(PUBLIC_DIR, "og-image.png");
	await sharp(Buffer.from(ogSvgRaw))
		.resize(1200, 630)
		.png({ quality: 100, compressionLevel: 9 })
		.toFile(ogPngPath);
	console.log("  ✓ og-image.png (1200x630)");

	console.log(
		"✨ All PWA, brand icon, and Open Graph assets generated successfully!",
	);
}

main().catch((err) => {
	console.error("❌ Failed to generate assets:", err);
	process.exit(1);
});
