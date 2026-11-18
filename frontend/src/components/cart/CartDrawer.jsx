import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, X } from 'lucide-react';
import { useCartDrawer } from '../../context/CartDrawerContext';
import { CartPanel } from './CartPanel';

const CART_DRAWER_SILK = '/profile/QELMORA-admin.png';

export function CartDrawer() {
  const { open, closeCart } = useCartDrawer();

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
        className="cart-drawer-panel cart-drawer-panel--premium absolute inset-y-0 right-0 flex h-full w-full max-w-[min(100vw,28rem)] flex-col shadow-2xl"
        style={{ animation: 'cartDrawerIn 0.32s ease-out' }}
      >
        <div className="cart-drawer-silk" style={{ backgroundImage: `url(${CART_DRAWER_SILK})` }} aria-hidden />
        <div className="cart-drawer-silk-scrim" aria-hidden />

        <header className="cart-drawer-header relative z-[1] shrink-0">
          <Link to="/" onClick={closeCart} className="cart-drawer-logo font-display">
            QELMORA
          </Link>
          <div className="cart-drawer-title cart-drawer-title--center">
            <ShoppingBag size={20} strokeWidth={1.5} className="text-[#b8860b]" />
            <h2>Your Cart</h2>
          </div>
          <button type="button" onClick={closeCart} className="cart-drawer-close" aria-label="Close">
            <X size={22} strokeWidth={1.5} />
          </button>
        </header>

        <h3 className="cart-drawer-ship-banner relative z-[1]">
          <Truck size={16} strokeWidth={1.75} />
          Free Shipping on all prepaid orders in India
        </h3>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
          <CartPanel compact onClose={closeCart} />
        </div>
      </aside>
    </div>
  );
}