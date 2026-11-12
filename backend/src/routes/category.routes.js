import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { cloudinaryConfigErrorResponse, createUploadSignature } from '../utils/cloudinary-sign.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, name, slug, description, image_url AS imageUrl, media_type AS mediaType, sort_order AS sortOrder
       FROM categories WHERE is_active=1 AND slug <> 'unisex' ORDER BY sort_order, name`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/admin/list', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, name, slug, description, image_url AS imageUrl, media_type AS mediaType, sort_order AS sortOrder, is_active AS isActive
       FROM categories WHERE slug IN ('men','women','new-arrivals') ORDER BY sort_order, name`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/admin/cloudinary-signature', requireAuth, requireAdmin, (req, res) => {
  const err = cloudinaryConfigErrorResponse();
  if (err) return res.status(err.status).json(err.body);
  const folder = req.body?.folder || 'qelmora/categories';
  res.json(createUploadSignature(folder));
});

router.get('/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, description, image_url AS imageUrl, media_type AS mediaType FROM categories WHERE slug=? AND is_active=1 LIMIT 1`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Category not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  mediaType: z.enum(['image', 'video']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO categories (name, slug, description, image_url, sort_order, is_active)
       VALUES (?,?,?,?,?,?)`,
      [
        data.name,
        data.slug,
        data.description || null,
        data.imageUrl || null,
        data.sortOrder ?? 0,
        data.isActive ?? true,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const fields = [];
    const values = [];
    if (data.name != null) {
      fields.push('name=?');
      values.push(data.name);
    }
    if (data.slug != null) {
      fields.push('slug=?');
      values.push(data.slug);
    }
    if (data.description !== undefined) {
      fields.push('description=?');
      values.push(data.description);
    }
    if (data.imageUrl !== undefined) {
      fields.push('image_url=?');
      values.push(data.imageUrl);
    }
    if (data.mediaType !== undefined) {
      fields.push('media_type=?');
      values.push(data.mediaType);
    }
    if (data.sortOrder != null) {
      fields.push('sort_order=?');
      values.push(data.sortOrder);
    }
    if (data.isActive != null) {
      fields.push('is_active=?');
      values.push(data.isActive);
    }
    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });
    values.push(req.params.id);
    await pool.execute(`UPDATE categories SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ message: 'Updated' });
  } catch (e) {
    next(e);
  }
});

export default router;
