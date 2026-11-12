import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useHomeHeaderScroll } from '../../hooks/useHomeHeaderScroll';
import { CartDrawer } from '../cart/CartDrawer';
import { CartDrawerProvider } from '../../context/CartDrawerContext';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function SiteLayout() {
  const { isHome, heroOverlay } = useHomeHeaderScroll();

  return (
    <CartDrawerProvider>
    <div className="min-h-screen bg-q-black text-stone-100">
      <ScrollToTop />
      {isHome ? (
        <div
          className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
            heroOverlay ? 'bg-transparent shadow-none' : 'site-header-scrolled-shell bg-black/85 shadow-sm backdrop-blur-xl'
          }`}
        >
          <Navbar heroOverlay={heroOverlay} inHomeShell />
        </div>
      ) : (
        <Navbar heroOverlay={false} />
      )}
      <Outlet />
      <Footer />
      <CartDrawer />
    </div>
    </CartDrawerProvider>
  );
}
