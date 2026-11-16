import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from '../../components/admin/UploadSizeHint';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_PRESETS = ['Black', 'White', 'Stone', 'Amber'];

function colorSkuCode(color) {
  const parts = String(color)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'CLR';
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function ChipToggle({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
        active
          ? 'border-q-accent bg-q-accent/15 text-q-accent'
          : 'border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300'
      }`}
    >
      {children}
    </button>
  );
}

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
    categoryIds: [],
    isFeatured: false,
    isNewArrival: true,
    isActive: true,
  });
  const [media, setMedia] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState(['M']);
  const [selectedColors, setSelectedColors] = useState(['Black']);
  const [paletteColors, setPaletteColors] = useState([...COLOR_PRESETS]);
  const [newColorName, setNewColorName] = useState('');
  const [defaultStock, setDefaultStock] = useState(10);
  const [variants, setVariants] = useState([
    { sku: 'QEL-M-BLK', size: 'M', color: 'Black', stock: 10 },
  ]);

  const shopCategories = (categories?.items || []).filter((c) => c.slug === 'men' || c.slug === 'women');
  const listedShops = shopCategories.filter((c) => form.categoryIds.includes(String(c.id)));

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
      categoryIds: (existing.categoryIds?.length
        ? existing.categoryIds
        : existing.category_id
          ? [existing.category_id]
          : []
      ).map(String),
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
    const existingVariants = existing.variants || [];
    setVariants(existingVariants);
    const fromVariants = [...new Set(existingVariants.map((v) => v.color).filter(Boolean))];
    if (fromVariants.length) {
      setSelectedColors(fromVariants);
      setPaletteColors((prev) => {
        const next = [...prev];
        for (const c of fromVariants) {
          if (!next.some((x) => x.toLowerCase() === c.toLowerCase())) next.push(c);
        }
        return next;
      });
      const sizes = [...new Set(existingVariants.map((v) => v.size).filter(Boolean))];
      if (sizes.length) setSelectedSizes(sizes);
    }
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
    if (!selectedSizes.length || !selectedColors.length) {
      setMsg('Select at least one size and one color for SKUs.');
      return;
    }
    const base = form.slug?.toUpperCase().replace(/-/g, '') || 'QEL';
    const stock = Number(defaultStock) >= 0 ? Number(defaultStock) : 0;
    const list = [];
    for (const size of selectedSizes) {
      for (const color of selectedColors) {
        list.push({
          sku: `${base}-${size}-${colorSkuCode(color)}`,
          size,
          color,
          stock,
        });
      }
    }
    setVariants(list);
    setMsg('');
  }

  function addCustomColor() {
    const name = newColorName.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const exists = paletteColors.some((c) => c.toLowerCase() === name.toLowerCase());
    if (!exists) setPaletteColors((p) => [...p, name]);
    setSelectedColors((s) => (s.some((c) => c.toLowerCase() === name.toLowerCase()) ? s : [...s, name]));
    setNewColorName('');
    setMsg('');
  }

  function removeCustomColor(color) {
    if (COLOR_PRESETS.includes(color)) return;
    setPaletteColors((p) => p.filter((c) => c !== color));
    setSelectedColors((s) => s.filter((c) => c !== color));
  }

  function toggleCategory(id) {
    const sid = String(id);
    setForm((f) => {
      const next = toggleInList(f.categoryIds, sid);
      return { ...f, categoryIds: next };
    });
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
    if (!form.categoryIds.length) return setMsg('Select at least one shop category (Men and/or Women).');
    for (const m of media) {
      if (!m.secure_url || !m.public_id) {
        return setMsg('Each uploaded image must finish uploading to Cloudinary before save.');
      }
    }

    const variantList = ensureVariants(variants, slug).map((v, i) => {
      const base = slug.toUpperCase().replace(/-/g, '') || 'QEL';
      const sku = v.sku?.trim() || `${base}-${v.size}-${colorSkuCode(v.color)}-${i}`;
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
      categoryIds: form.categoryIds.map(Number),
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
      await qc.invalidateQueries({ queryKey: ['products'] });
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
        <div>
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Shop categories (multi-select)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {shopCategories.map((c) => (
              <ChipToggle key={c.id} active={form.categoryIds.includes(String(c.id))} onClick={() => toggleCategory(c.id)}>
                {c.name}
              </ChipToggle>
            ))}
          </div>
          {listedShops.length > 0 && (
            <p className="mt-3 text-xs text-q-accent">
              Listed on:{' '}
              {listedShops.map((c, i) => (
                <span key={c.id}>
                  {i > 0 ? ' · ' : null}
                  <Link to={`/shop/${c.slug}#collection`} className="underline underline-offset-2 hover:text-stone-200">
                    {c.name} shop
                  </Link>
                </span>
              ))}
              {form.isActive
                ? ' — after you save, open the link and check The collection (grid under the Men/Women title).'
                : ' — turn on Active on storefront below, then save.'}
            </p>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-stone-600">
            Orange chip = category selected. Save product so the shop page updates (chip alone does not sync until save).
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active on storefront
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
          Featured (shop best sellers + homepage)
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
          New arrival (shop + homepage band)
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
          <p className="text-[10px] uppercase tracking-widest text-stone-500">SKU variants (multi-select)</p>
          <p className="mt-1 text-xs text-stone-600">Pick sizes and colors, set default stock, then build SKUs.</p>
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-widest text-stone-600">Sizes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <ChipToggle
                  key={size}
                  active={selectedSizes.includes(size)}
                  onClick={() => setSelectedSizes((s) => toggleInList(s, size))}
                >
                  {size}
                </ChipToggle>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600">Colors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {paletteColors.map((color) => {
                const isPreset = COLOR_PRESETS.includes(color);
                return (
                  <span key={color} className="inline-flex items-center gap-1">
                    <ChipToggle
                      active={selectedColors.includes(color)}
                      onClick={() => setSelectedColors((c) => toggleInList(c, color))}
                    >
                      {color}
                    </ChipToggle>
                    {!isPreset && (
                      <button
                        type="button"
                        className="text-stone-600 hover:text-red-400"
                        aria-label={`Remove ${color}`}
                        onClick={() => removeCustomColor(color)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className="input-field min-w-[160px] flex-1"
                placeholder="Add colour name (e.g. Navy, Olive)"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomColor();
                  }
                }}
              />
              <button type="button" className="btn-primary shrink-0 text-[10px]" onClick={addCustomColor}>
                Add colour
              </button>
            </div>
            <p className="mt-1 text-[10px] text-stone-600">Type your own name — it is saved on the product variant and used in the SKU.</p>
          </div>
          <div className="mt-4 max-w-[140px]">
            <label className="text-[10px] uppercase tracking-widest text-stone-600">Default stock</label>
            <input
              className="input-field mt-1"
              type="number"
              min={0}
              value={defaultStock}
              onChange={(e) => setDefaultStock(e.target.value)}
            />
          </div>
          <button type="button" className="btn-primary mt-4 text-[10px]" onClick={generateVariants}>
            Build {selectedSizes.length * selectedColors.length || 0} SKU
            {selectedSizes.length * selectedColors.length === 1 ? '' : 's'}
          </button>
          <p className="mt-2 text-xs text-stone-500">
            {variants.length} variant(s) saved — required for cart/checkout (new products start with M / Black).
          </p>
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-stone-500">
            {variants.map((v) => (
              <li key={`${v.sku}-${v.size}-${v.color}`}>
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
