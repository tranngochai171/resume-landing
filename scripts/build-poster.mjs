#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'node:fs';

const src = 'public/images/01-closed.jpg';
const out = 'public/images/01-closed.webp';

await sharp(src)
  .resize({ width: 1200, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(out);

const { size } = fs.statSync(out);
console.log(`${out}  ${(size / 1024).toFixed(1)} KB`);
