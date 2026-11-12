import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { createRazorpayOrder, getRazorpay, verifyPaymentSignature } from '../services/razorpay.service.js';
import { placeOrderFromCart } from '../services/order.service.js';

const router = Router();

router.get('/razorpay-key', (_req, res) => {
  const creds = getRazorpay();
  if (!creds) return res.status(503).json({ message: 'Online payments unavailable' });
  res.json({ keyId: creds.keyId });
});

router.post('/razorpay/create-order', requireAuth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { addressId, couponCode } = z
      .object({ addressId: z.number().int().positive(), couponCode: z.string().optional() })
      .parse(req.body);

    const result = await placeOrderFromCart(conn, req.user.sub, addressId, 'online', couponCode);
    if (result.error) return res.status(result.status).json({ message: result.error });

    const razorpayOrder = await createRazorpayOrder(result.total, result.orderNumber, {
      qelmora_order_id: String(result.orderId),
    });

    await conn.execute(
      `INSERT INTO payments (order_id, provider, provider_order_id, amount, status, raw_response)
       VALUES (?,?,?,?,'created',?)`,
      [result.orderId, 'razorpay', razorpayOrder.id, result.total, JSON.stringify(razorpayOrder)]
    );

    res.json({
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      amount: result.total,
      razorpayOrderId: razorpayOrder.id,
      currency: 'INR',
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

router.post('/razorpay/verify', requireAuth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const data = z
      .object({
        orderId: z.number().int().positive(),
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
      })
      .parse(req.body);

    const valid = verifyPaymentSignature({
      orderId: data.razorpayOrderId,
      paymentId: data.razorpayPaymentId,
      signature: data.razorpaySignature,
    });
    if (!valid) return res.status(400).json({ message: 'Payment verification failed' });

    await conn.beginTransaction();
    const [orders] = await conn.execute(
      'SELECT id, user_id, payment_status FROM orders WHERE id=? FOR UPDATE',
      [data.orderId]
    );
    const order = orders[0];
    if (!order || String(order.user_id) !== String(req.user.sub))
      return res.status(404).json({ message: 'Order not found' });
    if (order.payment_status === 'paid') {
      await conn.commit();
      return res.json({ message: 'Already paid' });
    }

    const [payments] = await conn.execute(
      `SELECT id FROM payments WHERE order_id=? AND provider_order_id=? LIMIT 1`,
      [data.orderId, data.razorpayOrderId]
    );
    if (!payments[0]) {
      await conn.rollback();
      return res.status(400).json({ message: 'Payment record not found' });
    }

    await conn.execute(
      `UPDATE payments SET provider_payment_id=?, status='captured', signature_verified=1 WHERE id=?`,
      [data.razorpayPaymentId, payments[0].id]
    );
    await conn.execute(`UPDATE orders SET payment_status='paid', order_status='confirmed' WHERE id=?`, [data.orderId]);
    await conn.commit();
    res.json({ message: 'Payment confirmed' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

export default router;
