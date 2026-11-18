import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlignLeft, Check, CloudUpload, LogIn, Type, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from './AdminOfferTileCard';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from './UploadSizeHint';

const LOGIN_GUIDELINES = [
  { label: 'Size', value: '900×1200 px (3:4) side panel' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 600 KB' },
  { label: 'Video', value: 'MP4, under 15 MB (optional)' },
];

export function LoginBannerEditor({ variant = 'default' }) {
  const premium = variant === 'premium';
  const qc = useQueryClient();
  const [form, setForm] = useState({
    eyebrow: '',
    headline: '',
    imageUrl: '',
    mediaType: 'image',
  });
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['content', 'login_banner'],
    queryFn: async () => (await api.get('/content/login_banner')).data,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      eyebrow: data.eyebrow || '',
      headline: data.headline || '',
      imageUrl: data.imageUrl || '',
      mediaType: data.mediaType || 'image',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.patch('/content/admin/login_banner', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', 'login_banner'] }),
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/auth', '/content/admin/cloudinary-signature');
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
      eyebrow: data.eyebrow || '',
      headline: data.headline || '',
      imageUrl: data.imageUrl || '',
      mediaType: data.mediaType || 'image',
    });
    setMsg('');
  }

  async function submit() {
    if (!form.imageUrl) return setMsg('Upload a banner image (required).');
    setMsg('');
    try {
      await save.mutateAsync({
        eyebrow: form.eyebrow.trim(),
        headline: form.headline.trim() || 'Welcome to QELMORA',
        body: null,
        imageUrl: form.imageUrl,
        mediaType: form.mediaType || 'image',
      });
      setMsg('Saved — open /login to preview.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) {
    return <p className={premium ? 'admin-product-hint' : 'text-stone-500'}>Loading login banner…</p>;
  }

  if (premium) {
    return (
      <div className="admin-shop-category-form-row">
        <section className="admin-product-card">
          <div className="admin-product-card-head">
            <span className="admin-product-card-head-icon">
              <LogIn size={16} />
            </span>
            <span className="min-w-0 flex-1">
              Login &amp; register banner
              <span className="admin-product-hint mt-0.5 block font-normal normal-case tracking-normal">
                Left panel on{' '}
                <a href="/login" target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
                  /login
                </a>{' '}
                and{' '}
                <a href="/register" target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
                  /register
                </a>
                . Use a tall portrait or lifestyle image.
              </span>
            </span>
          </div>

          <div className="admin-product-fields">
            <div>
              <label className="admin-field-label" htmlFor="login-banner-eyebrow">
                Eyebrow
              </label>
              <div className="admin-field-icon-wrap">
                <Type className="admin-field-icon" size={16} />
                <input
                  id="login-banner-eyebrow"
                  className="admin-product-input"
                  placeholder="Eyebrow (e.g. ALL EYES ON YOU)"
                  value={form.eyebrow}
                  onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="admin-field-label" htmlFor="login-banner-headline">
                Headline on banner
              </label>
              <div className="admin-field-icon-wrap">
                <AlignLeft className="admin-field-icon" size={16} />
                <input
                  id="login-banner-headline"
                  className="admin-product-input"
                  placeholder="Headline on banner"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                />
              </div>
            </div>
          </div>

          {form.imageUrl ? (
            <div className="mt-4 max-w-[240px]">
              <AdminOfferTileCard
                secureUrl={form.imageUrl}
                resourceType={form.mediaType}
                downloadName="login-banner"
                onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
              />
            </div>
          ) : (
            <p className="admin-product-hint mt-4">No banner image yet — upload required before save.</p>
          )}

          <label className="admin-offer-upload-btn mt-4">
            <CloudUpload size={18} />
            {uploading ? 'Uploading…' : form.imageUrl ? 'Replace Image / Video' : 'Upload Banner Image / Video'}
            <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
          </label>
          <p className="admin-product-hint mt-2">Size: 900×1200 px (3:4) for the side panel. JPG/WebP, under 600 KB</p>

          <div className="admin-product-actions mt-6">
            <button type="button" className="admin-btn-add" onClick={submit} disabled={save.isPending}>
              <Check size={16} />
              {save.isPending ? 'Saving…' : 'Save Login Banner'}
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
            {LOGIN_GUIDELINES.map((row) => (
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
        Left panel on <span className="text-stone-300">/login</span> and <span className="text-stone-300">/register</span>. Use a tall
        portrait or lifestyle image (like campaign art).
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <input
            className="input-field"
            placeholder="Eyebrow (e.g. ALL EYES ON YOU)"
            value={form.eyebrow}
            onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Headline on banner"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          <label className="btn-primary btn-accent mt-2 inline-flex cursor-pointer text-[10px]">
            {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image / video' : 'Upload banner image / video'}
            <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
          </label>
          <UploadSizeHint variant="loginSplit" video className="mt-2" />
        </div>

        {form.imageUrl ? (
          <MediaAssetCard
            secureUrl={form.imageUrl}
            resourceType={form.mediaType}
            label="Login banner preview"
            downloadName="login-banner"
            onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
          />
        ) : (
          <UploadSizeHint variant="loginSplit" video />
        )}
      </div>

      <button type="button" className="btn-primary mt-6 w-full max-w-xs text-[10px]" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save login banner'}
      </button>
      {msg && <p className="mt-3 text-sm text-stone-400">{msg}</p>}
    </div>
  );
}