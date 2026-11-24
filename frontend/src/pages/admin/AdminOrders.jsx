import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatInr } from '../../lib/money';

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

function formatOrderDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get('/admin/orders')).data,
  });

  const update = useMutation({
    mutationFn: ({ id, orderStatus }) => api.patch(`/admin/orders/${id}/status`, { orderStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-light">Orders</h1>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-[10px] uppercase tracking-widest text-stone-500">
          <tr>
            <th className="py-2">Order</th>
            <th>Order date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {(data?.items || []).map((o) => (
            <tr key={o.id}>
              <td className="py-3 font-medium text-stone-800">{o.orderNumber}</td>
              <td className="whitespace-nowrap text-stone-600">{formatOrderDate(o.createdAt)}</td>
              <td>{o.customerName}</td>
              <td>{formatInr(o.total)}</td>
              <td>{o.paymentMethod} / {o.paymentStatus}</td>
              <td>
                <select
                  className="input-field py-1 text-xs"
                  value={o.orderStatus}
                  onChange={(e) => update.mutate({ id: o.id, orderStatus: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
