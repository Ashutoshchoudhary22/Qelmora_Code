import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { formatInr } from '../lib/money';

function CartContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api.get('/cart')).data,
  });

  const updateQty = useMutation({
    mutationFn: ({ id, quantity }) => api.patch(`/cart/items/${id}`, { quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['cart-summary'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: (id) => api.delete(`/cart/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['cart-summary'] });
    },
  });

  const applyCoupon = useMutation({
    mutationFn: (code) => api.post('/cart/coupon', { code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (isLoading) return <p className="text-stone-500">Loading bag…</p>;

  const items = data?.items || [];

  if (!items.length) {
    return (
      <>
        <p className="text-stone-400">Your bag is empty.</p>
        <Link to="/shop/new-arrivals" className="btn-primary mt-8 inline-flex">
          Continue shopping
        </Link>
      </>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-white/10">
        {items.map((item) => (
          <li key={item.id} className="flex gap-5 py-6">
            <div className="h-32 w-24 shrink-0 overflow-hidden bg-[#1a1816]">
              {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link to={`/product/${item.slug}`} className="font-medium text-stone-100">
                  {item.name}
                </Link>
                <p className="mt-1 text-xs text-stone-500">
                  {item.size} / {item.color}
                </p>
                <p className="mt-2 text-sm">{formatInr(item.price)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="inline-flex border border-white/15 text-sm">
                  <button type="button" className="px-3" onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })} disabled={item.quantity <= 1}>
                    −
                  </button>
                  <span className="px-3 py-1">{item.quantity}</span>
                  <button type="button" className="px-3" onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })} disabled={item.quantity >= 10}>
                    +
                  </button>
                </div>
                <button type="button" className="text-xs uppercase tracking-widest text-stone-500 hover:text-q-accent" onClick={() => removeItem.mutate(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="border border-white/10 bg-[#0e0e0e] p-6">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Summary</h2>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between text-stone-400">
            <span>Subtotal</span>
            <span>{formatInr(data.subtotal)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between text-q-accent">
              <span>Discount</span>
              <span>−{formatInr(data.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-4 text-base text-stone-100">
            <span>Total</span>
            <span>{formatInr(data.total)}</span>
          </div>
        </div>
        <CouponForm onApply={(code) => applyCoupon.mutate(code)} message={applyCoupon.error?.response?.data?.message} />
        <Link to="/checkout" className="btn-primary btn-accent mt-8 flex w-full justify-center">
          Checkout
        </Link>
      </aside>
    </div>
  );
}

function CouponForm({ onApply, message }) {
  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onApply(fd.get('code'));
      }}
    >
      <input name="code" placeholder="Coupon code" className="input-field flex-1 text-xs" />
      <button type="submit" className="btn-primary px-4 py-2 text-[10px]">
        Apply
      </button>
      {message && <p className="col-span-2 text-xs text-red-400">{message}</p>}
    </form>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <h1 className="font-display text-4xl font-light">Shopping bag</h1>
        <p className="mt-2 text-sm text-stone-500">Pieces reserved at checkout — stock is live.</p>
        <div className="mt-10">
          <CartContent />
        </div>
      </main>
    </ProtectedRoute>
  );
}
