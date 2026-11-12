import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
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
  return (
    <div className="min-h-screen bg-q-black text-stone-100">
      <ScrollToTop />
      <AnnouncementBar />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
