import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, CloudUpload, Link2, Tag, Type, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from '../../components/admin/AdminOfferTileCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

const SECTION_KEY = 'brand_story';
const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

const BRAND_GUIDELINES = [
  { label: 'Size', value: '1000×1400 px (3:4) or 1600×900 px wide' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 700 KB' },
  { label: 'Video', value: 'MP4, under 15 MB (optional)' },
];

export default function AdminBrandStory() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    eyebrow: '',
    headline: '',
    body: '',
    ctaLabel: '',
    ctaLink: '',
    imageUrl: '',
    mediaType: 'image',
  });
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['content', SECTION_KEY],
    queryFn: async () => (await api.get(`/content/${SECTION_KEY}`)).data,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      eyebrow: data.eyebrow || '',
      headline: data.headline || '',
      body: data.body || '',
      ctaLabel: data.ctaLabel || '',
      ctaLink: data.ctaLink || '',
      imageUrl: data.imageUrl || '',
      mediaType: data.mediaType || 'image',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.patch(`/content/admin/${SECTION_KEY}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content', SECTION_KEY] });
      setMsg('Brand story saved — refresh the homepage.');
    },
    onError: (e) => setMsg(e.response?.data?.message || 'Save failed'),
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/brand', '/content/admin/cloudinary-signature');
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
      body: data.body || '',
      ctaLabel: data.ctaLabel || '',
      ctaLink: data.ctaLink || '',
      imageUrl: data.imageUrl || '',
      mediaType: data.mediaType || 'image',
    });
    setMsg('');
  }

  function submit() {
    if (!form.headline.trim()) return setMsg('Headline is required.');
    save.mutate({
      eyebrow: form.eyebrow.trim() || 'Brand story',
      headline: form.headline.trim(),
      body: form.body.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
      ctaLink: form.ctaLink.trim() || null,
      imageUrl: form.imageUrl || null,
      mediaType: form.mediaType || 'image',
    });
  }

  if (isLoading) {
    return (
      <div className="admin-products-page">
        <p className="admin-products-body admin-product-hint">Loading brand story…</p>
      </div>
    );
  }

  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <BookOpen size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Brand Story</h1>
              <p>Homepage section — headline, text, link, optional side image or video.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body">
        <div className="admin-shop-category-form-row">
          <section className="admin-product-card">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <BookOpen size={16} />
              </span>
              <span className="min-w-0 flex-1">
                Homepage brand story
                <span className="admin-product-hint mt-0.5 block font-normal normal-case tracking-normal">
                  Preview on{' '}
                  <a href="/" target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
                    homepage
                  </a>{' '}
                  below the hero. Side media is optional.
                </span>
              </span>
            </div>

            <div className="admin-product-fields">
              <BrandIconField
                id="brand-eyebrow"
                label="Eyebrow"
                icon={Type}
                placeholder="Eyebrow (e.g. Brand story)"
                value={form.eyebrow}
                onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
              />
              <BrandTextField
                id="brand-headline"
                label="Headline quote"
                placeholder="Headline quote"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                short
              />
              <BrandTextField
                id="brand-body"
                label="Body paragraph"
                placeholder="Body paragraph"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
              <BrandIconField
                id="brand-cta-label"
                label="CTA label"
                icon={Tag}
                placeholder="CTA label"
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              />
              <BrandIconField
                id="brand-cta-link"
                label="CTA link"
                icon={Link2}
                placeholder="CTA link (e.g. /about)"
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              />
            </div>

            <p className="admin-field-label mt-4">Side media (optional)</p>
            {form.imageUrl ? (
              <div className="mt-2 max-w-[240px]">
                <AdminOfferTileCard
                  secureUrl={form.imageUrl}
                  resourceType={form.mediaType}
                  downloadName="brand-story"
                  onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
                />
              </div>
            ) : (
              <p className="admin-product-hint">No image — left column stays text-only on homepage.</p>
            )}

            <label className="admin-offer-upload-btn mt-4">
              <CloudUpload size={18} />
              {uploading ? 'Uploading…' : form.imageUrl ? 'Replace Media' : 'Upload Image / Video'}
              <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
            </label>
            <p className="admin-product-hint mt-2">Portrait 3:4 or wide 16:9 lifestyle. JPG/WebP recommended.</p>

            <div className="admin-product-actions mt-6">
              <button type="button" className="admin-btn-add" onClick={submit} disabled={save.isPending}>
                <Check size={16} />
                {save.isPending ? 'Saving…' : 'Save Brand Story'}
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
              {BRAND_GUIDELINES.map((row) => (
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
    </div>
  );
}

function BrandIconField({ id, label, icon: Icon, placeholder, value, onChange }) {
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

function BrandTextField({ id, label, placeholder, value, onChange, short }) {
  return (
    <div>
      <label className="admin-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="admin-product-textarea-wrap">
        <textarea
          id={id}
          className="admin-product-textarea"
          style={short ? { minHeight: '5.5rem' } : undefined}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}