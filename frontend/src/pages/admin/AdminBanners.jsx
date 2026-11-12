import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function AdminBanners() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
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
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/banners', '/banners/admin/cloudinary-signature');
      setForm((f) => ({
        ...f,
        secureUrl: meta.secure_url,
        resourceType: meta.resource_type,
        publicId: meta.public_id,
      }));
    } catch (ex) {
      setErr(ex.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function save() {
    if (!form.secureUrl) {
      setErr('Upload an image or video first');
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
    });
  }

  async function removeBanner(id) {
    if (!window.confirm('Remove this banner?')) return;
    await api.delete(`/banners/admin/${id}`);
    qc.invalidateQueries({ queryKey: ['admin-banners'] });
  }

  const items = data?.items || [];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl font-light">Banners & homepage media</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-500">
          Files upload to Cloudinary first, then save to the site. You can preview and download any asset below.
        </p>
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
              return (
                <div key={b.id} className="space-y-2">
                  <MediaAssetCard
                    secureUrl={url}
                    publicId={pid}
                    resourceType={type}
                    label={`[${b.placement}] ${b.title}`}
                    downloadName={`banner-${b.id}`}
                  />
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
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div>
            {form.secureUrl ? (
              <MediaAssetCard
                secureUrl={form.secureUrl}
                publicId={form.publicId}
                resourceType={form.resourceType}
                label="Ready to save"
                onRemove={() => setForm((f) => ({ ...f, secureUrl: '', publicId: '' }))}
                downloadName={form.publicId?.split('/').pop() || 'banner-draft'}
              />
            ) : (
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/20 bg-black/30 px-4 text-center transition hover:border-q-accent/50 hover:bg-black/40">
                <Upload className="text-stone-500" size={28} strokeWidth={1.25} />
                <span className="text-[10px] uppercase tracking-widest text-stone-400">
                  {uploading ? 'Uploading to Cloudinary…' : 'Choose image or video'}
                </span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="space-y-3">
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
            {!form.secureUrl && (
              <label className="btn-primary btn-accent inline-flex w-full cursor-pointer justify-center text-[10px]">
                <Upload size={14} />
                Upload media
                <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
            )}
            <button type="button" className="btn-primary btn-accent w-full" onClick={save} disabled={!form.title || !form.secureUrl}>
              Save banner to site
            </button>
            {err && <p className="text-sm text-red-400/90">{err}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
