import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid,
  LayoutList,
  Package,
  Pencil,
  Search,
  Shirt,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { api } from '../../api/client';
import { formatInr } from '../../lib/money';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

function parseCategoryList(p) {
  const fromNames = p.categoryNames
    ? String(p.categoryNames)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (fromNames.length) return fromNames;
  return p.category ? [p.category] : [];
}

function parseCategorySlugs(p) {
  return p.categorySlugs
    ? String(p.categorySlugs)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];
}

function categoryIcon(name) {
  if (/women/i.test(name)) return <User size={12} />;
  return <Shirt size={12} />;
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('list');

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

  const items = data?.items || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (q && !p.name?.toLowerCase().includes(q) && !p.slug?.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all') {
        const slugs = parseCategorySlugs(p);
        const names = parseCategoryList(p).map((n) => n.toLowerCase());
        const matchSlug = slugs.includes(categoryFilter);
        const matchName =
          (categoryFilter === 'men' && names.some((n) => n === 'men')) ||
          (categoryFilter === 'women' && names.some((n) => n === 'women'));
        if (!matchSlug && !matchName) return false;
      }
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'hidden' && p.isActive) return false;
      return true;
    });
  }, [items, search, categoryFilter, statusFilter]);

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
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <Package size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Products</h1>
              <p>Manage your store products, pricing and visibility.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body">
        <div className="admin-products-toolbar">
          <div className="admin-products-search">
            <Search className="admin-products-search-icon" size={17} />
            <input
              type="search"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>

          <label className="admin-products-select">
            <LayoutGrid size={15} className="text-[#c97a35]" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category">
              <option value="all">All Categories</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          </label>

          <label className="admin-products-select">
            <Tag size={15} className="text-[#c97a35]" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>

          <div className="admin-products-view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`admin-products-view-btn${view === 'list' ? ' is-active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="List view"
            >
              <LayoutList size={18} />
            </button>
            <button
              type="button"
              className={`admin-products-view-btn${view === 'grid' ? ' is-active' : ''}`}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="admin-products-empty">Loading products…</p>
        ) : view === 'grid' ? (
          <div className="admin-products-grid">
            {filtered.map((p) => (
              <article key={p.id} className="admin-products-grid-card">
                {p.image ? (
                  <img src={p.image} alt="" className="admin-products-thumb mb-2 w-full !h-28 !w-full rounded-lg" />
                ) : (
                  <div className="mb-2 flex h-28 w-full items-center justify-center rounded-lg bg-[#f0e4d6]">
                    <Package size={28} className="text-stone-400" />
                  </div>
                )}
                <p className="admin-products-name line-clamp-2">{p.name}</p>
                <p className="admin-products-price mt-1 text-sm">{formatInr(p.price)}</p>
                <div className="admin-products-actions mt-3 !justify-start">
                  <Link to={`/admin/products/${p.id}`} className="admin-products-icon-btn" title="Edit">
                    <Pencil size={15} />
                  </Link>
                  <button
                    type="button"
                    className="admin-products-icon-btn admin-products-icon-btn--danger"
                    title="Delete"
                    onClick={() => onDelete(p)}
                    disabled={removeProduct.isPending}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
            {!filtered.length && <p className="admin-products-empty col-span-full">No products match your filters.</p>}
          </div>
        ) : (
          <div className="admin-products-table-card">
            <div className="admin-products-table-scroll">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const cats = parseCategoryList(p);
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="admin-products-index">{idx + 1}</span>
                        </td>
                        <td>
                          {p.image ? (
                            <img src={p.image} alt="" className="admin-products-thumb" />
                          ) : (
                            <div className="admin-products-thumb flex items-center justify-center">
                              <Package size={16} className="text-stone-400" />
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="admin-products-name">{p.name}</span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {cats.length ? (
                              cats.map((c) => (
                                <span key={c} className="admin-products-category-pill">
                                  {categoryIcon(c)}
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="admin-products-price">{formatInr(p.price)}</span>
                        </td>
                        <td>
                          <span
                            className={`admin-products-status${p.isActive ? '' : ' admin-products-status--hidden'}`}
                          >
                            <span className="admin-products-status-dot" aria-hidden />
                            {p.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-products-actions">
                            <Link to={`/admin/products/${p.id}`} className="admin-products-icon-btn" title="Edit product">
                              <Pencil size={15} />
                            </Link>
                            <button
                              type="button"
                              className="admin-products-icon-btn admin-products-icon-btn--danger"
                              title="Delete product"
                              onClick={() => onDelete(p)}
                              disabled={removeProduct.isPending}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!filtered.length && (
              <p className="admin-products-empty">No products match your filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}