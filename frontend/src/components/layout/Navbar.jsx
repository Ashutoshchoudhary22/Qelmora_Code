import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Moon, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCartDrawer } from '../../context/CartDrawerContext';
import { useCartCount } from '../../hooks/useCartCount';

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop/men', label: 'Men' },
  { to: '/shop/women', label: 'Women' },
  { to: '/shop/new-arrivals', label: 'New Arrivals' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

function AccountMenu({ onNavigate }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const itemClass =
    'block w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100 hover:text-stone-900';

  if (!user) {
    return (
      <Link
        to="/login"
        onClick={onNavigate}
        className="hidden text-stone-300 transition hover:text-white sm:block"
        aria-label="Sign in"
      >
        <User size={18} strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="text-stone-300 transition hover:text-white"
        aria-label="Account menu"
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <User size={18} strokeWidth={1.5} />
      </button>
      {menuOpen && (
        <div
          className="account-menu-dropdown absolute right-0 top-[calc(100%+0.65rem)] z-50 min-w-[11.5rem] overflow-hidden rounded-md border border-stone-200 bg-white py-1 shadow-xl"
          role="menu"
        >
          <p className="truncate border-b border-stone-100 px-4 py-2 text-[10px] text-stone-500">{user.email}</p>
          <Link to="/account" role="menuitem" className={itemClass} onClick={() => { setMenuOpen(false); onNavigate?.(); }}>
            My profile
          </Link>
          <Link to="/account/orders" role="menuitem" className={itemClass} onClick={() => { setMenuOpen(false); onNavigate?.(); }}>
            Orders
          </Link>
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} border-t border-stone-100 text-stone-600`}
            onClick={() => {
              setMenuOpen(false);
              logout();
              onNavigate?.();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar({ heroOverlay = false, inHomeShell = false }) {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { openCart } = useCartDrawer();
  const { data: cart } = useCartCount();
  const count = cart?.itemCount || 0;
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`site-header z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        heroOverlay
          ? 'site-header-hero border-b-0 bg-transparent backdrop-blur-none'
          : inHomeShell
            ? 'border-b-0 bg-transparent backdrop-blur-none'
            : 'sticky top-0 border-b-0 bg-black/80 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link to="/" className="font-display text-2xl font-medium tracking-[0.28em] text-stone-50 md:text-[1.65rem]">
          QELMORA
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-[10px] uppercase tracking-[0.22em] transition ${isActive ? 'text-q-accent' : 'text-stone-400 hover:text-stone-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <button
            type="button"
            onClick={toggleTheme}
            className="text-stone-200 transition hover:text-white"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
          <AccountMenu />
          <button
            type="button"
            onClick={openCart}
            className="relative text-stone-200 transition hover:text-white"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-q-accent px-1 text-[9px] font-semibold text-black">
                {count}
              </span>
            )}
          </button>
          {isAdmin && (
            <Link to="/admin" className="hidden text-[10px] uppercase tracking-widest text-q-accent md:block">
              Admin
            </Link>
          )}
          <button type="button" className="text-stone-200 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="site-mobile-nav border-t-0 bg-[#0a0a0a] px-5 py-6 lg:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-[0.25em] text-stone-300"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-q-accent">
                  My profile
                </Link>
                <Link to="/account/orders" onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-stone-300">
                  Orders
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="text-left text-xs uppercase tracking-widest text-stone-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-q-accent">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
