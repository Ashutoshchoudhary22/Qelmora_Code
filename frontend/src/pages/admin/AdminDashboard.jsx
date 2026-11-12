import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatInr } from '../../lib/money';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data,
  });

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  const cards = [
    { label: 'Revenue', value: formatInr(data?.revenue) },
    { label: 'Orders', value: data?.totalOrders },
    { label: 'Customers', value: data?.totalCustomers },
    { label: 'Products', value: data?.totalProducts },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-light">Dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-white/10 p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">{c.label}</p>
            <p className="mt-2 text-2xl">{c.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-12 text-[10px] uppercase tracking-widest text-stone-500">Recent orders</h2>
      <ul className="mt-4 divide-y divide-white/10 text-sm">
        {(data?.recentOrders || []).map((o) => (
          <li key={o.orderNumber} className="flex justify-between py-3">
            <span>{o.orderNumber}</span>
            <span>{formatInr(o.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
