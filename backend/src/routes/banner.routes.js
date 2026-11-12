import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const placement = req.query.placement;
    let sql = `SELECT id, title, subtitle, cta_label AS ctaLabel, cta_link AS ctaLink,
      resource_type AS resourceType, secure_url AS secureUrl, placement, sort_order AS sortOrder
      FROM homepage_banners WHERE is_active=1`;
    const params = [];
    if (placement) {
      sql += ' AND placement=?';
      params.push(placement);
    }
    sql += ' ORDER BY sort_order, id';
    const [items] = await pool.execute(sql, params);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

const bannerSchema = z.object({
  title: z.string().min(1).max(180),
  subtitle: z.string().max(255).optional().nullable(),
  ctaLabel: z.string().max(80).optional().nullable(),
  ctaLink: z.string().max(500).optional().nullable(),
  resourceType: z.enum(['image', 'video']),
  secureUrl: z.string().url(),
  publicId: z.string().optional().nullable(),
  placement: z.enum(['hero', 'promo', 'collection', 'announcement']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [items] = await pool.execute(`SELECT * FROM homepage_banners ORDER BY placement, sort_order`);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = bannerSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO homepage_banners (title, subtitle, cta_label, cta_link, resource_type, secure_url, public_id, placement, sort_order, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        data.title,
        data.subtitle || null,
        data.ctaLabel || null,
        data.ctaLink || null,
        data.resourceType,
        data.secureUrl,
        data.publicId || null,
        data.placement || 'hero',
        data.sortOrder ?? 0,
        data.isActive ?? true,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    next(e);
  }
});

router.patch('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = bannerSchema.partial().parse(req.body);
    const fields = [];
    const values = [];
    const map = {
      title: 'title',
      subtitle: 'subtitle',
      ctaLabel: 'cta_label',
      ctaLink: 'cta_link',
      resourceType: 'resource_type',
      secureUrl: 'secure_url',
      publicId: 'public_id',
      placement: 'placement',
      sortOrder: 'sort_order',
      isActive: 'is_active',
    };
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) {
        fields.push(`${col}=?`);
        values.push(data[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ message: 'No fields' });
    values.push(req.params.id);
    await pool.execute(`UPDATE homepage_banners SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ message: 'Updated' });
  } catch (e) {
    next(e);
  }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM homepage_banners WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

router.post('/admin/cloudinary-signature', requireAuth, requireAdmin, (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = req.body?.folder || 'qelmora/banners';
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);
  res.json({
    timestamp,
    folder,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
});

export default router;
