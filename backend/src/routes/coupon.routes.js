import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateCoupon } from '../services/coupon.service.js';

const router = Router();

router.post('/validate', requireAuth, async (req, res, next) => {
  try {
    const { code, subtotal } = z
      .object({ code: z.string().min(2).max(40), subtotal: z.number().nonnegative() })
      .parse(req.body);
    const result = await validateCoupon(code, subtotal);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [items] = await pool.execute('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

const couponSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().max(255).optional(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

router.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = couponSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, starts_at, expires_at, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        data.code.toUpperCase(),
        data.description || null,
        data.discountType,
        data.discountValue,
        data.minOrderAmount ?? 0,
        data.maxDiscountAmount ?? null,
        data.usageLimit ?? null,
        data.startsAt ?? null,
        data.expiresAt ?? null,
        data.isActive ?? true,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    next(e);
  }
});

export default router;
