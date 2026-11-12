import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ExternalLink,
  BookOpen,
  FileText,
  Instagram,
  Image,
  Images,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
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
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/admin/categories', label: 'Collections', icon: Images, end: false },
  { to: '/admin/static-pages', label: 'About & Contact', icon: FileText, end: false },
  { to: '/admin/login-banner', label: 'Login banner', icon: LogIn, end: false },
  { to: '/admin/brand-story', label: 'Brand story', icon: BookOpen, end: false },
  { to: '/admin/instagram', label: 'Instagram', icon: Instagram, end: false },
  { to: '/admin/banners', label: 'Banners & media', icon: Image, end: false },
];

function SidebarNav({ onNavigate }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="admin-sidebar-head shrink-0 border-b border-white/10 px-5 py-4">
        <Link to="/" className="admin-brand font-display text-xl tracking-[0.22em]">
          QELMORA
        </Link>
        <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-q-accent">Admin studio</p>
      </div>

      <nav className="admin-sidebar-nav min-h-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto px-3 py-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `admin-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'admin-nav-link-active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={1.5} className="shrink-0 opacity-80" />
            <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-foot shrink-0 border-t border-white/10 p-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="admin-theme-toggle mb-4 flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-[10px] uppercase tracking-widest transition hover:border-q-accent/40"
        >
          <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <p className="admin-muted truncate text-xs">{user?.name || 'Admin'}</p>
        <p className="admin-muted-dim truncate text-[10px]">{user?.email}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent"
          >
            <ExternalLink size={14} />
            View store
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-left text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-300"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <AdminRoute>
      <div className="admin-shell admin-canvas flex h-screen max-h-[100dvh] overflow-hidden bg-[#080808] text-stone-100">
        <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden h-[100dvh] w-64 flex flex-col overflow-hidden border-r border-white/10 bg-[#0c0c0c] lg:flex">
          <SidebarNav />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="admin-sidebar relative flex h-full w-[min(100%,17rem)] flex-col overflow-hidden bg-[#0c0c0c] shadow-2xl">
              <button
                type="button"
                className="absolute right-3 top-4 text-stone-400"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                <X size={22} />
              </button>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-64">
          <header className="admin-topbar flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur lg:px-8">
            <button
              type="button"
              className="text-stone-300 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <p className="admin-topbar-hint flex-1 text-[10px] uppercase tracking-[0.4em] text-stone-500">
              Uploads → Cloudinary · preview & download below
            </p>
            <button
              type="button"
              onClick={toggleTheme}
              className="admin-theme-toggle hidden shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest transition hover:border-q-accent/40 sm:inline-flex"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </header>
          <main className="admin-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-5xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
