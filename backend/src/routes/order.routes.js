import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { placeOrderFromCart } from '../services/order.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT id, order_number AS orderNumber, subtotal, discount_amount AS discountAmount,
        total_amount AS total, payment_method AS paymentMethod, payment_status AS paymentStatus,
        order_status AS orderStatus, created_at AS createdAt
       FROM orders WHERE user_id=? ORDER BY created_at DESC`,
      [req.user.sub]
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/:orderNumber', async (req, res, next) => {
  try {
    const [orders] = await pool.execute(
      `SELECT id, order_number AS orderNumber, address_snapshot AS addressSnapshot, subtotal,
        discount_amount AS discountAmount, total_amount AS total, payment_method AS paymentMethod,
        payment_status AS paymentStatus, order_status AS orderStatus, created_at AS createdAt
       FROM orders WHERE order_number=? AND user_id=? LIMIT 1`,
      [req.params.orderNumber, req.user.sub]
    );
    if (!orders[0]) return res.status(404).json({ message: 'Order not found' });
    const [lineItems] = await pool.execute(
      `SELECT product_name AS productName, sku, size, color, unit_price AS unitPrice, quantity
       FROM order_items WHERE order_id=?`,
      [orders[0].id]
    );
    res.json({ ...orders[0], items: lineItems });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { addressId, paymentMethod, couponCode } = z
      .object({
        addressId: z.number().int().positive(),
        paymentMethod: z.enum(['cod', 'online']),
        couponCode: z.string().optional(),
      })
      .parse(req.body);

    if (paymentMethod === 'online') {
      return res.status(400).json({
        message: 'Use POST /payments/razorpay/create-order for online checkout',
      });
    }

    const result = await placeOrderFromCart(conn, req.user.sub, addressId, 'cod', couponCode);
    if (result.error) return res.status(result.status).json({ message: result.error });

    res.status(201).json({
      orderNumber: result.orderNumber,
      total: result.total,
      message: 'COD order placed',
    });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    next(e);
  } finally {
    conn.release();
  }
});

export default router;
