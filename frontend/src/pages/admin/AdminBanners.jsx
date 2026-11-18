import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlignLeft,
  Check,
  CloudUpload,
  Image,
  Layers,
  Link2,
  Plus,
  SlidersHorizontal,
  Tag,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from '../../components/admin/AdminOfferTileCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { bannerPlacementSize } from '../../components/admin/UploadSizeHint';

const CORE_PLACEMENTS = new Set(['hero', 'promo', 'collection', 'announcement']);
const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  placement: 'hero',
  ctaLabel: '',
  ctaLink: '',
  secureUrl: '',
  resourceType: 'image',
  publicId: '',
  mobileSecureUrl: '',
  mobileResourceType: 'image',
  mobilePublicId: '',
};

function guidelinesForPlacement(placement) {
  const desktop = bannerPlacementSize(placement);
  const rows = [
    {
      label: 'Desktop',
      value:
        desktop === 'hero'
          ? '1920×1080 px (16:9), under 800 KB'
          : desktop === 'promoWide'
            ? '1920×720 px wide, under 800 KB'
            : '1600×900 px (16:9), under 700 KB',
    },
    { label: 'Format', value: 'JPG, PNG, or WebP' },
    { label: 'Video', value: 'MP4, under 15 MB (optional)' },
  ];
  if (placement === 'hero') {
    rows.splice(1, 0, { label: 'Mobile', value: '1080×1350 or 1080×1920, under 600 KB' });
  }
  return rows;
}

export default function AdminBanners() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [replacingKey, setReplacingKey] = useState(null);
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => (await api.get('/banners/admin')).data,
  });

  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function uploadFile(file, target) {
    const meta = await uploadToCloudinary(file, 'qelmora/banners', '/banners/admin/cloudinary-signature');
    if (target === 'desktop') {
      setForm((f) => ({
        ...f,
        secureUrl: meta.secure_url,
        resourceType: meta.resource_type,
        publicId: meta.public_id,
      }));
    } else {
      setForm((f) => ({
        ...f,
        mobileSecureUrl: meta.secure_url,
        mobileResourceType: meta.resource_type,
        mobilePublicId: meta.public_id,
      }));
    }
  }

  async function onFile(e, target = 'desktop') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === 'desktop') setUploading(true);
    else setUploadingMobile(true);
    setErr('');
    try {
      await uploadFile(file, target);
    } catch (ex) {
      setErr(ex.message || 'Upload failed');
    } finally {
      if (target === 'desktop') setUploading(false);
      else setUploadingMobile(false);
      e.target.value = '';
    }
  }

  function clearNewForm() {
    setForm({ ...EMPTY_FORM });
    setErr('');
  }

  async function save() {
    if (!form.secureUrl) {
      setErr('Upload desktop image or video first');
      return;
    }
    setErr('');
    try {
      await api.post('/banners/admin', {
        title: form.title,
        subtitle: form.subtitle,
        placement: form.placement,
        ctaLabel: form.ctaLabel,
        ctaLink: form.ctaLink,
        secureUrl: form.secureUrl,
        resourceType: form.resourceType,
        publicId: form.publicId,
        mobileSecureUrl: form.mobileSecureUrl || null,
        mobileResourceType: form.mobileSecureUrl ? form.mobileResourceType : null,
        mobilePublicId: form.mobilePublicId || null,
      });
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      setForm({ ...EMPTY_FORM });
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    }
  }

  async function removeBanner(id) {
    if (!window.confirm('Remove this banner?')) return;
    await api.delete(`/banners/admin/${id}`);
    qc.invalidateQueries({ queryKey: ['admin-banners'] });
  }

  async function replaceExistingMedia(bannerId, slot, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `${bannerId}-${slot}`;
    setReplacingKey(key);
    setErr('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/banners', '/banners/admin/cloudinary-signature');
      const payload =
        slot === 'desktop'
          ? {
              secureUrl: meta.secure_url,
              resourceType: meta.resource_type,
              publicId: meta.public_id,
            }
          : {
              mobileSecureUrl: meta.secure_url,
              mobileResourceType: meta.resource_type,
              mobilePublicId: meta.public_id,
            };
      await api.patch(`/banners/admin/${bannerId}`, payload);
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
    } catch (ex) {
      setErr(ex.message || 'Replace failed');
    } finally {
      setReplacingKey(null);
      e.target.value = '';
    }
  }

  const items = (data?.items || []).filter((b) => CORE_PLACEMENTS.has(b.placement));
  const sizeVariant = bannerPlacementSize(form.placement);
  const mobileHint = form.placement === 'hero' ? 'heroMobile' : sizeVariant;

  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <Image size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Banners &amp; Media</h1>
              <p>
                Hero, promo, collection, and announcement only. Shop offers, trending categories, shop by category, and
                Nowhere Else each have their own admin module. Hero uses mobile assets below the md breakpoint.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body admin-shop-category-body">
        <section className="admin-product-card">
          <div className="admin-product-card-head">
            <span className="admin-product-card-head-icon">
              <Layers size={16} />
            </span>
            Live banners
          </div>
          <p className="admin-product-hint -mt-2 mb-4">Replace on a live card swaps media without deleting the row.</p>

          {isLoading ? (
            <p className="admin-product-hint">Loading…</p>
          ) : items.length === 0 ? (
            <p className="admin-product-hint">No banners yet — add one below.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((b) => {
                const url = b.secure_url || b.secureUrl;
                const type = b.resource_type || b.resourceType || 'image';
                const pid = b.public_id || b.publicId;
                const mUrl = b.mobile_secure_url || b.mobileSecureUrl;
                const mType = b.mobile_resource_type || b.mobileResourceType || 'image';
                const replacingDesktop = replacingKey === `${b.id}-desktop`;
                const replacingMobile = replacingKey === `${b.id}-mobile`;

                return (
                  <article key={b.id} className="admin-account-tile-card space-y-3">
                    <p className="admin-products-name text-left">
                      [{b.placement}] {b.title}
                    </p>
                    <PremiumUploadSlot
                      label="Desktop"
                      url={url}
                      type={type}
                      pid={pid}
                      uploading={replacingDesktop}
                      onPick={(e) => replaceExistingMedia(b.id, 'desktop', e)}
                      downloadName={`banner-${b.id}-desktop`}
                    />
                    {mUrl ? (
                      <PremiumUploadSlot
                        label="Mobile"
                        url={mUrl}
                        type={mType}
                        pid={b.mobile_public_id || b.mobilePublicId}
                        uploading={replacingMobile}
                        onPick={(e) => replaceExistingMedia(b.id, 'mobile', e)}
                        downloadName={`banner-${b.id}-mobile`}
                      />
                    ) : (
                      <label className="admin-offer-upload-btn !w-full text-[10px]">
                        <CloudUpload size={16} />
                        Add mobile asset
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => replaceExistingMedia(b.id, 'mobile', e)} />
                      </label>
                    )}
                    <button type="button" className="admin-products-icon-btn admin-products-icon-btn--danger !w-full" onClick={() => removeBanner(b.id)}>
                      <Trash2 size={15} />
                      Delete banner
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="admin-shop-category-form-row">
          <section className="admin-product-card">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <Plus size={16} />
              </span>
              New banner
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <PremiumUploadSlot
                label="Desktop / tablet"
                hintKey={sizeVariant}
                url={form.secureUrl}
                type={form.resourceType}
                pid={form.publicId}
                uploading={uploading}
                onPick={(e) => onFile(e, 'desktop')}
                onClear={() => setForm((f) => ({ ...f, secureUrl: '', publicId: '' }))}
                downloadName="banner-draft-desktop"
              />
              <PremiumUploadSlot
                label="Mobile (optional)"
                hintKey={mobileHint}
                url={form.mobileSecureUrl}
                type={form.mobileResourceType}
                pid={form.mobilePublicId}
                uploading={uploadingMobile}
                onPick={(e) => onFile(e, 'mobile')}
                onClear={() => setForm((f) => ({ ...f, mobileSecureUrl: '', mobilePublicId: '' }))}
                downloadName="banner-draft-mobile"
              />
            </div>

            <div className="admin-product-fields mt-6">
              <BannerField id="bn-title" label="Title" icon={Type} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
              <BannerField id="bn-sub" label="Subtitle" icon={AlignLeft} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Subtitle" />
              <div>
                <label className="admin-field-label" htmlFor="bn-placement">
                  Placement
                </label>
                <div className="admin-field-icon-wrap">
                  <SlidersHorizontal className="admin-field-icon" size={16} />
                  <select
                    id="bn-placement"
                    className="admin-product-input appearance-none"
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  >
                    <option value="hero">Hero</option>
                    <option value="promo">Promo</option>
                    <option value="collection">Collection</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
              </div>
              <BannerField id="bn-cta" label="CTA label (optional)" icon={Tag} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="CTA label" />
              <BannerField id="bn-link" label="CTA link (optional)" icon={Link2} value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="CTA link" />
            </div>

            <div className="admin-product-actions mt-6">
              <button type="button" className="admin-btn-add" onClick={save} disabled={!form.title || !form.secureUrl}>
                <Check size={16} />
                Save Banner to Site
              </button>
              <button type="button" className="admin-btn-cancel" onClick={clearNewForm}>
                <X size={16} />
                Clear
              </button>
            </div>
            {err && <p className="admin-product-msg mt-3">{err}</p>}
          </section>

          <aside className="admin-shop-category-guidelines">
            <h3 className="text-sm font-semibold text-stone-900">Image guidelines</h3>
            <p className="admin-product-hint mt-1">Based on placement: {form.placement}</p>
            <ul className="admin-guidelines-list">
              {guidelinesForPlacement(form.placement).map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
            <div className="admin-guidelines-thumb" style={{ backgroundImage: 'url(/profile/QELMORA-admin.png)' }} aria-hidden />
          </aside>
        </div>
      </div>
    </div>
  );
}

function BannerField({ id, label, icon: Icon, placeholder, value, onChange }) {
  return (
    <div>
      <label className="admin-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="admin-field-icon-wrap">
        <Icon className="admin-field-icon" size={16} />
        <input id={id} className="admin-product-input" placeholder={placeholder} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function PremiumUploadSlot({ label, hintKey, url, type, pid, uploading, onPick, onClear, downloadName }) {
  const hintText =
    hintKey === 'hero'
      ? '1920×1080 px (16:9), under 800 KB'
      : hintKey === 'heroMobile'
        ? '1080×1350 or 1080×1920, under 600 KB'
        : hintKey === 'promoWide'
          ? '1920×720 px, under 800 KB'
          : '1600×900 px (16:9), under 700 KB';

  return (
    <div>
      <p className="admin-field-label">{label}</p>
      <p className="admin-product-hint mb-2">{hintText} · MP4 optional</p>
      {url ? (
        <AdminOfferTileCard secureUrl={url} resourceType={type} downloadName={downloadName || pid?.split('/').pop() || 'banner'} onRemove={onClear} />
      ) : (
        <div className="admin-upload-zone py-8">
          <CloudUpload size={28} className="text-[#c4a574]" strokeWidth={1.25} />
          <p>{uploading ? 'Uploading…' : 'Choose image or video'}</p>
          <label className="admin-upload-btn">
            Upload
            <input type="file" accept="image/*,video/*" className="hidden" onChange={onPick} disabled={uploading} />
          </label>
        </div>
      )}
      {url && (
        <label className="admin-offer-upload-btn mt-3 !w-full text-[10px]">
          <CloudUpload size={16} />
          {uploading ? 'Replacing…' : 'Replace'}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onPick} disabled={uploading} />
        </label>
      )}
    </div>
  );
}