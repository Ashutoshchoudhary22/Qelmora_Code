import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlignLeft,
  Check,
  CloudUpload,
  Layers,
  Link2,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from './AdminOfferTileCard';
import { MediaAssetCard } from './MediaAssetCard';
import { UploadSizeHint } from './UploadSizeHint';
import { uploadToCloudinary } from '../../lib/cloudinary';

const PREMIUM_GUIDELINES_BY_VARIANT = {
  categoryCard: [
    { label: 'Size', value: '1200×1200 px or 600×1125 px' },
    { label: 'Format', value: 'JPG, PNG, or WebP' },
    { label: 'File size', value: 'Under 800 KB' },
    { label: 'Video', value: 'MP4, under 15 MB (optional)' },
  ],
  offerTile: [
    { label: 'Size', value: '800×800 px (1:1)' },
    { label: 'Format', value: 'JPG, PNG, or WebP' },
    { label: 'File size', value: 'Under 500 KB' },
    { label: 'Video', value: 'MP4, under 15 MB (optional)' },
  ],
};

function premiumGuidelines(sizeVariant) {
  return PREMIUM_GUIDELINES_BY_VARIANT[sizeVariant] || PREMIUM_GUIDELINES_BY_VARIANT.categoryCard;
}

function premiumUploadHint(sizeVariant) {
  if (sizeVariant === 'offerTile') {
    return 'Size: 800×800 px (1:1) for shop offer carousel. JPG/WebP, under 500 KB';
  }
  return 'Size: 1200×1200 px (1:1) or 600×1125 px (9:16), JPG/WebP, under 800 KB';
}

const EMPTY_FORM = {
  title: '',
  ctaLink: '',
  secureUrl: '',
  resourceType: 'image',
  publicId: '',
  sortOrder: 0,
};

export function ShopOfferPanel({
  placement,
  label,
  previewPath,
  description,
  sizeVariant = 'offerTile',
  variant = 'default',
  sectionOnly = false,
}) {
  const qc = useQueryClient();
  const premium = variant === 'premium';
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners', placement],
    queryFn: async () => (await api.get(`/banners/admin?placement=${placement}`)).data,
  });

  const removeBanner = useMutation({
    mutationFn: (id) => api.delete(`/banners/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners', placement] });
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['banners', placement] });
    },
  });

  const items = data?.items || [];

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/offers', '/banners/admin/cloudinary-signature');
      setForm((f) => ({
        ...f,
        secureUrl: meta.secure_url,
        resourceType: meta.resource_type === 'video' ? 'video' : 'image',
        publicId: meta.public_id,
      }));
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function clearForm() {
    const nextOrder = items.length;
    setForm({ ...EMPTY_FORM, sortOrder: nextOrder });
    setMsg('');
  }

  async function save() {
    if (!form.secureUrl) return setMsg('Upload an offer image first.');
    if (!form.title.trim()) return setMsg('Add a short label (used for alt text).');
    setMsg('');
    const sortOrder = form.sortOrder === '' || form.sortOrder === undefined ? items.length : Number(form.sortOrder);
    try {
      await api.post('/banners/admin', {
        title: form.title.trim(),
        subtitle: null,
        placement,
        ctaLabel: null,
        ctaLink: form.ctaLink.trim() || null,
        secureUrl: form.secureUrl,
        resourceType: form.resourceType,
        publicId: form.publicId,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : items.length,
        isActive: true,
      });
      qc.invalidateQueries({ queryKey: ['admin-banners', placement] });
      qc.invalidateQueries({ queryKey: ['banners', placement] });
      const nextOrder = items.length + 1;
      setForm({ ...EMPTY_FORM, sortOrder: nextOrder });
      setMsg(`Saved — preview on ${previewPath}`);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  function confirmRemove(id) {
    if (window.confirm('Remove this offer tile?')) removeBanner.mutate(id);
  }

  const tilesSection = (
    <>
      {isLoading ? (
        <p className={premium ? 'admin-products-empty !py-8' : 'mt-6 text-stone-500'}>Loading offers…</p>
      ) : items.length > 0 ? (
        <div
          className={
            premium ? 'admin-offer-tile-grid' : 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {items.map((b) => {
            const url = b.secure_url || b.secureUrl;
            const type = b.resource_type || b.resourceType || 'image';
            if (premium) {
              return (
                <AdminOfferTileCard
                  key={b.id}
                  secureUrl={url}
                  resourceType={type}
                  downloadName={`offer-${b.id}`}
                  onRemove={() => confirmRemove(b.id)}
                />
              );
            }
            return (
              <div key={b.id} className="space-y-2">
                <MediaAssetCard secureUrl={url} resourceType={type} label={b.title} downloadName={`offer-${b.id}`} />
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-red-400/80 hover:text-red-300"
                  onClick={() => confirmRemove(b.id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={premium ? 'admin-product-hint' : 'mt-6 text-sm text-stone-600'}>
          No offers yet{label ? ` for ${label}` : ''}.
        </p>
      )}
    </>
  );

  const formFields = premium ? (
    <>
      <OfferFieldLabel id="offer-label" text="Label" />
      <div className="admin-field-icon-wrap">
        <AlignLeft className="admin-field-icon" size={16} />
        <input
          id="offer-label"
          className="admin-product-input"
          placeholder="Label (e.g. Extra ₹500 Off on Sweatshirts)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <OfferFieldLabel id="offer-link" text="Link on click" className="mt-3" />
      <div className="admin-field-icon-wrap">
        <Link2 className="admin-field-icon" size={16} />
        <input
          id="offer-link"
          className="admin-product-input"
          placeholder="Link on click (optional, e.g. /shop/men)"
          value={form.ctaLink}
          onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
        />
      </div>

      <OfferFieldLabel id="offer-sort" text="Sort order" className="mt-3" />
      <div className="admin-field-icon-wrap">
        <SlidersHorizontal className="admin-field-icon" size={16} />
        <input
          id="offer-sort"
          className="admin-product-input"
          type="number"
          min={0}
          placeholder="Sort Order (e.g. 0, 1, 2)"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
        />
      </div>

      <label className="admin-offer-upload-btn mt-4">
        <CloudUpload size={18} />
        {uploading ? 'Uploading…' : form.secureUrl ? 'Replace Offer Image' : 'Upload Offer Image'}
        <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
      </label>
      <p className="admin-product-hint mt-2">{premiumUploadHint(sizeVariant)}</p>
      {form.secureUrl && (
        <div className="mt-4 max-w-[220px]">
          <AdminOfferTileCard
            secureUrl={form.secureUrl}
            resourceType={form.resourceType}
            downloadName="offer-draft"
            onRemove={() => setForm((f) => ({ ...f, secureUrl: '', publicId: '' }))}
          />
        </div>
      )}
    </>
  ) : (
    <>
      <input
        className="input-field"
        placeholder="Label (alt text, e.g. Extra ₹500 off sweaters)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <input
        className="input-field"
        placeholder="Link on click (optional, e.g. /shop/men)"
        value={form.ctaLink}
        onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
      />
      <input
        className="input-field"
        type="number"
        min={0}
        placeholder="Sort order (0 = left)"
        value={form.sortOrder}
        onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
      />
      <label className="btn-primary btn-accent inline-flex cursor-pointer text-[10px]">
        {uploading ? 'Uploading…' : form.secureUrl ? 'Replace image' : 'Upload offer image'}
        <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
      </label>
      <UploadSizeHint variant={sizeVariant} video className="mt-1" />
    </>
  );

  if (premium) {
    const outerClass = sectionOnly ? 'admin-shop-category-body' : 'admin-products-body admin-shop-category-body';
    return (
      <div className={outerClass}>
        <section className="admin-product-card">
          <div className="admin-product-card-head">
            <span className="admin-product-card-head-icon">
              <Layers size={16} />
            </span>
            {label}
          </div>
          {description && <p className="admin-product-hint -mt-2 mb-4">{description}</p>}
          {tilesSection}
        </section>

        <div className="admin-shop-category-form-row">
          <section className="admin-product-card">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <Tag size={16} />
              </span>
              Add Offer Tile
            </div>
            <div className="admin-product-fields">{formFields}</div>
            <div className="admin-product-actions mt-6">
              <button type="button" className="admin-btn-add" onClick={save}>
                <Check size={16} />
                Save Offer
              </button>
              <button type="button" className="admin-btn-cancel" onClick={clearForm}>
                <X size={16} />
                Clear
              </button>
            </div>
            {msg && (
              <p className={`admin-product-hint mt-3 ${msg.includes('failed') || msg.includes('Upload') ? 'admin-product-msg' : 'text-[#15803d]'}`}>
                {msg}
              </p>
            )}
          </section>

          <aside className="admin-shop-category-guidelines">
            <h3 className="text-sm font-semibold text-stone-900">Image guidelines</h3>
            <ul className="admin-guidelines-list">
              {premiumGuidelines(sizeVariant).map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
            <div
              className="admin-guidelines-thumb"
              style={{ backgroundImage: 'url(/profile/QELMORA-admin.png)' }}
              aria-hidden
            />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5 lg:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-light">{label}</h2>
        <span className="text-[10px] uppercase tracking-widest text-stone-600">{previewPath}</span>
      </div>
      <p className="mt-2 text-sm text-stone-500">
        {description ||
          'Add as many offer images as you like. Up to 3 show at once on desktop (1 on mobile); extra tiles auto-scroll every few seconds.'}
      </p>

      {tilesSection}

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-[10px] uppercase tracking-widest text-q-accent">Add offer tile</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">{formFields}</div>
          {form.secureUrl ? (
            <MediaAssetCard
              secureUrl={form.secureUrl}
              resourceType={form.resourceType}
              label="Preview"
              downloadName="offer-draft"
              onRemove={() => setForm((f) => ({ ...f, secureUrl: '', publicId: '' }))}
            />
          ) : (
            <UploadSizeHint variant={sizeVariant} video />
          )}
        </div>
        <button type="button" className="btn-primary mt-6 w-full max-w-xs text-[10px]" onClick={save}>
          Save offer
        </button>
        {msg && <p className="mt-3 text-sm text-stone-400">{msg}</p>}
      </div>
    </div>
  );
}

function OfferFieldLabel({ id, text, className = '' }) {
  return (
    <label className={`admin-field-label ${className}`} htmlFor={id}>
      {text}
    </label>
  );
}