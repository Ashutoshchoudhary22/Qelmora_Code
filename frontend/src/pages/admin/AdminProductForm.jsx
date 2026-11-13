import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from '../../components/admin/UploadSizeHint';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Stone', 'Amber'];

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { booting, isAdmin } = useAuth();
  const isNew = id === 'new';
  const adminReady = !booting && isAdmin;
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compareAtPrice: '',
    categoryId: '',
    isFeatured: false,
    isNewArrival: true,
    isActive: true,
  });
  const [media, setMedia] = useState([]);
  const [variants, setVariants] = useState([
    { sku: 'QEL-M-BLK', size: 'M', color: 'Black', stock: 10 },
  ]);

  const { data: existing } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => (await api.get(`/products/admin/${id}`)).data,
    enabled: adminReady && !isNew && !!id,
    retry: false,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      slug: existing.slug,
      description: existing.description || '',
      price: String(existing.price),
      compareAtPrice: existing.compareAtPrice ? String(existing.compareAtPrice) : '',
      categoryId: existing.category_id ? String(existing.category_id) : '',
      isFeatured: !!existing.isFeatured,
      isNewArrival: !!existing.isNewArrival,
      isActive: !!existing.isActive,
    });
    setMedia(
      (existing.media || []).map((m) => ({
        secure_url: m.secureUrl,
        public_id: m.publicId,
        resource_type: m.resourceType,
      }))
    );
    setVariants(existing.variants || []);
  }, [existing]);

  async function onFiles(e) {
    const files = [...e.target.files];
    setMsg('Uploading…');
    try {
      const uploaded = [];
      for (const file of files) {
        const meta = await uploadToCloudinary(file);
        uploaded.push({ ...meta, sort_order: media.length + uploaded.length });
      }
      setMedia((m) => [...m, ...uploaded]);
      setMsg('');
    } catch (err) {
      setMsg(err.message || 'Upload failed — check Cloudinary env on backend');
    }
  }

  function generateVariants() {
    const base = form.slug?.toUpperCase().replace(/-/g, '') || 'QEL';
    const list = [];
    for (const size of SIZES.slice(0, 4)) {
      for (const color of COLORS.slice(0, 2)) {
        list.push({ sku: `${base}-${size}-${color.slice(0, 3).toUpperCase()}`, size, color, stock: 10 });
      }
    }
    setVariants(list);
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function ensureVariants(list, slug) {
    if (list.length > 0) return list;
    const base = (slug || 'qel').toUpperCase().replace(/-/g, '');
    return [{ sku: `${base}-M-BLK`, size: 'M', color: 'Black', stock: 10 }];
  }

  async function save() {
    setMsg('');
    const name = form.name.trim();
    const slug = (form.slug || slugify(name)).trim();
    const price = Number(form.price);

    if (!name) return setMsg('Product name is required.');
    if (!slug) return setMsg('Slug is required (e.g. obsidian-hoodie).');
    if (!Number.isFinite(price) || price <= 0) return setMsg('Enter a valid price greater than 0.');
    for (const m of media) {
      if (!m.secure_url || !m.public_id) {
        return setMsg('Each uploaded image must finish uploading to Cloudinary before save.');
      }
    }

    const variantList = ensureVariants(variants, slug).map((v, i) => {
      const base = slug.toUpperCase().replace(/-/g, '') || 'QEL';
      const sku = v.sku?.trim() || `${base}-${v.size}-${String(v.color).slice(0, 3).toUpperCase()}-${i}`;
      return {
        sku,
        size: v.size,
        color: v.color,
        stock: Number(v.stock) >= 0 ? Number(v.stock) : 0,
      };
    });

    const payload = {
      name,
      slug,
      description: form.description,
      price,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      isActive: form.isActive,
      media: media.map((m, i) => ({
        secure_url: m.secure_url,
        public_id: m.public_id,
        resource_type: m.resource_type || 'image',
        sort_order: i,
      })),
      variants: variantList,
    };

    setSaving(true);
    try {
      if (isNew) await api.post('/products/admin', payload);
      else await api.put(`/products/admin/${id}`, payload);
      await qc.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed — check name, slug, price, and at least one size/color variant.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-light">{isNew ? 'New product' : `Edit #${id}`}</h1>
      <div className="mt-8 space-y-4">
        <input
          className="input-field"
          placeholder="Name"
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({
              ...f,
              name,
              slug: isNew && (!f.slug || f.slug === slugify(f.name)) ? slugify(name) : f.slug,
            }));
          }}
        />
        <input className="input-field" placeholder="Slug (lowercase-dash)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea className="input-field min-h-[120px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <input className="input-field" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="input-field" type="number" placeholder="Compare at" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
        </div>
        <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Category</option>
          {(categories?.items || []).filter((c) => c.slug !== 'unisex').map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] leading-relaxed text-stone-600">
          Men or Women — sets shop placement, You may like &amp; T-shirts on the product page (same gender only), and
          homepage New arrivals / Best sellers.
        </p>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
          New arrival
        </label>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Media (Cloudinary)</p>
          <p className="mt-1 text-xs text-stone-600">Upload → preview here → save product to store URLs in database.</p>
          <UploadSizeHint variant="product" video className="mt-2" />
          <label className="btn-primary mt-3 inline-flex cursor-pointer text-[10px]">
            Add files
            <input type="file" multiple accept="image/*,video/*" onChange={onFiles} className="hidden" />
          </label>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m, idx) => (
              <MediaAssetCard
                key={m.public_id || idx}
                secureUrl={m.secure_url}
                publicId={m.public_id}
                resourceType={m.resource_type || 'image'}
                downloadName={m.public_id?.split('/').pop() || `product-${idx}`}
                onRemove={() => setMedia((list) => list.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        </div>
        <div>
          <button type="button" className="btn-primary text-[10px]" onClick={generateVariants}>
            Generate sample variants
          </button>
          <p className="mt-2 text-xs text-stone-500">
            {variants.length} variant(s) — required for cart/checkout (default M / Black added for new products).
          </p>
          <ul className="mt-3 space-y-1 text-xs text-stone-500">
            {variants.slice(0, 6).map((v) => (
              <li key={v.sku}>
                {v.size} · {v.color} · stock {v.stock} · {v.sku}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn-primary btn-accent w-full" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
        {msg && <p className="text-sm text-red-400/90">{msg}</p>}
      </div>
    </div>
  );
}
