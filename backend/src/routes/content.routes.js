import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { cloudinaryConfigErrorResponse, createUploadSignature } from '../utils/cloudinary-sign.js';

const router = Router();

const sectionSchema = z.object({
  eyebrow: z.string().max(120).optional(),
  headline: z.string().min(1).max(5000),
  body: z.string().max(8000).optional().nullable(),
  ctaLabel: z.string().max(80).optional().nullable(),
  ctaLink: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  mediaType: z.enum(['image', 'video']).optional(),
});

router.get('/admin/all', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT section_key AS sectionKey, eyebrow, headline, body,
        cta_label AS ctaLabel, cta_link AS ctaLink,
        image_url AS imageUrl, media_type AS mediaType, updated_at AS updatedAt
       FROM site_sections ORDER BY section_key`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.patch('/admin/:key', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = sectionSchema.parse(req.body);
    const fields = [];
    const values = [];
    const map = {
      eyebrow: 'eyebrow',
      headline: 'headline',
      body: 'body',
      ctaLabel: 'cta_label',
      ctaLink: 'cta_link',
      imageUrl: 'image_url',
      mediaType: 'media_type',
    };
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) {
        fields.push(`${col}=?`);
        values.push(data[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });
    values.push(req.params.key);
    const [result] = await pool.execute(`UPDATE site_sections SET ${fields.join(',')} WHERE section_key=?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Updated' });
  } catch (e) {
    next(e);
  }
});

router.get('/:key', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT section_key AS sectionKey, eyebrow, headline, body,
        cta_label AS ctaLabel, cta_link AS ctaLink,
        image_url AS imageUrl, media_type AS mediaType, updated_at AS updatedAt
       FROM site_sections WHERE section_key=? LIMIT 1`,
      [req.params.key]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Section not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.post('/admin/cloudinary-signature', requireAuth, requireAdmin, (req, res) => {
  const err = cloudinaryConfigErrorResponse();
  if (err) return res.status(err.status).json(err.body);
  const folder = req.body?.folder || 'qelmora/pages';
  res.json(createUploadSignature(folder));
});

export default router;
