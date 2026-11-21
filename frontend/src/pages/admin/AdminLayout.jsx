import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Crown,
  FileText,
  Instagram,
  Image,
  Images,
  Tag,
  User,
  LayoutGrid,
  Mail,
  Sparkles,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PanelBottom,
  Package,
  ShoppingBag,
  Sun,
  X,
} from 'lucide-react';
import { AdminRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/admin/home-shop-by-category', label: 'Shop by category', icon: Images, end: false },
  { to: '/admin/nowhere-else', label: 'Nowhere Else', icon: Sparkles, end: false },
  { to: '/admin/categories', label: 'Category media', icon: Images, end: false },
  { to: '/admin/shop-offers', label: 'Shop offers', icon: Tag, end: false },
  { to: '/admin/trending-categories', label: 'Trending categories', icon: LayoutGrid, end: false },
  { to: '/admin/static-pages', label: 'About & Contact', icon: FileText, end: false },
  { to: '/admin/contact-inbox', label: 'Contact inbox', icon: Mail, end: false },
  { to: '/admin/login-banner', label: 'Login banner', icon: LogIn, end: false },
  { to: '/admin/site-footer', label: 'Bands & footer', icon: PanelBottom, end: false },
  { to: '/admin/account-hero', label: 'Account page', icon: User, end: false },
  { to: '/admin/brand-story', label: 'Brand story', icon: BookOpen, end: false },
  { to: '/admin/instagram', label: 'Instagram', icon: Instagram, end: false },
  { to: '/admin/banners', label: 'Banners & media', icon: Image, end: false },
];

function userInitial(name, email) {
  const src = (name || email || 'A').trim();
  return src.charAt(0).toUpperCase();
}

function SidebarNav({ onNavigate }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const onProducts = location.pathname.startsWith('/admin/products');
  const [productsOpen, setProductsOpen] = useState(onProducts);

  useEffect(() => {
    if (onProducts) setProductsOpen(true);
  }, [onProducts]);

  return (
    <div className="admin-sidebar-inner flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="admin-sidebar-head shrink-0 px-5 py-5">
        <Link to="/" className="admin-sidebar-brand flex items-center gap-3" onClick={onNavigate}>
          <span className="admin-sidebar-crown">
            <Crown size={22} strokeWidth={1.5} />
          </span>
          <span>
            <span className="admin-brand font-display block text-[1.05rem] tracking-[0.22em]">QELMORA</span>
            <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.38em] text-q-accent">
              Admin panel
            </span>
          </span>
        </Link>
      </div>

      <nav className="admin-sidebar-nav min-h-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto px-3 py-2">
        <NavLink
          to="/admin"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `admin-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive ? 'admin-nav-link-active' : ''}`
          }
        >
          <LayoutDashboard size={18} strokeWidth={1.65} className="admin-nav-icon shrink-0" />
          <span className="admin-nav-label">Dashboard</span>
        </NavLink>

        <div className="py-0.5">
          <button
            type="button"
            className="admin-nav-group-toggle"
            onClick={() => setProductsOpen((v) => !v)}
            aria-expanded={productsOpen}
          >
            <Package size={18} strokeWidth={1.65} className="admin-nav-icon shrink-0" />
            <span className="admin-nav-label flex-1">Products</span>
            <ChevronDown
              size={15}
              className={`shrink-0 text-stone-500 transition ${productsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {productsOpen && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink
                to="/admin/products"
                end
                onClick={onNavigate}
                className={({ isActive }) => `admin-nav-sublink ${isActive ? 'is-active' : ''}`}
              >
                All products
              </NavLink>
              <NavLink
                to="/admin/products/new"
                onClick={onNavigate}
                className={({ isActive }) => `admin-nav-sublink ${isActive ? 'is-active' : ''}`}
              >
                Add product
              </NavLink>
            </div>
          )}
        </div>

        {links.slice(1).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `admin-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive ? 'admin-nav-link-active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={1.65} className="admin-nav-icon shrink-0" />
            <span className="admin-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-foot relative z-[1] shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="admin-user-avatar">{userInitial(user?.name, user?.email)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-100">{user?.name || 'Admin'}</p>
            <p className="admin-muted-dim truncate text-[11px]">{user?.email}</p>
          </div>
        </div>
        <div className="my-3 h-px bg-white/10" />
        <Link
          to="/account"
          className="admin-sidebar-foot-link block py-2 uppercase transition"
          onClick={onNavigate}
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={logout}
          className="admin-sidebar-foot-link flex w-full items-center gap-2 py-2 text-left uppercase transition"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDashboard = /^\/admin\/?$/.test(location.pathname);

  return (
    <AdminRoute>
      <>
      <div className="admin-shell admin-canvas admin-shell-grid h-screen max-h-[100dvh] overflow-hidden bg-[#080808] text-stone-100">
        <aside className="admin-sidebar admin-sidebar-premium hidden min-h-0 overflow-hidden border-r border-white/10 bg-[#0c0c0c] lg:flex lg:h-[100dvh] lg:w-full lg:flex-col lg:sticky lg:top-0">
          <SidebarNav />
        </aside>

        <div className="admin-shell-main flex min-h-0 min-w-0 flex-col">
          <header className="admin-topbar admin-topbar-premium flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur lg:px-6">
            <button
              type="button"
              className="text-stone-300 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <p className="admin-topbar-hint hidden flex-1 text-[9px] uppercase tracking-[0.34em] text-stone-500 sm:block">
              Uploads <span className="mx-1.5 text-stone-600">›</span> Cloudinary
              <span className="mx-2 text-stone-500">·</span>
              Preview &amp; download below
            </p>
            <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
              <button
                type="button"
                className="admin-topbar-bell border border-white/10 p-2 text-stone-400 transition hover:border-q-accent/35 hover:text-q-accent"
                aria-label="Notifications"
              >
                <Bell size={17} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="admin-theme-toggle inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest transition hover:border-q-accent/40"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </header>
          <main
            className={`admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${isDashboard ? 'admin-main--dashboard' : 'admin-main--page'}`}
          >
            <div className="admin-main-inner admin-main-inner--fill">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-sidebar admin-sidebar-premium relative flex h-full w-[min(100%,18.5rem)] flex-col overflow-hidden bg-[#0c0c0c] shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-4 z-10 text-stone-400"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
      </>
    </AdminRoute>
  );
}