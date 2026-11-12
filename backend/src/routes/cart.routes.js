import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCoupon } from '../services/coupon.service.js';

const router = Router();
router.use(requireAuth);

async function getCartSummary(userId) {
  const [cart] = await pool.execute('SELECT id, coupon_code FROM carts WHERE user_id=?', [userId]);
  if (!cart[0]) return { items: [], itemCount: 0, subtotal: 0, discount: 0, total: 0 };
  const [items] = await pool.execute(
    `SELECT ci.id,ci.quantity,v.id AS variant_id,v.size,v.color,v.stock,
      COALESCE(v.price_override,p.price) AS price,p.name,p.slug,
      (SELECT secure_url FROM product_media pm WHERE pm.product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image
     FROM cart_items ci JOIN product_variants v ON v.id=ci.variant_id
     JOIN products p ON p.id=v.product_id WHERE ci.cart_id=?`,
    [cart[0].id]
  );
  let subtotal = 0;
  let itemCount = 0;
  for (const i of items) {
    subtotal += i.price * i.quantity;
    itemCount += i.quantity;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  const coupon = cart[0].coupon_code ? await validateCoupon(cart[0].coupon_code, subtotal) : { discount: 0 };
  const discount = coupon.valid ? coupon.discount : 0;
  const total = Math.round((subtotal - discount) * 100) / 100;
  return { items, itemCount, subtotal, discount, total, couponCode: cart[0].coupon_code };
}

router.get('/summary', async (req, res, next) => {
  try {
    const summary = await getCartSummary(req.user.sub);
    res.json({ itemCount: summary.itemCount });
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const summary = await getCartSummary(req.user.sub);
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const { variantId, quantity = 1 } = req.body;
    const vid = Number(variantId);
    const qty = Number(quantity);
    if (!Number.isInteger(vid) || vid < 1 || !Number.isInteger(qty) || qty < 1 || qty > 10)
      return res.status(400).json({ message: 'Invalid variant or quantity' });
    const [v] = await pool.execute('SELECT id,stock FROM product_variants WHERE id=?', [vid]);
    if (!v[0] || v[0].stock < qty) return res.status(409).json({ message: 'Insufficient stock' });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)', [
        req.user.sub,
      ]);
      const [c] = await conn.execute('SELECT id FROM carts WHERE user_id=? FOR UPDATE', [req.user.sub]);
      const [existing] = await conn.execute('SELECT id, quantity FROM cart_items WHERE cart_id=? AND variant_id=?', [
        c[0].id,
        vid,
      ]);
      const newQty = (existing[0]?.quantity || 0) + qty;
      if (newQty > 10) {
        await conn.rollback();
        return res.status(400).json({ message: 'Maximum 10 items per variant' });
      }
      if (v[0].stock < newQty) {
        await conn.rollback();
        return res.status(409).json({ message: 'Insufficient stock' });
      }
      if (existing[0]) {
        await conn.execute('UPDATE cart_items SET quantity=? WHERE id=?', [newQty, existing[0].id]);
      } else {
        await conn.execute('INSERT INTO cart_items (cart_id,variant_id,quantity) VALUES (?,?,?)', [
          c[0].id,
          vid,
          qty,
        ]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.status(201).json({ message: 'Added to cart' });
  } catch (e) {
    next(e);
  }
});

router.patch('/items/:id', async (req, res, next) => {
  try {
    const { quantity, variantId } = req.body;
    const [cart] = await pool.execute('SELECT id FROM carts WHERE user_id=?', [req.user.sub]);
    if (!cart[0]) return res.status(404).json({ message: 'Cart not found' });

    if (variantId) {
      const [v] = await pool.execute('SELECT id,stock FROM product_variants WHERE id=?', [variantId]);
      if (!v[0]) return res.status(404).json({ message: 'Variant not found' });
      const qty = quantity || 1;
      if (qty < 1 || qty > 10) return res.status(400).json({ message: 'Invalid quantity' });
      if (v[0].stock < qty) return res.status(409).json({ message: 'Insufficient stock' });
      await pool.execute(
        `UPDATE cart_items ci JOIN carts c ON c.id=ci.cart_id SET ci.variant_id=?, ci.quantity=? WHERE ci.id=? AND c.user_id=?`,
        [variantId, qty, req.params.id, req.user.sub]
      );
      return res.json({ message: 'Updated' });
    }

    if (!Number.isInteger(Number(quantity)) || quantity < 1 || quantity > 10)
      return res.status(400).json({ message: 'Invalid quantity' });
    const [item] = await pool.execute(
      `SELECT ci.id, v.stock FROM cart_items ci JOIN carts c ON c.id=ci.cart_id
       JOIN product_variants v ON v.id=ci.variant_id WHERE ci.id=? AND c.user_id=?`,
      [req.params.id, req.user.sub]
    );
    if (!item[0]) return res.status(404).json({ message: 'Item not found' });
    if (item[0].stock < quantity) return res.status(409).json({ message: 'Insufficient stock' });
    await pool.execute(
      `UPDATE cart_items ci JOIN carts c ON c.id=ci.cart_id SET ci.quantity=? WHERE ci.id=? AND c.user_id=?`,
      [quantity, req.params.id, req.user.sub]
    );
    res.json({ message: 'Updated' });
  } catch (e) {
    next(e);
  }
});

router.post('/coupon', async (req, res, next) => {
  try {
    const { code } = req.body;
    const summary = await getCartSummary(req.user.sub);
  if (!summary.items.length) return res.status(400).json({ message: 'Cart is empty' });
    const result = await validateCoupon(code, summary.subtotal);
    if (!result.valid) return res.status(400).json({ message: result.message });
    await pool.execute('INSERT INTO carts (user_id, coupon_code) VALUES (?,?) ON DUPLICATE KEY UPDATE coupon_code=VALUES(coupon_code)', [
      req.user.sub,
      code.toUpperCase(),
    ]);
    res.json({ message: 'Coupon applied', discount: result.discount });
  } catch (e) {
    next(e);
  }
});

router.delete('/coupon', async (req, res, next) => {
  try {
    await pool.execute('UPDATE carts SET coupon_code=NULL WHERE user_id=?', [req.user.sub]);
    res.json({ message: 'Coupon removed' });
  } catch (e) {
    next(e);
  }
});

router.delete('/items/:id', async (req, res, next) => {
  try {
    await pool.execute(
      `DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE ci.id=? AND c.user_id=?`,
      [req.params.id, req.user.sub]
    );
    res.json({ message: 'Removed from cart' });
  } catch (e) {
    next(e);
  }
});

export default router;
