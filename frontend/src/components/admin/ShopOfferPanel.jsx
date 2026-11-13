import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from './MediaAssetCard';
import { UploadSizeHint } from './UploadSizeHint';
import { uploadToCloudinary } from '../../lib/cloudinary';

export function ShopOfferPanel({ placement, label, previewPath, description, sizeVariant = 'offerTile' }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    ctaLink: '',
    secureUrl: '',
    resourceType: 'image',
    publicId: '',
    sortOrder: 0,
  });
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
      setForm({
        title: '',
        ctaLink: '',
        secureUrl: '',
        resourceType: 'image',
        publicId: '',
        sortOrder: nextOrder,
      });
      setMsg(`Saved — preview on ${previewPath}`);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  const items = data?.items || [];

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

      {isLoading ? (
        <p className="mt-6 text-stone-500">Loading offers…</p>
      ) : items.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => {
            const url = b.secure_url || b.secureUrl;
            const type = b.resource_type || b.resourceType || 'image';
            return (
              <div key={b.id} className="space-y-2">
                <MediaAssetCard secureUrl={url} resourceType={type} label={b.title} downloadName={`offer-${b.id}`} />
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-red-400/80 hover:text-red-300"
                  onClick={() => {
                    if (window.confirm('Remove this offer tile?')) removeBanner.mutate(b.id);
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm text-stone-600">No offers yet for {label}.</p>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-[10px] uppercase tracking-widest text-q-accent">Add offer tile</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
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
          </div>
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
