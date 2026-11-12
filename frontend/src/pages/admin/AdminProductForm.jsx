import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { uploadToCloudinary } from '../../lib/cloudinary';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Stone', 'Amber'];

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [msg, setMsg] = useState('');

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
  const [variants, setVariants] = useState([]);

  const { data: existing } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => (await api.get(`/products/admin/${id}`)).data,
    enabled: !isNew && !!id,
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

  async function save() {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      isActive: form.isActive,
      media: media.map((m, i) => ({
        secure_url: m.secure_url,
        public_id: m.public_id,
        resource_type: m.resource_type,
        sort_order: i,
      })),
      variants,
    };
    try {
      if (isNew) await api.post('/products/admin', payload);
      else await api.put(`/products/admin/${id}`, payload);
      navigate('/admin/products');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-light">{isNew ? 'New product' : `Edit #${id}`}</h1>
      <div className="mt-8 space-y-4">
        <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" placeholder="Slug (lowercase-dash)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea className="input-field min-h-[120px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <input className="input-field" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="input-field" type="number" placeholder="Compare at" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
        </div>
        <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Category</option>
          {(categories?.items || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
          New arrival
        </label>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Media</p>
          <input type="file" multiple accept="image/*,video/*" onChange={onFiles} className="mt-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">
            {media.map((m) => (
              <img key={m.public_id} src={m.secure_url} alt="" className="h-16 w-14 object-cover" />
            ))}
          </div>
        </div>
        <div>
          <button type="button" className="btn-primary text-[10px]" onClick={generateVariants}>
            Generate sample variants
          </button>
          <p className="mt-2 text-xs text-stone-500">{variants.length} variants</p>
        </div>
        <button type="button" className="btn-primary btn-accent w-full" onClick={save}>
          Save product
        </button>
        {msg && <p className="text-sm text-stone-400">{msg}</p>}
      </div>
    </div>
  );
}
