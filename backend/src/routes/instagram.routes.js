import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { cloudinaryConfigErrorResponse, createUploadSignature } from '../utils/cloudinary-sign.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, secure_url AS secureUrl, public_id AS publicId, resource_type AS resourceType,
        link_url AS linkUrl, sort_order AS sortOrder
       FROM instagram_posts WHERE is_active=1 ORDER BY sort_order, id`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, secure_url AS secureUrl, public_id AS publicId, resource_type AS resourceType,
        link_url AS linkUrl, sort_order AS sortOrder, is_active AS isActive, created_at AS createdAt
       FROM instagram_posts ORDER BY sort_order, id DESC`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

const postSchema = z.object({
  secureUrl: z.string().url(),
  publicId: z.string().min(1),
  resourceType: z.enum(['image', 'video']).optional(),
  linkUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

router.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = postSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO instagram_posts (secure_url, public_id, resource_type, link_url, sort_order, is_active)
       VALUES (?,?,?,?,?,1)`,
      [
        data.secureUrl,
        data.publicId,
        data.resourceType || 'image',
        data.linkUrl || null,
        data.sortOrder ?? 0,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    next(e);
  }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM instagram_posts WHERE id=?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

router.post('/admin/cloudinary-signature', requireAuth, requireAdmin, (req, res) => {
  const err = cloudinaryConfigErrorResponse();
  if (err) return res.status(err.status).json(err.body);
  const folder = req.body?.folder || 'qelmora/instagram';
  res.json(createUploadSignature(folder));
});

export default router;
