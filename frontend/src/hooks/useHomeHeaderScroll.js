import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_THRESHOLD = 20;

export function useHomeHeaderScroll() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(() => window.scrollY > SCROLL_THRESHOLD);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
  }, [pathname]);

  const heroOverlay = isHome && !scrolled;
  return { isHome, scrolled, heroOverlay };
}
