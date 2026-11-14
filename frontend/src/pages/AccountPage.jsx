import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, User } from 'lucide-react';
import { api } from '../api/client';
import { AddressForm } from '../components/AddressForm';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { formatInr } from '../lib/money';

const navItems = [
  { to: '/account', label: 'My profile', icon: User, end: true },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin, end: false },
  { to: '/account/orders', label: 'Orders', icon: Package, end: false },
];

function AccountNav({ variant = 'all' }) {
  const showMobile = variant === 'all' || variant === 'mobile';
  const showDesktop = variant === 'all' || variant === 'desktop';

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
              `shrink-0 border px-4 py-2 text-[10px] uppercase tracking-widest transition ${
                isActive ? 'border-q-accent text-q-accent' : 'border-white/15 text-stone-500'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      )}
      {showDesktop && (
      <nav className="account-nav-desktop sticky top-24 hidden flex-col gap-1 lg:flex">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border px-4 py-3 text-[11px] uppercase tracking-[0.16em] transition ${
                isActive
                  ? 'border-q-accent/50 bg-q-accent/10 text-q-accent'
                  : 'border-transparent text-stone-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-stone-200'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.5} className="shrink-0 opacity-90" />
            {label}
          </NavLink>
        ))}
      </nav>
      )}
    </>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="border-b border-white/10 pb-5">
      {eyebrow && <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">{eyebrow}</p>}
      <h2 className="font-display mt-1 text-2xl font-light md:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-500">{description}</p>}
    </div>
  );
}

export function AccountLayout() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <ProtectedRoute>
      <main className="account-page site-container py-12 md:py-16">
        <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Account</p>
        <h1 className="font-display mt-2 text-4xl font-light md:text-5xl">
          {firstName ? `Hello, ${firstName}` : 'My account'}
        </h1>
        {user?.email && <p className="mt-2 text-sm text-stone-500">{user.email}</p>}

        <div className="mt-8 lg:hidden">
          <AccountNav variant="mobile" />
        </div>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(12rem,15rem)_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <AccountNav variant="desktop" />
          </aside>
          <section className="account-panel min-w-0 rounded-xl border border-white/10 bg-[#0c0c0c]/90 p-6 md:p-8">
            <Outlet />
          </section>
        </div>
      </main>
    </ProtectedRoute>
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
            <p className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-stone-500">No addresses yet — add one on the right.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((a) => (
                <li key={a.id} className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-100">{a.fullName}</p>
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
        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
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
        <div className="mt-8 rounded-lg border border-dashed border-white/15 p-8 text-center">
          <p className="text-stone-500">No orders yet.</p>
          <Link to="/shop/men" className="btn-primary btn-accent mt-6 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-white/10">
          {data.items.map((o) => (
            <li key={o.id}>
              <Link
                to={`/account/orders/${o.orderNumber}`}
                className="flex flex-wrap items-center justify-between gap-4 py-5 transition hover:bg-white/[0.02] px-1 -mx-1 rounded-lg"
              >
                <div>
                  <p className="font-medium text-stone-100">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-stone-200">{formatInr(o.total)}</p>
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
      <h2 className="font-display mt-4 text-3xl font-light">{data.orderNumber}</h2>
      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-stone-500">
        <span>{data.paymentMethod?.toUpperCase()}</span>
        <span className="text-white/20">·</span>
        <span className={orderStatusClass(data.paymentStatus)}>{data.paymentStatus}</span>
        <span className="text-white/20">·</span>
        <span className={orderStatusClass(data.orderStatus)}>{data.orderStatus}</span>
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Total</p>
          <p className="mt-2 text-2xl text-stone-100">{formatInr(data.total)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Ship to</p>
          <p className="mt-2 leading-relaxed text-stone-400">
            {addr.full_name || addr.fullName}
            <br />
            {addr.line1}
            <br />
            {addr.city} {addr.postal_code || addr.postalCode}
          </p>
        </div>
      </div>

      <h3 className="mt-10 text-[10px] uppercase tracking-widest text-stone-500">Items</h3>
      <ul className="mt-4 space-y-3 border-t border-white/10 pt-6 text-sm">
        {(data.items || []).map((i, idx) => (
          <li key={idx} className="flex justify-between gap-4 text-stone-300">
            <span>
              {i.productName} <span className="text-stone-600">× {i.quantity}</span>
            </span>
            <span className="shrink-0 text-stone-200">{formatInr(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
