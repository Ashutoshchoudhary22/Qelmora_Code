import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlignLeft, Check, CloudUpload, Image, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from './AdminOfferTileCard';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from './UploadSizeHint';

const HERO_GUIDELINES = [
  { label: 'Size', value: '1600×520 px or wider (3:1)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 700 KB' },
  { label: 'Layout', value: 'Right-weighted so left text stays readable' },
];

export function AccountHeroEditor({ variant = 'default' }) {
  const premium = variant === 'premium';
  const qc = useQueryClient();
  const [form, setForm] = useState({
    headline: 'Profile header background',
    imageUrl: '',
    mediaType: 'image',
  });
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['content', 'account_hero'],
    queryFn: async () => (await api.get('/content/account_hero')).data,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      headline: data.headline || 'Profile header background',
      imageUrl: data.imageUrl || '',
      mediaType: data.mediaType || 'image',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.patch('/content/admin/account_hero', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', 'account_hero'] }),
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/account', '/content/admin/cloudinary-signature');
      setForm((f) => ({
        ...f,
        imageUrl: meta.secure_url,
        mediaType: meta.resource_type === 'video' ? 'video' : 'image',
      }));
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function resetForm() {
    if (!data) return;
    setForm({
      headline: data.headline || 'Profile header background',
      imageUrl: data.imageUrl || '',
      mediaType: data.mediaType || 'image',
    });
    setMsg('');
  }

  async function submit() {
    if (!form.imageUrl) return setMsg('Upload a background image (required).');
    setMsg('');
    try {
      await save.mutateAsync({
        eyebrow: 'Account',
        headline: form.headline.trim() || 'Profile header background',
        body: 'Wide lifestyle image behind the hello card on /account.',
        imageUrl: form.imageUrl,
        mediaType: form.mediaType || 'image',
      });
      setMsg('Saved — open /account to preview.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) {
    return <p className={premium ? 'admin-product-hint' : 'text-stone-500'}>Loading account hero…</p>;
  }

  if (premium) {
    return (
      <div className="admin-shop-category-form-row">
        <section className="admin-product-card">
          <div className="admin-product-card-head">
            <span className="admin-product-card-head-icon">
              <Image size={16} />
            </span>
            <span className="min-w-0 flex-1">
              Profile hero background
              <span className="admin-product-hint mt-0.5 block font-normal normal-case tracking-normal">
                Background on{' '}
                <a href="/account" target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
                  /account
                </a>
                . Customer name, email, and phone still come from their profile.
              </span>
            </span>
          </div>

          <div className="admin-product-fields">
            <div>
              <label className="admin-field-label" htmlFor="account-hero-label">
                Internal label (admin only)
              </label>
              <div className="admin-field-icon-wrap">
                <AlignLeft className="admin-field-icon" size={16} />
                <input
                  id="account-hero-label"
                  className="admin-product-input"
                  placeholder="Internal label (admin only)"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                />
              </div>
            </div>
          </div>

          {form.imageUrl ? (
            <div className="mt-4 max-w-[280px]">
              <AdminOfferTileCard
                secureUrl={form.imageUrl}
                resourceType={form.mediaType}
                downloadName="account-hero"
                onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
              />
            </div>
          ) : (
            <p className="admin-product-hint mt-4">No background yet — upload required before save.</p>
          )}

          <label className="admin-offer-upload-btn mt-4">
            <CloudUpload size={18} />
            {uploading ? 'Uploading…' : form.imageUrl ? 'Replace Background' : 'Upload Background Image'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onFile} />
          </label>
          <p className="admin-product-hint mt-2">1600×900 px (16:9) or wider lifestyle shot. JPG/WebP, under 700 KB</p>

          <div className="admin-product-actions mt-6">
            <button type="button" className="admin-btn-add" onClick={submit} disabled={save.isPending}>
              <Check size={16} />
              {save.isPending ? 'Saving…' : 'Save Account Hero'}
            </button>
            <button type="button" className="admin-btn-cancel" onClick={resetForm}>
              <X size={16} />
              Reset
            </button>
          </div>
          {msg && (
            <p
              className={`admin-product-hint mt-3 ${msg.includes('failed') || msg.includes('required') || msg.includes('Upload') ? 'admin-product-msg' : 'text-[#15803d]'}`}
            >
              {msg}
            </p>
          )}
        </section>

        <aside className="admin-shop-category-guidelines">
          <h3 className="text-sm font-semibold text-stone-900">Image guidelines</h3>
          <ul className="admin-guidelines-list">
            {HERO_GUIDELINES.map((row) => (
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
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5 lg:p-6">
      <p className="text-sm text-stone-500">
        Background for the profile card on <span className="text-stone-300">/account</span>. Name, email, and phone still come from
        the customer profile — only this image is managed here.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <input
            className="input-field"
            placeholder="Internal label (admin only)"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          <label className="btn-primary btn-accent mt-2 inline-flex cursor-pointer text-[10px]">
            {uploading ? 'Uploading…' : form.imageUrl ? 'Replace background' : 'Upload background image'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onFile} />
          </label>
          <UploadSizeHint variant="wide" className="mt-2" />
          <p className="text-[10px] leading-relaxed text-stone-600">
            Recommended: 1600×520 px or wider (3:1). Lifestyle / product shot, right-weighted so text on the left stays readable.
          </p>
        </div>

        {form.imageUrl ? (
          <MediaAssetCard
            secureUrl={form.imageUrl}
            resourceType={form.mediaType}
            label="Account hero preview"
            downloadName="account-hero"
            onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
          />
        ) : (
          <UploadSizeHint variant="wide" />
        )}
      </div>

      <button type="button" className="btn-primary mt-6 w-full max-w-xs text-[10px]" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save account hero'}
      </button>
      {msg && <p className="mt-3 text-sm text-stone-400">{msg}</p>}
    </div>
  );
}
