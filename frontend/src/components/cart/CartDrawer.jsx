import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCartDrawer } from '../../context/CartDrawerContext';
import { useCartCount } from '../../hooks/useCartCount';
import { CartPanel } from './CartPanel';

export function CartDrawer() {
  const { open, closeCart } = useCartDrawer();
  const { data: cartSummary } = useCartCount();
  const count = cartSummary?.itemCount || 0;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, closeCart]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close cart"
        onClick={closeCart}
      />
      <aside
        className="cart-drawer-panel absolute inset-y-0 right-0 flex h-full w-full max-w-[min(100vw,28rem)] flex-col bg-white text-stone-900 shadow-2xl"
        style={{ animation: 'cartDrawerIn 0.32s ease-out' }}
      >
        <header className="shrink-0 border-b border-stone-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">
              Cart{count > 0 ? ` · ${count}` : ''}
            </h2>
            <button
              type="button"
              onClick={closeCart}
              className="rounded p-1 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              aria-label="Close"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-3 bg-stone-900 px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-white">
            Payments are securely processed in Indian Rupees (INR)
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CartPanel compact onClose={closeCart} />
        </div>
      </aside>
    </div>
  );
}
