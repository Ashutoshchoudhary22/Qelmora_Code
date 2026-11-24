import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useHomeHeaderScroll } from '../../hooks/useHomeHeaderScroll';
import { useSiteHeaderBand } from '../../lib/useSiteHeaderBand';
import { CartDrawer } from '../cart/CartDrawer';
import { CartDrawerProvider } from '../../context/CartDrawerContext';
import { RouteSeo } from '../RouteSeo';
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
  const { bgUrl: headerBgUrl, hasCustomBg: hasHeaderBg } = useSiteHeaderBand();
  const showHomeHeaderBg = hasHeaderBg && !heroOverlay;

  return (
    <CartDrawerProvider>
    <div className="min-h-screen bg-q-black text-stone-100">
      <RouteSeo />
      <ScrollToTop />
      {isHome ? (
        <div
          className={`site-home-header-shell fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
            heroOverlay
              ? 'bg-transparent shadow-none'
              : showHomeHeaderBg
                ? 'bg-transparent shadow-none'
                : 'site-header-scrolled-shell bg-black/85 shadow-sm backdrop-blur-xl'
          }`}
        >
          <Navbar
            heroOverlay={heroOverlay}
            inHomeShell
            headerBgUrl={headerBgUrl}
            hasHeaderBg={hasHeaderBg}
          />
        </div>
      ) : (
        <Navbar heroOverlay={false} headerBgUrl={headerBgUrl} hasHeaderBg={hasHeaderBg} />
      )}
      <Outlet />
      <Footer />
      <CartDrawer />
    </div>
    </CartDrawerProvider>
  );
}
