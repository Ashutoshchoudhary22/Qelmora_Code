import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { formatInr } from '../../lib/money';
import { downloadMedia } from '../../lib/download';

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await api.get('/products/admin/all')).data,
  });

  const removeProduct = useMutation({
    mutationFn: (id) => api.delete(`/products/admin/${id}`),
    onSuccess: (_res, id) => {
      qc.setQueryData(['admin-products'], (old) => {
        if (!old?.items) return old;
        return { ...old, items: old.items.filter((item) => item.id !== id) };
      });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  function onDelete(p) {
    const ok = window.confirm(
      `Permanently delete "${p.name}"?\n\nThis removes the product, images, and variants from the admin list. Past orders keep their line items.`
    );
    if (!ok) return;
    removeProduct.mutate(p.id, {
      onError: (e) => alert(e.response?.data?.message || 'Could not delete product'),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-light">Products</h1>
        <Link to="/admin/products/new" className="btn-primary btn-accent text-[10px]">
          Add product
        </Link>
      </div>
      {isLoading ? (
        <p className="mt-8 text-stone-500">Loading…</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-stone-500">
            <tr>
              <th className="py-2 w-24">Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(data?.items || []).map((p) => (
              <tr key={p.id}>
                <td className="py-3">
                  {p.image ? (
                    <div className="flex items-center gap-2">
                      <img src={p.image} alt="" className="h-14 w-11 rounded object-cover ring-1 ring-white/10" />
                      <button
                        type="button"
                        className="text-[9px] uppercase tracking-wider text-q-accent hover:underline"
                        onClick={() => downloadMedia(p.image, p.slug || `product-${p.id}`)}
                      >
                        ↓
                      </button>
                    </div>
                  ) : (
                    <span className="text-stone-600">—</span>
                  )}
                </td>
                <td className="py-3">{p.name}</td>
                <td>{p.category || '—'}</td>
                <td>{formatInr(p.price)}</td>
                <td>{p.isActive ? 'Active' : 'Hidden'}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <Link to={`/admin/products/${p.id}`} className="text-q-accent text-xs uppercase tracking-widest">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      disabled={removeProduct.isPending}
                      className="text-xs uppercase tracking-widest text-red-400/90 transition hover:text-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
