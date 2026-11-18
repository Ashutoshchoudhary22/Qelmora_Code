import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const ICON_KEYS = new Set([
  'package',
  'map-pin',
  'user',
  'headphones',
  'book-open',
  'sparkles',
  'help-circle',
  'mail',
  'tag',
  'shopping-bag',
]);

const tileSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  linkPath: z.string().min(1).max(500),
  iconKey: z.string().max(40),
  imageUrl: z.string().url().nullable().optional(),
  tileKey: z.string().max(40).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).default(0),
  isActive: z.boolean().default(true),
});

router.get('/', async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, title, description, link_path AS linkPath, icon_key AS iconKey,
        image_url AS imageUrl, tile_key AS tileKey, sort_order AS sortOrder
       FROM account_overview_tiles
       WHERE is_active=1
       ORDER BY sort_order, id`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/admin/all', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, title, description, link_path AS linkPath, icon_key AS iconKey,
        image_url AS imageUrl, tile_key AS tileKey, sort_order AS sortOrder, is_active AS isActive
       FROM account_overview_tiles
       ORDER BY sort_order, id`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.put('/admin/sync', requireAuth, requireAdmin, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const tiles = z.array(tileSchema).min(1).max(12).parse(req.body.tiles);
    await conn.beginTransaction();
    for (const t of tiles) {
      const iconKey = ICON_KEYS.has(t.iconKey) ? t.iconKey : 'package';
      if (t.id) {
        await conn.execute(
          `UPDATE account_overview_tiles SET title=?, description=?, link_path=?, icon_key=?, image_url=?, tile_key=?, sort_order=?, is_active=? WHERE id=?`,
          [
            t.title,
            t.description,
            t.linkPath,
            iconKey,
            t.imageUrl || null,
            t.tileKey || null,
            t.sortOrder,
            t.isActive ? 1 : 0,
            t.id,
          ]
        );
      } else {
        await conn.execute(
          `INSERT INTO account_overview_tiles (title, description, link_path, icon_key, image_url, tile_key, sort_order, is_active)
           VALUES (?,?,?,?,?,?,?,?)`,
          [
            t.title,
            t.description,
            t.linkPath,
            iconKey,
            t.imageUrl || null,
            t.tileKey || null,
            t.sortOrder,
            t.isActive ? 1 : 0,
          ]
        );
      }
    }
    await conn.commit();
    res.json({ message: 'Saved' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

export default router;