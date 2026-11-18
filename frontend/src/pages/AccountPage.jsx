import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  Crown,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Pencil,
  RotateCcw,
  Shield,
  Truck,
  User,
} from 'lucide-react';
import { api } from '../api/client';
import { accountTileIcon } from '../lib/accountTileIcons';
import { AddressForm } from '../components/AddressForm';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { formatInr } from '../lib/money';

const navItems = [
  { to: '/account', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package, end: false },
  { to: '/account/addresses', label: 'My Addresses', icon: MapPin, end: false },
  { to: '/account/profile', label: 'My Profile', icon: User, end: false },
];

const FALLBACK_OVERVIEW_TILES = [
  {
    title: 'My Orders',
    description: 'View, modify and track orders',
    linkPath: '/account/orders',
    iconKey: 'package',
    tileKey: 'orders',
    imageUrl: null,
  },
  {
    title: 'My Addresses',
    description: 'Edit, add or remove addresses',
    linkPath: '/account/addresses',
    iconKey: 'map-pin',
    tileKey: 'addresses',
    imageUrl: null,
  },
  {
    title: 'My Profile',
    description: 'Edit personal info and account details',
    linkPath: '/account/profile',
    iconKey: 'user',
    tileKey: 'profile',
    imageUrl: null,
  },
  {
    title: 'Help & Support',
    description: 'Reach out to us',
    linkPath: '/contact',
    iconKey: 'headphones',
    tileKey: 'help',
    imageUrl: null,
  },
  {
    title: 'Our Story',
    description: 'The QELMORA chapter',
    linkPath: '/about',
    iconKey: 'book-open',
    tileKey: 'story',
    imageUrl: null,
  },
  {
    title: 'Nowhere Else',
    description: 'Exclusive collections',
    linkPath: '/collections',
    iconKey: 'sparkles',
    tileKey: 'collections',
    imageUrl: null,
  },
];

const trustItems = [
  { label: 'Free Shipping', icon: Truck },
  { label: 'Easy Returns', icon: RotateCcw },
  { label: 'Secure Payments', icon: Shield },
  { label: 'Premium Quality', icon: Award },
];

function AccountSidebarBrand() {
  return (
    <div className="account-sidebar-brand">
      <span className="account-sidebar-brand-icon" aria-hidden>
        <Crown size={18} strokeWidth={1.8} />
      </span>
      <h2>My Account</h2>
      <p>Manage your QELMORA experience</p>
    </div>
  );
}

function AccountTrustBar() {
  return (
    <div className="account-trust-bar">
      {trustItems.map(({ label, icon: Icon }) => (
        <div key={label} className="account-trust-item">
          <Icon size={18} strokeWidth={1.6} aria-hidden />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function AccountNav({ variant = 'all' }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const showMobile = variant === 'all' || variant === 'mobile';
  const showDesktop = variant === 'all' || variant === 'desktop';

  function handleLogout() {
    logout();
    navigate('/');
  }

  const linkClass = ({ isActive }) =>
    `account-nav-pill ${isActive ? 'account-nav-pill--active' : ''}`;

  return (
    <>
      {showMobile && (
        <nav className="account-nav-mobile flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'border-transparent bg-gradient-to-r from-q-accent to-[#c97a35] text-stone-950'
                    : 'border-stone-300/80 bg-white/80 text-stone-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      {showDesktop && (
        <nav className="account-nav-desktop flex flex-1 flex-col">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} strokeWidth={1.7} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="account-sidebar-logout">
            <button type="button" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.7} />
              Logout
            </button>
          </div>
        </nav>
      )}
    </>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="border-b border-stone-200 pb-5 dark:border-white/10">
      {eyebrow && <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">{eyebrow}</p>}
      <h2 className="font-display mt-1 text-2xl font-light text-stone-900 dark:text-stone-50 md:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500">{description}</p>}
    </div>
  );
}

function AccountSubpanel({ children }) {
  return (
    <div className="account-subpanel rounded-xl border border-stone-200 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-[#0c0c0c]/90">
      {children}
    </div>
  );
}

export function AccountLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isOverview = location.pathname === '/account' || location.pathname === '/account/';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <ProtectedRoute>
      <main className="account-dashboard-page">
        <div className="site-container pb-12 pt-5 md:pb-16 md:pt-6">
          <p className="account-breadcrumb text-sm">
            <Link to="/" className="transition hover:text-[#c97a35]">
              Home
            </Link>
            <span className="mx-2 text-stone-400">/</span>
            <strong>My Account</strong>
          </p>

          <div className="mt-5 grid gap-6 lg:mt-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-7">
            <aside className="account-sidebar-shell min-w-0">
              <div className="lg:hidden">
                <AccountNav variant="mobile" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 text-sm font-semibold text-red-500"
                >
                  Logout
                </button>
              </div>
              <div className="account-sidebar-shell-inner hidden lg:block">
                <span className="account-sidebar-glow account-sidebar-glow--tl" aria-hidden />
                <span className="account-sidebar-glow account-sidebar-glow--br" aria-hidden />
                <div className="account-sidebar-panel flex">
                  <AccountSidebarBrand />
                  <AccountNav variant="desktop" />
                </div>
              </div>
            </aside>

            <section className="account-dashboard-main min-w-0">
              {isOverview ? <Outlet /> : <AccountSubpanel><Outlet /></AccountSubpanel>}
            </section>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export function AccountOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });
  const { data: heroContent } = useQuery({
    queryKey: ['content', 'account_hero'],
    queryFn: async () => (await api.get('/content/account_hero')).data,
    retry: false,
  });
  const { data: tilesData } = useQuery({
    queryKey: ['account-overview-tiles'],
    queryFn: async () => (await api.get('/account-overview-tiles')).data,
  });
  const overviewTiles =
    tilesData?.items?.length > 0 ? tilesData.items : FALLBACK_OVERVIEW_TILES;
  const user = data?.user;
  const heroImageUrl = heroContent?.imageUrl || null;
  const name = user?.name?.trim() || 'Guest';
  const firstName = name.split(/\s+/)[0];
  const initial = name.charAt(0).toUpperCase();

  if (isLoading) {
    return <p className="text-stone-500">Loading your account…</p>;
  }

  return (
    <div>
      <div className="account-hero-card">
        {heroImageUrl && (
          <div
            className="account-hero-card-media"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
            aria-hidden
          />
        )}
        <div className="account-hero-card-scrim" aria-hidden />
        <div className="account-hero-inner">
          <div className="account-hero-content">
            <div className="flex items-start gap-4 md:gap-5">
              <div className="account-hero-avatar" aria-hidden>
                {initial}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="account-hero-greeting font-display text-2xl font-medium text-stone-900 md:text-[1.65rem] md:leading-tight">
                  Hello, {firstName} <span aria-hidden>👋</span>
                </p>
                {(user?.email || user?.phone) && (
                  <p className="account-hero-contact mt-2 flex flex-wrap items-center gap-x-2 text-sm text-stone-600">
                    {user?.email && <span className="truncate">{user.email}</span>}
                    {user?.email && user?.phone && (
                      <span className="text-stone-400" aria-hidden>
                        |
                      </span>
                    )}
                    {user?.phone && <span className="shrink-0 text-stone-600">{user.phone}</span>}
                  </p>
                )}
              </div>
            </div>
            <Link to="/account/profile" className="account-hero-edit">
              <Pencil size={15} strokeWidth={2} aria-hidden />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {overviewTiles.map((tile) => {
          const Icon = accountTileIcon(tile.iconKey);
          const key = tile.id ?? tile.title;
          return (
            <Link
              key={key}
              to={tile.linkPath}
              className="account-premium-tile"
              data-tile={tile.tileKey || undefined}
            >
              {tile.imageUrl && (
                <div
                  className="account-tile-watermark"
                  style={{ backgroundImage: `url(${tile.imageUrl})` }}
                  aria-hidden
                />
              )}
              <span className="account-tile-icon">
                <Icon size={18} strokeWidth={1.7} />
              </span>
              <p className="account-tile-title">{tile.title}</p>
              <p className="account-tile-desc">{tile.description}</p>
              <span className="account-tile-arrow" aria-hidden>
                <ArrowRight size={15} strokeWidth={2} />
              </span>
            </Link>
          );
        })}
      </div>

      <AccountTrustBar />
    </div>
  );
}

export function ProfileSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data });
  const user = data?.user;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
  }, [user]);

  const save = useMutation({
    mutationFn: () => api.patch('/auth/me', { name: name.trim(), phone: phone.trim() || null }),
    onSuccess: () => {
      setMsg('Profile updated.');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => setMsg(e.response?.data?.message || 'Could not save.'),
  });

  if (isLoading) return <p className="text-stone-500">Loading profile…</p>;

  return (
    <div>
      <SectionHeader
        eyebrow="Profile"
        title="Personal details"
        description="Used for orders, delivery updates, and your bag checkout."
      />
      <form
        className="mt-8 max-w-md space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-stone-500">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-2" required minLength={2} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-stone-500">Mobile</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field mt-2"
            placeholder="+91 …"
            inputMode="tel"
          />
        </label>
        <label className="block opacity-80">
          <span className="text-[10px] uppercase tracking-widest text-stone-500">Email</span>
          <input value={user?.email || ''} readOnly className="input-field mt-2 cursor-not-allowed opacity-70" />
        </label>
        <button type="submit" disabled={save.isPending} className="btn-primary btn-accent w-full disabled:opacity-50 sm:w-auto">
          {save.isPending ? 'Saving…' : 'Save changes'}
        </button>
        {msg && <p className="text-sm text-stone-400">{msg}</p>}
      </form>
    </div>
  );
}

export function AddressesSection() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: async () => (await api.get('/addresses')).data });
  const items = data?.items || [];

  return (
    <div>
      <SectionHeader
        eyebrow="Delivery"
        title="Saved addresses"
        description="Choose one at checkout or add a new address when you order."
      />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          {isLoading ? (
            <p className="text-stone-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-200 p-6 text-sm text-stone-500 dark:border-white/15">
              No addresses yet — add one on the right.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((a) => (
                <li key={a.id} className="rounded-lg border border-stone-200 bg-stone-50/50 p-5 text-sm dark:border-white/10 dark:bg-black/20">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-100">{a.fullName}</p>
                    {a.isDefault && (
                      <span className="shrink-0 text-[9px] uppercase tracking-widest text-q-accent">Default</span>
                    )}
                  </div>
                  <p className="mt-2 leading-relaxed text-stone-500">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}
                    <br />
                    {a.city}, {a.state} {a.postalCode}
                  </p>
                  <p className="mt-2 text-stone-500">{a.phone}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50/30 p-5 dark:border-white/10 dark:bg-black/20">
          <h3 className="text-[10px] uppercase tracking-widest text-stone-500">Add address</h3>
          <div className="mt-4">
            <AddressForm
              initialFullName={user?.name || ''}
              isDefault={items.length === 0}
              submitLabel="Save address"
              onSuccess={() => qc.invalidateQueries({ queryKey: ['addresses'] })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function orderStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('deliver') || s.includes('complete')) return 'text-emerald-500';
  if (s.includes('cancel')) return 'text-red-400';
  if (s.includes('ship') || s.includes('process')) return 'text-q-accent';
  return 'text-stone-500';
}

export function OrdersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  return (
    <div>
      <SectionHeader eyebrow="Orders" title="Your orders" description="Track status and open any order for full details." />
      {isLoading ? (
        <p className="mt-8 text-stone-500">Loading orders…</p>
      ) : !data?.items?.length ? (
        <div className="mt-8 rounded-lg border border-dashed border-stone-200 p-8 text-center dark:border-white/15">
          <p className="text-stone-500">No orders yet.</p>
          <Link to="/shop/men" className="btn-primary btn-accent mt-6 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-stone-200 dark:divide-white/10">
          {data.items.map((o) => (
            <li key={o.id}>
              <Link
                to={`/account/orders/${o.orderNumber}`}
                className="-mx-1 flex flex-wrap items-center justify-between gap-4 rounded-lg px-1 py-5 transition hover:bg-stone-50 dark:hover:bg-white/[0.02]"
              >
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-stone-800 dark:text-stone-200">{formatInr(o.total)}</p>
                  <p className={`mt-1 text-[10px] uppercase tracking-widest ${orderStatusClass(o.orderStatus)}`}>
                    {o.orderStatus}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => (await api.get(`/orders/${orderNumber}`)).data,
  });

  if (isLoading) return <p className="text-stone-500">Loading order…</p>;
  if (!data) return <p className="text-stone-500">Order not found.</p>;

  const addr = typeof data.addressSnapshot === 'string' ? JSON.parse(data.addressSnapshot) : data.addressSnapshot;

  return (
    <div>
      <Link to="/account/orders" className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent">
        ← Back to orders
      </Link>
      <h2 className="font-display mt-4 text-3xl font-light text-stone-900 dark:text-stone-50">{data.orderNumber}</h2>
      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-stone-500">
        <span>{data.paymentMethod?.toUpperCase()}</span>
        <span className="text-stone-300 dark:text-white/20">·</span>
        <span className={orderStatusClass(data.paymentStatus)}>{data.paymentStatus}</span>
        <span className="text-stone-300 dark:text-white/20">·</span>
        <span className={orderStatusClass(data.orderStatus)}>{data.orderStatus}</span>
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-5 dark:border-white/10 dark:bg-black/20">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Total</p>
          <p className="mt-2 text-2xl text-stone-900 dark:text-stone-100">{formatInr(data.total)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-5 text-sm dark:border-white/10 dark:bg-black/20">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Ship to</p>
          <p className="mt-2 leading-relaxed text-stone-500">
            {addr.full_name || addr.fullName}
            <br />
            {addr.line1}
            <br />
            {addr.city} {addr.postal_code || addr.postalCode}
          </p>
        </div>
      </div>

      <h3 className="mt-10 text-[10px] uppercase tracking-widest text-stone-500">Items</h3>
      <ul className="mt-4 space-y-3 border-t border-stone-200 pt-6 text-sm dark:border-white/10">
        {(data.items || []).map((i, idx) => (
          <li key={idx} className="flex justify-between gap-4 text-stone-600 dark:text-stone-300">
            <span>
              {i.productName} <span className="text-stone-400">× {i.quantity}</span>
            </span>
            <span className="shrink-0 text-stone-800 dark:text-stone-200">{formatInr(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}