import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/analytics', async (_req, res, next) => {
  try {
    const [[orders]] = await pool.query(
      `SELECT COUNT(*) AS totalOrders,
        COALESCE(SUM(CASE WHEN payment_status IN ('paid','pending') AND order_status != 'cancelled' THEN total_amount ELSE 0 END),0) AS revenue
       FROM orders`
    );
    const [[customers]] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role='customer'`);
    const [[products]] = await pool.query(`SELECT COUNT(*) AS total FROM products WHERE is_active=1`);
    const [recentOrders] = await pool.execute(
      `SELECT order_number AS orderNumber, total_amount AS total, order_status AS orderStatus, payment_status AS paymentStatus, created_at AS createdAt
       FROM orders ORDER BY created_at DESC LIMIT 8`
    );
    res.json({
      totalOrders: Number(orders.totalOrders),
      revenue: Number(orders.revenue),
      totalCustomers: Number(customers.total),
      totalProducts: Number(products.total),
      recentOrders,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/customers', async (req, res, next) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const [items] = await pool.execute(
      `SELECT id, name, email, phone, created_at AS createdAt FROM users WHERE role='customer' ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status;
    let sql = `SELECT o.id, o.order_number AS orderNumber, o.total_amount AS total, o.order_status AS orderStatus,
      o.payment_status AS paymentStatus, o.payment_method AS paymentMethod, o.created_at AS createdAt,
      u.name AS customerName, u.email AS customerEmail
      FROM orders o JOIN users u ON u.id=o.user_id`;
    const params = [];
    if (status) {
      sql += ' WHERE o.order_status=?';
      params.push(status);
    }
    sql += ' ORDER BY o.created_at DESC LIMIT 100';
    const [items] = await pool.execute(sql, params);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const allowed = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(orderStatus)) return res.status(400).json({ message: 'Invalid status' });
    await pool.execute('UPDATE orders SET order_status=? WHERE id=?', [orderStatus, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) {
    next(e);
  }
});

export default router;
