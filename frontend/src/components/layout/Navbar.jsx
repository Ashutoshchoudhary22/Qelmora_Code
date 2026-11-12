import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartCount } from '../../hooks/useCartCount';

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop/men', label: 'Men' },
  { to: '/shop/women', label: 'Women' },
  { to: '/shop/unisex', label: 'Unisex' },
  { to: '/shop/new-arrivals', label: 'New Arrivals' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { data: cart } = useCartCount();
  const count = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
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
          <Link
            to={user ? '/account' : '/login'}
            className="hidden text-stone-300 transition hover:text-white sm:block"
            aria-label="Account"
          >
            <User size={18} strokeWidth={1.5} />
          </Link>
          <Link to="/cart" className="relative text-stone-200 transition hover:text-white" aria-label="Cart">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-q-accent px-1 text-[9px] font-semibold text-black">
                {count}
              </span>
            )}
          </Link>
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
        <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-6 lg:hidden">
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
            <Link to={user ? '/account' : '/login'} onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-q-accent">
              {user ? 'My account' : 'Sign in'}
            </Link>
            {user && (
              <button type="button" onClick={logout} className="text-left text-xs uppercase tracking-widest text-stone-500">
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
