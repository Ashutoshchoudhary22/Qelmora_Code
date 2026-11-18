import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

function pctTrend(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c > 0 ? 100 : 0;
  return ((c - p) / p) * 100;
}

router.get('/analytics', async (_req, res, next) => {
  try {
    const [[orders]] = await pool.query(
      `SELECT COUNT(*) AS totalOrders,
        COALESCE(SUM(CASE WHEN payment_status IN ('paid','pending') AND order_status != 'cancelled' THEN total_amount ELSE 0 END),0) AS revenue
       FROM orders`
    );
    const [[customers]] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role='customer'`);
    const [[products]] = await pool.query(`SELECT COUNT(*) AS total FROM products WHERE is_active=1`);

    const [[orderWindow]] = await pool.query(
      `SELECT
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN 1 END) AS ordersCur,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY THEN 1 END) AS ordersPrev
       FROM orders`
    );
    const [[revenueWindow]] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY
          AND payment_status IN ('paid','pending') AND order_status != 'cancelled' THEN total_amount END), 0) AS revenueCur,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY
          AND payment_status IN ('paid','pending') AND order_status != 'cancelled' THEN total_amount END), 0) AS revenuePrev
       FROM orders`
    );
    const [[customerWindow]] = await pool.query(
      `SELECT
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN 1 END) AS customersCur,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY THEN 1 END) AS customersPrev
       FROM users WHERE role='customer'`
    );
    const [[productWindow]] = await pool.query(
      `SELECT
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY AND is_active=1 THEN 1 END) AS productsCur,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 60 DAY AND created_at < NOW() - INTERVAL 30 DAY AND is_active=1 THEN 1 END) AS productsPrev
       FROM products`
    );

    const [recentOrders] = await pool.execute(
      `SELECT o.order_number AS orderNumber, o.total_amount AS total, o.order_status AS orderStatus,
        o.payment_status AS paymentStatus, o.created_at AS createdAt,
        u.name AS customerName, u.email AS customerEmail
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 8`
    );
    res.json({
      totalOrders: Number(orders.totalOrders),
      revenue: Number(orders.revenue),
      totalCustomers: Number(customers.total),
      totalProducts: Number(products.total),
      trends: {
        revenue: pctTrend(revenueWindow.revenueCur, revenueWindow.revenuePrev),
        orders: pctTrend(orderWindow.ordersCur, orderWindow.ordersPrev),
        customers: pctTrend(customerWindow.customersCur, customerWindow.customersPrev),
        products: pctTrend(productWindow.productsCur, productWindow.productsPrev),
      },
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
