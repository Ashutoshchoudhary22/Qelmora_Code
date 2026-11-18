import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Coins,
  Image,
  LayoutGrid,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatInr } from '../../lib/money';

function formatOrderDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function orderStatusLabel(order) {
  const s = order.orderStatus;
  if (s === 'delivered') return { text: 'Completed', tone: 'success' };
  if (s === 'cancelled') return { text: 'Cancelled', tone: 'muted' };
  if (s === 'shipped' || s === 'packed') return { text: 'Shipped', tone: 'info' };
  if (order.paymentStatus === 'paid' || s === 'confirmed') return { text: 'Completed', tone: 'success' };
  return { text: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Placed', tone: 'info' };
}

function formatTrend(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  const n = Number(pct);
  const sign = n > 0 ? '+' : '';
  const tone = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return { text: `${sign}${n.toFixed(1)}%`, tone };
}

const QUICK_ACTIONS = [
  { to: '/admin/products/new', label: 'Add Product', icon: Package },
  { to: '/admin/orders', label: 'Manage Orders', icon: ShoppingBag },
  { to: '/admin/categories', label: 'Add Category', icon: LayoutGrid },
  { to: '/admin/banners', label: 'Upload Media', icon: Image },
];

/** Local admin hero (public/profile) — replaces Cloudinary promo/collection banners */
const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data,
  });

  if (isLoading) {
    return (
      <div className="admin-dashboard-page px-2 py-10">
        <p className="text-stone-500">Loading dashboard…</p>
      </div>
    );
  }

  const trends = data?.trends || {};
  const cards = [
    { label: 'Revenue', value: formatInr(data?.revenue), featured: true, trend: trends.revenue, icon: Coins },
    { label: 'Orders', value: data?.totalOrders ?? 0, trend: trends.orders, icon: ShoppingBag },
    { label: 'Customers', value: data?.totalCustomers ?? 0, trend: trends.customers, icon: Users },
    { label: 'Products', value: data?.totalProducts ?? 0, trend: trends.products, icon: Package },
  ];

  const recentOrders = data?.recentOrders || [];

  return (
    <div className="admin-dashboard-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div
          className="admin-welcome-band-bg"
          style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }}
        />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-welcome-band-inner--qelmora">
          <div>
            <h1 className="admin-dashboard-title font-display">Dashboard</h1>
            <p className="admin-dashboard-greeting mt-3">
              Welcome back, <strong className="font-semibold text-stone-900">{user?.name || 'Admin'}</strong>{' '}
              <span aria-hidden>👋</span>
            </p>
            <p className="mt-2 text-sm text-stone-600">Here&apos;s what&apos;s happening with your store today.</p>
          </div>
        </div>
      </header>

      <div className="admin-dashboard-body">
        <div className="admin-kpi-grid">
          {cards.map((c) => {
            const trend = formatTrend(c.trend);
            const Icon = c.icon;
            return (
              <article
                key={c.label}
                className={`admin-kpi-card ${c.featured ? 'admin-kpi-card--featured' : ''}`}
              >
                <div className="admin-kpi-waves" aria-hidden />
                <div className="admin-kpi-card-content">
                  <span className="admin-kpi-icon-wrap">
                    <Icon size={20} strokeWidth={1.65} />
                  </span>
                  <p className="admin-kpi-label">{c.label}</p>
                  <p className="admin-kpi-value">{c.value}</p>
                  {trend && (
                    <span
                      className={`admin-kpi-trend admin-kpi-trend--${trend.tone} ${c.featured ? 'admin-kpi-trend--on-dark' : ''}`}
                    >
                      {trend.tone === 'up' && <TrendingUp size={11} strokeWidth={2.5} />}
                      {trend.text}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="admin-dashboard-lower">
          <section className="admin-panel-card admin-recent-orders-card">
            <div className="admin-panel-card-head admin-panel-card-head--luxury">
              <div className="flex items-center gap-3">
                <span className="admin-section-icon admin-section-icon--light">
                  <ShoppingBag size={18} strokeWidth={1.65} />
                </span>
                <h2 className="admin-panel-card-title font-display">Recent Orders</h2>
              </div>
              <Link to="/admin/orders" className="admin-link-gold inline-flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="admin-orders-table-shell">
              <div className="overflow-x-auto">
                <table className="admin-orders-table w-full min-w-[640px] text-left">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr className="admin-orders-row">
                        <td colSpan={5} className="py-10 text-center text-stone-500">
                          No orders yet.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => {
                        const status = orderStatusLabel(o);
                        return (
                          <tr key={o.orderNumber} className="admin-orders-row">
                            <td className="font-medium text-stone-800">{o.orderNumber}</td>
                            <td className="text-stone-600">{formatOrderDate(o.createdAt)}</td>
                            <td className="text-stone-600">{o.customerName || o.customerEmail || '—'}</td>
                            <td className="font-semibold text-stone-900">{formatInr(o.total)}</td>
                            <td>
                              <span className={`admin-status-pill admin-status-pill--${status.tone}`}>
                                {status.tone === 'success' && <Check size={12} strokeWidth={2.5} />}
                                {status.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="admin-quick-actions">
            <div className="admin-quick-actions-head">
              <span className="admin-section-icon admin-section-icon--dark">
                <Zap size={17} strokeWidth={1.75} />
              </span>
              <h2 className="admin-panel-card-title admin-panel-card-title--on-dark font-display">Quick Actions</h2>
            </div>
            <div className="admin-quick-actions-grid">
              {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="admin-quick-action-btn">
                  <Icon size={22} strokeWidth={1.5} className="text-q-accent" />
                  <span className="admin-quick-action-label">{label}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}