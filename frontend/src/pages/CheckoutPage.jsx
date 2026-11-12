import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { formatInr } from '../lib/money';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function CheckoutForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [addressId, setAddressId] = useState('');
  const [error, setError] = useState('');

  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: async () => (await api.get('/cart')).data });
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/addresses')).data,
  });

  const placeCod = useMutation({
    mutationFn: () => api.post('/orders', { addressId: Number(addressId), paymentMethod: 'cod' }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['cart-summary'] });
      navigate(`/account/orders/${data.orderNumber}`);
    },
    onError: (e) => setError(e.response?.data?.message || 'Checkout failed'),
  });

  async function payOnline() {
    setError('');
    try {
      const { data: orderData } = await api.post('/payments/razorpay/create-order', {
        addressId: Number(addressId),
      });
      const { data: keyData } = await api.get('/payments/razorpay-key');
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load Razorpay');

      const rzp = new window.Razorpay({
        key: keyData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency,
        name: 'QELMORA',
        description: `Order ${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          await api.post('/payments/razorpay/verify', {
            orderId: orderData.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          qc.invalidateQueries({ queryKey: ['cart'] });
          navigate(`/account/orders/${orderData.orderNumber}`);
        },
        theme: { color: '#e8954a' },
      });
      rzp.on('payment.failed', () => setError('Payment failed. Your order remains pending.'));
      rzp.open();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Online payment unavailable');
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!addressId) return setError('Select a delivery address');
    if (paymentMethod === 'cod') placeCod.mutate();
    else payOnline();
  }

  const items = addresses?.items || [];

  return (
    <form onSubmit={submit} className="grid gap-12 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-stone-500">Delivery address</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-stone-400">
              Add an address in <a href="/account" className="text-q-accent underline">My Account</a> first.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 border p-4 ${String(addressId) === String(a.id) ? 'border-q-accent' : 'border-white/10'}`}
                >
                  <input type="radio" name="addr" value={a.id} checked={String(addressId) === String(a.id)} onChange={() => setAddressId(String(a.id))} />
                  <div className="text-sm text-stone-300">
                    <p className="font-medium text-stone-100">{a.fullName}</p>
                    <p className="mt-1 text-stone-500">
                      {a.line1}, {a.city}, {a.state} {a.postalCode}
                    </p>
                    <p className="text-stone-500">{a.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-stone-500">Payment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={`border p-4 text-sm ${paymentMethod === 'cod' ? 'border-q-accent' : 'border-white/10'}`}>
              <input type="radio" className="mr-2" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              Cash on delivery
            </label>
            <label className={`border p-4 text-sm ${paymentMethod === 'online' ? 'border-q-accent' : 'border-white/10'}`}>
              <input type="radio" className="mr-2" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
              Razorpay (UPI / Card)
            </label>
          </div>
        </section>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <aside className="border border-white/10 bg-[#0e0e0e] p-6 h-fit">
        <h2 className="text-[10px] uppercase tracking-widest text-stone-500">Order total</h2>
        <p className="mt-4 text-3xl text-stone-100">{formatInr(cart?.total || 0)}</p>
        <p className="mt-2 text-xs text-stone-500">{cart?.itemCount || 0} items</p>
        <button type="submit" disabled={placeCod.isPending} className="btn-primary btn-accent mt-8 w-full disabled:opacity-50">
          Place order
        </button>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <h1 className="font-display text-4xl font-light">Checkout</h1>
        <div className="mt-10">
          <CheckoutForm />
        </div>
      </main>
    </ProtectedRoute>
  );
}
