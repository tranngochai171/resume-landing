#!/usr/bin/env node
// One-off portrait conversion. Run with: pnpm build:portrait -- <source-png>
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const source = process.argv[2];
if (!source) {
  console.error('Usage: pnpm build:portrait -- <path-to-source.png>');
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error(`Source file not found: ${source}`);
  process.exit(1);
}

const outDir = path.resolve('public/images/portrait');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [720, 480];
const formats = [
  { ext: 'avif', options: { quality: 70, effort: 6 } },
  { ext: 'webp', options: { quality: 85 } },
  { ext: 'jpg',  options: { quality: 88, mozjpeg: true } },
];

for (const width of sizes) {
  for (const { ext, options } of formats) {
    const out = path.join(outDir, `portrait-2026-${width}.${ext}`);
    const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
    const produce =
      ext === 'avif' ? pipeline.avif(options) :
      ext === 'webp' ? pipeline.webp(options) :
                       pipeline.jpeg(options);
    await produce.toFile(out);
    const { size } = fs.statSync(out);
    console.log(`  ${path.basename(out).padEnd(30)} ${(size / 1024).toFixed(1)} KB`);
  }
}

console.log('\nPortrait variants written to public/images/portrait/');
