import fs from 'fs';
import path from 'path';

// Keep in sync with app/sitemap.ts (this file overwrites the one Next generates).
const lastmod = new Date().toISOString().split('T')[0];
const pages = [
  { loc: 'https://topy-tran.vercel.app/', priority: '1.0' },
  { loc: 'https://topy-tran.vercel.app/elegant/', priority: '0.7' },
  { loc: 'https://topy-tran.vercel.app/os/', priority: '0.7' },
];

const urls = pages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml);
console.log('✓ Generated out/sitemap.xml');
