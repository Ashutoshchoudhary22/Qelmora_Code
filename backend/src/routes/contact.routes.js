import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const messageSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(190),
  phone: z.string().max(30).optional().nullable(),
  message: z.string().min(3).max(5000),
});

router.post('/', async (req, res, next) => {
  try {
    const data = messageSchema.parse(req.body);
    await pool.execute(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES (?,?,?,?)',
      [data.name.trim(), data.email.toLowerCase(), data.phone?.trim() || null, data.message.trim()]
    );
    res.status(201).json({ message: 'Thanks — we will get back to you soon.' });
  } catch (e) {
    next(e);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const [items] = await pool.execute(
      `SELECT id, name, email, phone, message, created_at AS createdAt
       FROM contact_messages ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

export default router;
