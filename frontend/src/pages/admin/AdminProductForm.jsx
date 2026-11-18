import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  CloudUpload,
  IndianRupee,
  Layers,
  Link2,
  Package,
  Pencil,
  Plus,
  Shirt,
  User,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { formatInr } from '../../lib/money';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_PRESETS = ['Black', 'White', 'Stone', 'Amber'];

const COLOR_DOT = {
  Black: '#1c1917',
  White: '#fafaf9',
  Stone: '#a8a29e',
  Amber: '#d4a574',
  Tan: '#c4a574',
};

function colorDot(name) {
  const key = Object.keys(COLOR_DOT).find((k) => k.toLowerCase() === String(name).toLowerCase());
  return key ? COLOR_DOT[key] : '#b45309';
}

function previewDiscount(price, compareAt) {
  const p = Number(price);
  const c = Number(compareAt);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}

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
    <button type="button" onClick={onClick} className={`admin-chip-toggle${active ? ' is-active' : ''}`}>
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
  const [variantsOpen, setVariantsOpen] = useState(true);

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

  const previewName = form.name.trim() || 'QELMORA T-Shirt';
  const previewPrice = Number(form.price);
  const previewCompare = Number(form.compareAtPrice);
  const discount = previewDiscount(form.price, form.compareAtPrice);
  const previewThumb = media[0]?.secure_url;

  const categoryIcon = (slug) => (slug === 'women' ? <User size={14} /> : <Shirt size={14} />);

  return (
    <div className="admin-product-page">
      <nav className="admin-product-crumb" aria-label="Breadcrumb">
        <Link to="/admin">Admin</Link>
        <span>/</span>
        <Link to="/admin/products">Products</Link>
        <span>/</span>
        <span>{isNew ? 'New Product' : `Edit #${id}`}</span>
      </nav>

      <header className="admin-product-hero">
        <span className="admin-product-card-head-icon" aria-hidden>
          <Package size={20} strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-display">{isNew ? 'New Product' : 'Edit Product'}</h1>
          <p>{isNew ? 'Add a new product to your QELMORA store' : 'Update listing, media, and SKU variants'}</p>
        </div>
      </header>

      <div className="admin-product-grid">
        <div>
          <section className="admin-product-card">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <Pencil size={16} />
              </span>
              Product Information
            </div>

            <div className="admin-product-fields">
              <div>
                <label className="admin-field-label" htmlFor="product-name">
                  Product Name
                </label>
                <div className="admin-field-icon-wrap">
                  <Package className="admin-field-icon" size={16} />
                  <input
                    id="product-name"
                    className="admin-product-input"
                    placeholder="e.g. QELMORA Essential Tee"
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
                </div>
              </div>

              <div>
                <label className="admin-field-label" htmlFor="product-slug">
                  Slug (lowercase-dash)
                </label>
                <div className="admin-field-icon-wrap">
                  <Link2 className="admin-field-icon" size={16} />
                  <input
                    id="product-slug"
                    className="admin-product-input"
                    placeholder="e.g. stylish-tshirt"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="admin-field-label" htmlFor="product-description">
                  Description
                </label>
                <div className="admin-product-textarea-wrap">
                  <div className="admin-product-editor-toolbar" aria-hidden>
                    <span>B</span>
                    <span>I</span>
                    <span>U</span>
                    <span>☰</span>
                  </div>
                  <textarea
                    id="product-description"
                    className="admin-product-textarea"
                    placeholder="Fabric, fit, and care details…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-product-price-grid">
                <div>
                  <label className="admin-field-label" htmlFor="product-price">
                    Price (₹)
                  </label>
                  <div className="admin-field-icon-wrap">
                    <IndianRupee className="admin-field-icon" size={16} />
                    <input
                      id="product-price"
                      className="admin-product-input"
                      type="number"
                      min={0}
                      placeholder="1999"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="admin-field-label" htmlFor="product-compare">
                    Compare At (₹)
                  </label>
                  <div className="admin-field-icon-wrap">
                    <IndianRupee className="admin-field-icon" size={16} />
                    <input
                      id="product-compare"
                      className="admin-product-input"
                      type="number"
                      min={0}
                      placeholder="2499"
                      value={form.compareAtPrice}
                      onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="admin-field-label">Shop Categories</p>
                <div className="flex flex-wrap gap-2">
                  {shopCategories.map((c) => (
                    <ChipToggle key={c.id} active={form.categoryIds.includes(String(c.id))} onClick={() => toggleCategory(c.id)}>
                      {categoryIcon(c.slug)}
                      {c.name}
                    </ChipToggle>
                  ))}
                </div>
                {listedShops.length > 0 && (
                  <p className="admin-product-hint mt-2">
                    Listed on{' '}
                    {listedShops.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 ? ' · ' : null}
                        <Link to={`/shop/${c.slug}#collection`} className="text-[#c97a35] underline underline-offset-2">
                          {c.name}
                        </Link>
                      </span>
                    ))}
                    {form.isActive ? ' — save to publish on shop.' : ' — enable Active on storefront, then save.'}
                  </p>
                )}
              </div>

              <div className="admin-product-checks">
                <label className="admin-product-check">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active on storefront
                </label>
                <label className="admin-product-check">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Featured
                </label>
                <label className="admin-product-check">
                  <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
                  New arrival
                </label>
              </div>
            </div>
          </section>

          <div className="admin-product-actions">
            <button type="button" className="admin-btn-add" onClick={save} disabled={saving}>
              <Plus size={16} />
              {saving ? 'Saving…' : isNew ? 'Add Product' : 'Save Product'}
            </button>
            <button type="button" className="admin-btn-cancel" onClick={() => navigate('/admin/products')}>
              <X size={16} />
              Cancel
            </button>
          </div>

          {msg ? <p className="admin-product-msg">{msg}</p> : null}
        </div>

        <div className="admin-product-side-stack">
          <section className="admin-product-card admin-product-card--side">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <CloudUpload size={16} />
              </span>
              Media (Cloudinary)
            </div>
            <p className="admin-product-hint mb-3">JPG, PNG, WebP · Max 800 KB per image · MP4 short video optional</p>
            <div className="admin-upload-zone">
              <CloudUpload size={32} strokeWidth={1.25} className="text-[#c4a574]" />
              <p>Drag files here or upload to Cloudinary</p>
              <label className="admin-upload-btn">
                Upload Files
                <input type="file" multiple accept="image/*,video/*" onChange={onFiles} className="hidden" />
              </label>
            </div>
            {media.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            )}
          </section>

          <section className="admin-product-card admin-product-card--side">
            <button
              type="button"
              className="admin-variants-summary"
              onClick={() => setVariantsOpen((o) => !o)}
              aria-expanded={variantsOpen}
            >
              <span className="admin-product-card-head-icon">
                <Layers size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-stone-900">SKU Variants (Multi-Select)</span>
                <span className="admin-product-hint">
                  {variants.length} variant{variants.length === 1 ? '' : 's'} · pick sizes &amp; colours
                </span>
              </span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-stone-500 transition-transform${variantsOpen ? ' rotate-180' : ''}`}
              />
            </button>

            {variantsOpen && (
              <div className="admin-variants-panel">
                <p className="admin-field-label">Sizes</p>
                <div className="flex flex-wrap gap-2">
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

                <p className="admin-field-label mt-4">Colors</p>
                <div className="flex flex-wrap gap-2">
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
                            className="text-stone-500 hover:text-red-600"
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
                    className="admin-product-input admin-product-input--plain min-w-[140px] flex-1"
                    placeholder="Add colour (e.g. Navy)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomColor();
                      }
                    }}
                  />
                  <button type="button" className="admin-upload-btn text-[10px]" onClick={addCustomColor}>
                    Add
                  </button>
                </div>

                <p className="admin-field-label mt-4">Default stock</p>
                <input
                  className="admin-product-input admin-product-input--plain max-w-[8rem]"
                  type="number"
                  min={0}
                  value={defaultStock}
                  onChange={(e) => setDefaultStock(e.target.value)}
                />

                <button type="button" className="admin-upload-btn mt-4" onClick={generateVariants}>
                  Build {selectedSizes.length * selectedColors.length || 0} SKU
                  {selectedSizes.length * selectedColors.length === 1 ? '' : 's'}
                </button>

                <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto text-xs text-stone-600">
                  {variants.map((v) => (
                    <li key={`${v.sku}-${v.size}-${v.color}`}>
                      {v.size} · {v.color} · stock {v.stock} · <span className="text-stone-400">{v.sku}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="admin-product-card admin-product-card--side">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <Package size={16} />
              </span>
              Product Preview
            </div>
            <div className="admin-product-preview-card">
              <div className="admin-product-preview-inner">
                <div className="admin-product-preview-thumb">
                  {previewThumb ? (
                    <img src={previewThumb} alt="" />
                  ) : (
                    <motionlessPlaceholder />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-900">{previewName}</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    {Number.isFinite(previewPrice) && previewPrice > 0 ? (
                      <span className="text-base font-bold text-stone-900">{formatInr(previewPrice)}</span>
                    ) : (
                      <span className="text-base font-bold text-stone-400">₹—</span>
                    )}
                    {Number.isFinite(previewCompare) && previewCompare > previewPrice ? (
                      <span className="text-xs text-stone-500 line-through">{formatInr(previewCompare)}</span>
                    ) : null}
                    {discount ? <span className="admin-preview-badge">{discount}% OFF</span> : null}
                  </div>
                  <div className="admin-preview-swatches">
                    {(selectedColors.length ? selectedColors : ['Black']).map((c) => (
                      <span
                        key={c}
                        className="admin-preview-swatch"
                        style={{ background: colorDot(c) }}
                        title={c}
                      />
                    ))}
                  </div>
                  <div className="admin-preview-sizes">
                    {(selectedSizes.length ? selectedSizes : ['M']).map((s) => (
                      <span key={s} className="admin-preview-size">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function motionlessPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
      <Shirt size={28} className="text-stone-400" strokeWidth={1.25} />
    </div>
  );
}
