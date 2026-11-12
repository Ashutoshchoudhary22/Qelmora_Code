import { pool } from '../config/db.js';

export async function validateCoupon(code, subtotal) {
  if (!code) return { valid: false, discount: 0, message: 'No coupon' };
  const [rows] = await pool.execute(
    `SELECT * FROM coupons WHERE code=? AND is_active=1 LIMIT 1`,
    [code.toUpperCase()]
  );
  const coupon = rows[0];
  if (!coupon) return { valid: false, discount: 0, message: 'Invalid coupon' };
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return { valid: false, discount: 0, message: 'Coupon not yet active' };
  if (coupon.expires_at && new Date(coupon.expires_at) < now)
    return { valid: false, discount: 0, message: 'Coupon expired' };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
    return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
  if (Number(subtotal) < Number(coupon.min_order_amount))
    return { valid: false, discount: 0, message: `Minimum order ₹${coupon.min_order_amount}` };

  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = (Number(subtotal) * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount != null)
      discount = Math.min(discount, Number(coupon.max_discount_amount));
  } else {
    discount = Number(coupon.discount_value);
  }
  discount = Math.min(discount, Number(subtotal));
  return { valid: true, discount: Math.round(discount * 100) / 100, coupon, message: 'Applied' };
}
