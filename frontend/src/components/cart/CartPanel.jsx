import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatInr } from '../../lib/money';

export function CartPanel({ onClose, compact = false }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated, booting } = useAuth();
  const premium = compact;

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

  const pad = premium ? 'cart-drawer-pad' : '';

  if (!isAuthenticated && !booting) {
    return (
      <div className={pad}>
        <p className="text-sm text-stone-600">Sign in to view your bag.</p>
        <Link to="/login" onClick={onClose} className="cart-drawer-btn-checkout mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  if (booting || isLoading) {
    return <p className={`text-sm text-stone-500 ${premium ? 'cart-drawer-pad py-10' : 'px-6 py-10'}`}>Loading bag…</p>;
  }

  if (isError) {
    return (
      <p className={`text-sm text-red-600 ${premium ? 'cart-drawer-pad py-8' : 'px-6 py-8'}`}>
        Could not load cart. Try signing in again.
      </p>
    );
  }

  const items = data?.items || [];
  const itemCount = data?.itemCount || 0;

  if (!items.length) {
    return (
      <div className={pad}>
        <p className="text-sm text-stone-600">Your bag is empty.</p>
        <Link to="/shop/men" onClick={onClose} className="cart-drawer-btn-outline mt-6 inline-flex w-full justify-center">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className={`cart-drawer-items flex-1 overflow-y-auto ${premium ? 'cart-drawer-pad-x' : 'px-5'}`}>
        {items.map((item) => (
          <li key={item.id} className={premium ? 'cart-drawer-item-card' : 'flex gap-4 border-b border-stone-200 py-5'}>
            {premium ? (
              <div className="cart-drawer-item-inner">
                <Link to={`/product/${item.slug}`} onClick={onClose} className="cart-drawer-item-thumb">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-stone-400">No img</span>
                  )}
                </Link>
                <div className="cart-drawer-item-body">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/product/${item.slug}`} onClick={onClose} className="cart-drawer-item-name">
                      {item.name}
                    </Link>
                    <p className="cart-drawer-item-price">{formatInr(item.price)}</p>
                  </div>
                  <p className="cart-drawer-item-variant">
                    {item.color} / {item.size}
                  </p>
                  <div className="cart-drawer-item-actions">
                    <div className="cart-drawer-qty">
                      <button
                        type="button"
                        onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                        disabled={item.quantity <= 1 || updateQty.isPending}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                        disabled={item.quantity >= 10 || updateQty.isPending}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-drawer-remove"
                      onClick={() => removeItem.mutate(item.id)}
                      disabled={removeItem.isPending}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to={`/product/${item.slug}`} onClick={onClose} className="h-[88px] w-[72px] shrink-0 overflow-hidden bg-stone-100">
                  {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{item.name}</p>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <footer className={`cart-drawer-footer shrink-0 ${premium ? 'cart-drawer-pad' : 'mt-6 border-t border-stone-200 px-5 pb-6 pt-4'}`}>
        <form
          className="cart-drawer-coupon"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            applyCoupon.mutate(fd.get('code'));
          }}
        >
          <input name="code" placeholder="Enter coupon code" className="cart-drawer-coupon-input" />
          <button type="submit" className="cart-drawer-btn-apply" disabled={applyCoupon.isPending}>
            Apply
          </button>
        </form>
        {applyCoupon.error?.response?.data?.message && (
          <p className="cart-drawer-msg-error">{applyCoupon.error.response.data.message}</p>
        )}
        {data.couponCode && (
          <p className="cart-drawer-msg-ok">
            Code <span className="font-semibold">{data.couponCode}</span> applied
          </p>
        )}

        <div className="cart-drawer-subtotal">
          <span>Subtotal</span>
          <span className="cart-drawer-subtotal-amt">{formatInr(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="cart-drawer-discount">
            <span>Includes discount</span>
            <span>−{formatInr(data.discount)}</span>
          </div>
        )}
        <p className="cart-drawer-checkout-note">Taxes, discounts and shipping calculated at checkout.</p>

        <p className="cart-drawer-trust">
          <ShieldCheck size={14} className="text-[#c9a227]" />
          Free shipping in India · Secured checkout
        </p>

        <button
          type="button"
          className="cart-drawer-btn-checkout"
          onClick={() => {
            onClose?.();
            navigate('/checkout');
          }}
        >
          <Lock size={16} strokeWidth={1.75} />
          <span className="flex-1 text-left">Complete Order</span>
          <span className="font-semibold">{formatInr(data.total)}</span>
          <ArrowRight size={18} strokeWidth={1.75} />
        </button>
        {!compact && itemCount > 0 && <p className="mt-3 text-center text-xs text-stone-500">{itemCount} item(s) in bag</p>}
      </footer>
    </div>
  );
}