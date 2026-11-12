import { useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { formatInr } from '../lib/money';

function AccountNav() {
  const { pathname } = useLocation();
  const tab = (to, label) => (
    <Link to={to} className={pathname === to || pathname.startsWith(to + '/') ? 'text-q-accent' : 'hover:text-stone-200'}>
      {label}
    </Link>
  );
  return (
    <nav className="mt-8 flex gap-6 text-xs uppercase tracking-widest text-stone-500">
      {tab('/account', 'Profile')}
      {tab('/account/addresses', 'Addresses')}
      {tab('/account/orders', 'Orders')}
    </nav>
  );
}

export function AccountLayout() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <h1 className="font-display text-4xl font-light">My account</h1>
        <AccountNav />
        <div className="mt-10">
          <Outlet />
        </div>
      </main>
    </ProtectedRoute>
  );
}

export function ProfileSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data });
  const user = data?.user;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const save = useMutation({
    mutationFn: () => api.patch('/auth/me', { name: name || user?.name, phone: phone || user?.phone }),
    onSuccess: () => {
      setMsg('Saved');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return (
    <div className="max-w-lg">
      <p className="text-sm text-stone-400">{user?.email}</p>
      <div className="mt-6 space-y-4">
        <input defaultValue={user?.name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input-field" />
        <input defaultValue={user?.phone || ''} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile" className="input-field" />
        <button type="button" className="btn-primary" onClick={() => save.mutate()}>
          Save profile
        </button>
        {msg && <p className="text-sm text-stone-500">{msg}</p>}
      </div>
    </div>
  );
}

export function AddressesSection() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['addresses'], queryFn: async () => (await api.get('/addresses')).data });
  const [form, setForm] = useState({ fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '' });

  const add = useMutation({
    mutationFn: () => api.post('/addresses', { ...form, isDefault: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      setForm({ fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '' });
    },
  });

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <ul className="space-y-4">
        {(data?.items || []).map((a) => (
          <li key={a.id} className="border border-white/10 p-4 text-sm text-stone-400">
            <p className="text-stone-100">{a.fullName}</p>
            <p className="mt-2">
              {a.line1}, {a.city}, {a.state} {a.postalCode}
            </p>
            <p>{a.phone}</p>
          </li>
        ))}
      </ul>
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-stone-500">Add address</h2>
        <div className="mt-4 space-y-3">
          {['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'].map((k) => (
            <input
              key={k}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              placeholder={k.replace(/([A-Z])/g, ' $1')}
              className="input-field"
            />
          ))}
          <button type="button" className="btn-primary w-full" onClick={() => add.mutate()}>
            Save address
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrdersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });
  if (isLoading) return <p className="text-stone-500">Loading…</p>;
  if (!data?.items?.length) return <p className="text-stone-500">No orders yet.</p>;
  return (
    <ul className="divide-y divide-white/10">
      {data.items.map((o) => (
        <li key={o.id} className="flex items-center justify-between py-4 text-sm">
          <div>
            <Link to={`/account/orders/${o.orderNumber}`} className="text-stone-100 hover:text-q-accent">
              {o.orderNumber}
            </Link>
            <p className="text-stone-500">{new Date(o.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p>{formatInr(o.total)}</p>
            <p className="text-xs uppercase tracking-widest text-stone-600">{o.orderStatus}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { data } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => (await api.get(`/orders/${orderNumber}`)).data,
  });
  if (!data) return <p className="text-stone-500">Loading…</p>;
  const addr = typeof data.addressSnapshot === 'string' ? JSON.parse(data.addressSnapshot) : data.addressSnapshot;
  return (
    <div>
      <Link to="/account/orders" className="text-xs tracking-widest text-stone-500">
        ← Orders
      </Link>
      <h2 className="mt-4 text-2xl">{data.orderNumber}</h2>
      <p className="mt-2 text-sm text-stone-500">
        {data.paymentMethod?.toUpperCase()} · {data.paymentStatus} · {data.orderStatus}
      </p>
      <p className="mt-4 text-lg">{formatInr(data.total)}</p>
      <p className="mt-6 text-sm text-stone-400">
        Ship to: {addr.full_name}, {addr.line1}, {addr.city} {addr.postal_code}
      </p>
      <ul className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm">
        {(data.items || []).map((i, idx) => (
          <li key={idx} className="flex justify-between">
            <span>
              {i.productName} × {i.quantity}
            </span>
            <span>{formatInr(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
