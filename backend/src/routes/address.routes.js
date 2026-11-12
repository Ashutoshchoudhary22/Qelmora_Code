import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const addressSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(8).max(25),
  line1: z.string().min(3).max(255),
  line2: z.string().max(255).optional().nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(5).max(12),
  country: z.string().max(80).optional(),
  isDefault: z.boolean().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, full_name AS fullName, phone, line1, line2, city, state,
        postal_code AS postalCode, country, is_default AS isDefault, created_at AS createdAt
       FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC`,
      [req.user.sub]
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = addressSchema.parse(req.body);
    await conn.beginTransaction();
    if (data.isDefault) {
      await conn.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.sub]);
    }
    const [result] = await conn.execute(
      `INSERT INTO addresses (user_id, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.sub,
        data.fullName,
        data.phone,
        data.line1,
        data.line2 || null,
        data.city,
        data.state,
        data.postalCode,
        data.country || 'India',
        data.isDefault ? 1 : 0,
      ]
    );
    const [count] = await conn.execute('SELECT COUNT(*) AS c FROM addresses WHERE user_id=?', [req.user.sub]);
    if (count[0].c === 1) {
      await conn.execute('UPDATE addresses SET is_default=1 WHERE id=?', [result.insertId]);
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

router.patch('/:id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = addressSchema.partial().parse(req.body);
    const [existing] = await conn.execute('SELECT id FROM addresses WHERE id=? AND user_id=?', [
      req.params.id,
      req.user.sub,
    ]);
    if (!existing[0]) return res.status(404).json({ message: 'Address not found' });
    await conn.beginTransaction();
    if (data.isDefault) {
      await conn.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.sub]);
    }
    const map = {
      fullName: 'full_name',
      phone: 'phone',
      line1: 'line1',
      line2: 'line2',
      city: 'city',
      state: 'state',
      postalCode: 'postal_code',
      country: 'country',
      isDefault: 'is_default',
    };
    const fields = [];
    const values = [];
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col}=?`);
        values.push(key === 'isDefault' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (fields.length) {
      values.push(req.params.id);
      await conn.execute(`UPDATE addresses SET ${fields.join(',')} WHERE id=?`, values);
    }
    await conn.commit();
    res.json({ message: 'Updated' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM addresses WHERE id=? AND user_id=?', [
      req.params.id,
      req.user.sub,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;
