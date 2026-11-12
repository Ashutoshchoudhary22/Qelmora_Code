import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatInr } from '../../lib/money';

export function CartPanel({ onClose, compact = false }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated, booting } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api.get('/cart')).data,
    enabled: isAuthenticated && !booting,
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
    mutationFn: (code) => api.post('/cart/coupon', { code: String(code || '').trim() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (!isAuthenticated && !booting) {
    return (
      <div className={compact ? 'px-6 py-8' : ''}>
        <p className="text-sm text-stone-600">Sign in to view your bag.</p>
        <Link
          to="/login"
          onClick={onClose}
          className="mt-6 inline-flex w-full items-center justify-center bg-stone-900 px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (booting || isLoading) {
    return <p className={`text-sm text-stone-500 ${compact ? 'px-6 py-10' : ''}`}>Loading bag…</p>;
  }

  if (isError) {
    return (
      <p className={`text-sm text-red-600 ${compact ? 'px-6 py-8' : ''}`}>
        Could not load cart. Try signing in again.
      </p>
    );
  }

  const items = data?.items || [];
  const itemCount = data?.itemCount || 0;

  if (!items.length) {
    return (
      <div className={compact ? 'px-6 py-8' : ''}>
        <p className="text-sm text-stone-600">Your bag is empty.</p>
        <Link
          to="/shop/new-arrivals"
          onClick={onClose}
          className="mt-6 inline-flex w-full items-center justify-center border border-stone-900 px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-stone-900"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${compact ? '' : ''}`}>
      <ul className={`flex-1 overflow-y-auto ${compact ? 'px-5' : ''}`}>
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b border-stone-200 py-5">
            <Link
              to={`/product/${item.slug}`}
              onClick={onClose}
              className="h-[88px] w-[72px] shrink-0 overflow-hidden bg-stone-100"
            >
              {item.image ? (
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-stone-400">No img</div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/product/${item.slug}`}
                    onClick={onClose}
                    className="font-medium leading-snug text-stone-900 hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.color} / {item.size}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-stone-900">{formatInr(item.price)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center border border-stone-300 text-sm text-stone-900">
                  <button
                    type="button"
                    className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                    onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1 || updateQty.isPending}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] px-2 py-1.5 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                    onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    disabled={item.quantity >= 10 || updateQty.isPending}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-stone-500 transition hover:text-red-600"
                  onClick={() => removeItem.mutate(item.id)}
                  disabled={removeItem.isPending}
                  aria-label="Remove item"
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className={`shrink-0 border-t border-stone-200 bg-white ${compact ? 'px-5 pb-6 pt-4' : 'mt-6'}`}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            applyCoupon.mutate(fd.get('code'));
          }}
        >
          <input
            name="code"
            placeholder="Enter coupon code"
            className="min-w-0 flex-1 border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400"
          />
          <button
            type="submit"
            className="shrink-0 bg-stone-900 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white"
            disabled={applyCoupon.isPending}
          >
            Apply
          </button>
        </form>
        {applyCoupon.error?.response?.data?.message && (
          <p className="mt-2 text-xs text-red-600">{applyCoupon.error.response.data.message}</p>
        )}
        {data.couponCode && (
          <p className="mt-2 text-xs text-stone-600">
            Code <span className="font-medium">{data.couponCode}</span> applied
          </p>
        )}

        <div className="mt-4 flex justify-between text-sm text-stone-800">
          <span>Subtotal</span>
          <span className="font-medium">{formatInr(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="mt-1 flex justify-between text-xs text-emerald-700">
            <span>Includes discount</span>
            <span>−{formatInr(data.discount)}</span>
          </div>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
          Taxes, discounts and shipping calculated at checkout.
        </p>
        <p className="mt-3 bg-stone-100 py-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-stone-600">
          Free shipping in India · Secured checkout
        </p>
        <button
          type="button"
          className="mt-4 w-full bg-stone-900 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-stone-800"
          onClick={() => {
            onClose?.();
            navigate('/checkout');
          }}
        >
          Complete order · {formatInr(data.total)}
        </button>
        {!compact && itemCount > 0 && (
          <p className="mt-3 text-center text-xs text-stone-500">{itemCount} item(s) in bag</p>
        )}
      </div>
    </div>
  );
}
