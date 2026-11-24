import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

function siteOrigin() {
  const raw =
    process.env.SITE_PUBLIC_URL ||
    process.env.VITE_SITE_URL ||
    (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  return String(raw).replace(/\/$/, '');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry(origin, loc, lastmod, changefreq, priority) {
  const parts = [
    '  <url>',
    `    <loc>${escapeXml(`${origin}${loc}`)}</loc>`,
  ];
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority != null) parts.push(`    <priority>${priority}</priority>`);
  parts.push('  </url>');
  return parts.join('\n');
}

function toLastmod(d) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const origin = siteOrigin();
    const staticRoutes = [
      { loc: '/', changefreq: 'daily', priority: '1.0' },
      { loc: '/shop/men', changefreq: 'daily', priority: '0.9' },
      { loc: '/shop/women', changefreq: 'daily', priority: '0.9' },
      { loc: '/collections', changefreq: 'weekly', priority: '0.8' },
      { loc: '/about', changefreq: 'monthly', priority: '0.6' },
      { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
    ];

    const [products] = await pool.execute(
      `SELECT slug, updated_at AS updatedAt, created_at AS createdAt
       FROM products WHERE is_active = 1 ORDER BY updated_at DESC`
    );

    const [categories] = await pool.execute(
      `SELECT slug FROM categories WHERE is_active = 1 AND slug IN ('men','women')`
    );

    const urls = [
      ...staticRoutes.map((r) => urlEntry(origin, r.loc, null, r.changefreq, r.priority)),
      ...categories.map((c) =>
        urlEntry(origin, `/shop/${c.slug}`, null, 'weekly', '0.85')
      ),
      ...products.map((p) =>
        urlEntry(
          origin,
          `/product/${p.slug}`,
          toLastmod(p.updatedAt || p.createdAt),
          'weekly',
          '0.8'
        )
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (e) {
    next(e);
  }
});

export default router;