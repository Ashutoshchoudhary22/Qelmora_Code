import { Link, Outlet } from 'react-router-dom';
import { AdminRoute } from '../../components/ProtectedRoute';

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/banners', label: 'Banners' },
];

export default function AdminLayout() {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#0a0a0a] text-stone-100">
        <header className="border-b border-white/10 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link to="/" className="font-display text-xl tracking-[0.2em]">
              QELMORA
            </Link>
            <span className="text-[10px] uppercase tracking-widest text-q-accent">Admin</span>
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[200px_1fr]">
          <nav className="flex flex-row gap-4 overflow-x-auto md:flex-col md:gap-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-xs uppercase tracking-widest text-stone-500 hover:text-q-accent">
                {l.label}
              </Link>
            ))}
          </nav>
          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
