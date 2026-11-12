import { validateCoupon } from './coupon.service.js';

export async function placeOrderFromCart(conn, userId, addressId, paymentMethod, couponCode) {
  await conn.beginTransaction();
  const [addresses] = await conn.execute('SELECT * FROM addresses WHERE id=? AND user_id=?', [addressId, userId]);
  if (!addresses[0]) {
    await conn.rollback();
    return { error: 'Select a valid delivery address', status: 400 };
  }

  const [carts] = await conn.execute('SELECT id, coupon_code FROM carts WHERE user_id=? FOR UPDATE', [userId]);
  if (!carts[0]) {
    await conn.rollback();
    return { error: 'Cart is empty', status: 400 };
  }

  const [items] = await conn.execute(
    `SELECT ci.quantity, v.id variant_id, v.sku, v.size, v.color, v.stock,
      COALESCE(v.price_override, p.price) price, p.name
     FROM cart_items ci JOIN product_variants v ON v.id=ci.variant_id
     JOIN products p ON p.id=v.product_id WHERE ci.cart_id=? FOR UPDATE`,
    [carts[0].id]
  );
  if (!items.length) {
    await conn.rollback();
    return { error: 'Cart is empty', status: 400 };
  }

  let subtotal = 0;
  for (const item of items) {
    if (item.stock < item.quantity) {
      await conn.rollback();
      return { error: `Insufficient stock for ${item.name}`, status: 409 };
    }
    subtotal += item.price * item.quantity;
  }

  const appliedCode = couponCode || carts[0].coupon_code;
  let discount = 0;
  if (appliedCode) {
    const c = await validateCoupon(appliedCode, subtotal);
    if (!c.valid) {
      await conn.rollback();
      return { error: c.message, status: 400 };
    }
    discount = c.discount;
  }

  const total = Math.round((subtotal - discount) * 100) / 100;
  const orderNumber = `QEL-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  const a = addresses[0];
  const snapshot = {
    full_name: a.full_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postal_code: a.postal_code,
    country: a.country,
  };

  const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';
  const [order] = await conn.execute(
    `INSERT INTO orders (order_number, user_id, address_snapshot, subtotal, discount_amount, coupon_code, total_amount, payment_method, payment_status, order_status)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      orderNumber,
      userId,
      JSON.stringify(snapshot),
      subtotal,
      discount,
      appliedCode || null,
      total,
      paymentMethod,
      paymentStatus,
      'placed',
    ]
  );

  for (const item of items) {
    await conn.execute(
      `INSERT INTO order_items (order_id, variant_id, product_name, sku, size, color, unit_price, quantity) VALUES (?,?,?,?,?,?,?,?)`,
      [order.insertId, item.variant_id, item.name, item.sku, item.size, item.color, item.price, item.quantity]
    );
    await conn.execute('UPDATE product_variants SET stock=stock-? WHERE id=?', [item.quantity, item.variant_id]);
  }

  await conn.execute('DELETE FROM cart_items WHERE cart_id=?', [carts[0].id]);
  if (appliedCode) {
    await conn.execute('UPDATE coupons SET used_count=used_count+1 WHERE code=?', [appliedCode.toUpperCase()]);
  }

  await conn.commit();
  return { orderId: order.insertId, orderNumber, total, subtotal, discount };
}
