import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint, bannerPlacementSize } from '../../components/admin/UploadSizeHint';

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

  const [form, setForm] = useState({
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
  });

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

  async function save() {
    if (!form.secureUrl) {
      setErr('Upload desktop image or video first');
      return;
    }
    setErr('');
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
    setForm({
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
    });
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

  const items = data?.items || [];
  const sizeVariant = bannerPlacementSize(form.placement);

  function UploadSlot({ label, hint, url, type, pid, uploadingFlag, onChange, onClear, replaceBusy }) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-stone-500">{label}</p>
        <UploadSizeHint variant={hint} video />
        {url ? (
          <MediaAssetCard
            secureUrl={url}
            publicId={pid}
            resourceType={type}
            label={label}
            onRemove={onClear}
            onReplace={onChange}
            replaceBusy={replaceBusy || uploadingFlag}
            downloadName={pid?.split('/').pop() || 'banner-draft'}
          />
        ) : (
          <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 bg-black/30 px-4 text-center transition hover:border-q-accent/50 hover:bg-black/40">
            <Upload className="text-stone-500" size={28} strokeWidth={1.25} />
            <span className="text-[10px] uppercase tracking-widest text-stone-400">
              {uploadingFlag ? 'Uploading…' : 'Choose image or video'}
            </span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={onChange} disabled={uploadingFlag} />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl font-light">Banners & homepage media</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-500">
          Upload desktop and mobile assets (hero uses mobile below <code className="text-stone-400">md</code> breakpoint).
          Use <strong className="font-medium text-stone-400">Replace</strong> on a live banner to swap media without deleting the row.
        </p>
        {err && <p className="mt-3 text-sm text-red-400/90">{err}</p>}
      </div>

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Live banners</h2>
        {isLoading ? (
          <p className="mt-4 text-stone-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">No banners yet — add one below.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => {
              const url = b.secure_url || b.secureUrl;
              const type = b.resource_type || b.resourceType || 'image';
              const pid = b.public_id || b.publicId;
              const mUrl = b.mobile_secure_url || b.mobileSecureUrl;
              const mType = b.mobile_resource_type || b.mobileResourceType || 'image';
              return (
                <div key={b.id} className="space-y-2 rounded-lg border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">
                    [{b.placement}] {b.title}
                  </p>
                  <MediaAssetCard
                    secureUrl={url}
                    publicId={pid}
                    resourceType={type}
                    label="Desktop"
                    downloadName={`banner-${b.id}-desktop`}
                    onReplace={(e) => replaceExistingMedia(b.id, 'desktop', e)}
                    replaceBusy={replacingKey === `${b.id}-desktop`}
                  />
                  {mUrl ? (
                    <MediaAssetCard
                      secureUrl={mUrl}
                      publicId={b.mobile_public_id || b.mobilePublicId}
                      resourceType={mType}
                      label="Mobile"
                      downloadName={`banner-${b.id}-mobile`}
                      onReplace={(e) => replaceExistingMedia(b.id, 'mobile', e)}
                      replaceBusy={replacingKey === `${b.id}-mobile`}
                    />
                  ) : (
                    <label className="btn-primary block cursor-pointer text-center text-[10px]">
                      Add mobile asset
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => replaceExistingMedia(b.id, 'mobile', e)}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-widest text-red-400/80 hover:text-red-300"
                    onClick={() => removeBanner(b.id)}
                  >
                    Delete banner
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0e0e0e] p-6">
        <h2 className="text-[10px] uppercase tracking-[0.35em] text-q-accent">New banner</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <UploadSlot
            label="Desktop / tablet"
            hint={sizeVariant}
            url={form.secureUrl}
            type={form.resourceType}
            pid={form.publicId}
            uploadingFlag={uploading}
            onChange={(e) => onFile(e, 'desktop')}
            onClear={() => setForm((f) => ({ ...f, secureUrl: '', publicId: '' }))}
            replaceBusy={uploading}
          />
          <UploadSlot
            label="Mobile (optional)"
            hint={form.placement === 'hero' ? 'heroMobile' : sizeVariant}
            url={form.mobileSecureUrl}
            type={form.mobileResourceType}
            pid={form.mobilePublicId}
            uploadingFlag={uploadingMobile}
            onChange={(e) => onFile(e, 'mobile')}
            onClear={() => setForm((f) => ({ ...f, mobileSecureUrl: '', mobilePublicId: '' }))}
            replaceBusy={uploadingMobile}
          />
        </div>

        <div className="mt-8 space-y-3">
          <input
            className="input-field"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Subtitle"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <select
            className="input-field"
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value })}
          >
            <option value="hero">Hero</option>
            <option value="promo">Promo</option>
            <option value="collection">Collection</option>
            <option value="announcement">Announcement</option>
            <option value="shop_men">Shop — Men offers</option>
            <option value="shop_women">Shop — Women offers</option>
            <option value="shop_trending_men">Shop — Men trending categories</option>
            <option value="shop_trending_women">Shop — Women trending categories</option>
            <option value="home_shop_by_category">Home — Shop by category</option>
            <option value="page_nowhere_else">Page — Nowhere Else</option>
          </select>
          <input
            className="input-field"
            placeholder="CTA label (optional)"
            value={form.ctaLabel}
            onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="CTA link (optional)"
            value={form.ctaLink}
            onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
          />
          <button type="button" className="btn-primary btn-accent w-full" onClick={save} disabled={!form.title || !form.secureUrl}>
            Save banner to site
          </button>
          {err && <p className="text-sm text-red-400/90">{err}</p>}
        </div>
      </section>
    </div>
  );
}