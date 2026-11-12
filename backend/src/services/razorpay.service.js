import crypto from 'crypto';

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

export async function createRazorpayOrder(amountInr, receipt, notes = {}) {
  const creds = getRazorpay();
  if (!creds) throw new Error('Razorpay is not configured');
  const amountPaise = Math.round(Number(amountInr) * 100);
  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || 'Failed to create Razorpay order');
  return data;
}
