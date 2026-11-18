import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlignLeft, Check, CloudUpload, FileText, Mail, Type, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from './AdminOfferTileCard';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from './UploadSizeHint';

export function StaticPageEditor({ sectionKey, pageTitle, pagePath, variant = 'default' }) {
  const premium = variant === 'premium';
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
    queryKey: ['content', sectionKey],
    queryFn: async () => (await api.get(`/content/${sectionKey}`)).data,
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
    mutationFn: (payload) => api.patch(`/content/admin/${sectionKey}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', sectionKey] }),
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/pages', '/content/admin/cloudinary-signature');
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

  function clearDraft() {
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

  async function submit() {
    if (!form.headline.trim()) return setMsg('Title is required.');
    setMsg('');
    try {
      await save.mutateAsync({
        eyebrow: form.eyebrow.trim(),
        headline: form.headline.trim(),
        body: form.body.trim() || null,
        ctaLabel: form.ctaLabel.trim() || null,
        ctaLink: form.ctaLink.trim() || null,
        imageUrl: form.imageUrl || null,
        mediaType: form.mediaType || 'image',
      });
      setMsg(`Saved — open ${pagePath} to preview.`);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) {
    return <p className={premium ? 'admin-product-hint' : 'text-stone-500'}>Loading {pageTitle}…</p>;
  }

  const fields = premium ? (
    <div className="admin-product-fields">
      <div>
        <label className="admin-field-label" htmlFor={`${sectionKey}-eyebrow`}>
          Eyebrow label
        </label>
        <div className="admin-field-icon-wrap">
          <Type className="admin-field-icon" size={16} />
          <input
            id={`${sectionKey}-eyebrow`}
            className="admin-product-input"
            placeholder="Eyebrow label"
            value={form.eyebrow}
            onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="admin-field-label" htmlFor={`${sectionKey}-headline`}>
          Page title
        </label>
        <div className="admin-field-icon-wrap">
          <AlignLeft className="admin-field-icon" size={16} />
          <input
            id={`${sectionKey}-headline`}
            className="admin-product-input"
            placeholder="Page title"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="admin-field-label" htmlFor={`${sectionKey}-body`}>
          Body text
        </label>
        <PremiumTextarea
          id={`${sectionKey}-body`}
          placeholder="Body text"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
      </div>
      {sectionKey === 'contact' && (
        <>
          <div>
            <label className="admin-field-label" htmlFor={`${sectionKey}-ctaLabel`}>
              Form intro
            </label>
            <div className="admin-field-icon-wrap">
              <AlignLeft className="admin-field-icon" size={16} />
              <input
                id={`${sectionKey}-ctaLabel`}
                className="admin-product-input"
                placeholder="Form intro (e.g. Fill the form or email us on)"
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="admin-field-label" htmlFor={`${sectionKey}-ctaLink`}>
              Help email
            </label>
            <div className="admin-field-icon-wrap">
              <Mail className="admin-field-icon" size={16} />
              <input
                id={`${sectionKey}-ctaLink`}
                className="admin-product-input"
                placeholder="Help email (shown on form)"
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  ) : (
    <div className="mt-6 space-y-3">
      <input
        className="input-field"
        placeholder="Eyebrow label"
        value={form.eyebrow}
        onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
      />
      <input
        className="input-field"
        placeholder="Page title"
        value={form.headline}
        onChange={(e) => setForm({ ...form, headline: e.target.value })}
      />
      <textarea
        className="input-field min-h-[120px]"
        placeholder="Body text"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      {sectionKey === 'contact' && (
        <>
          <input
            className="input-field"
            placeholder="Form intro (e.g. Fill the form or email us on)"
            value={form.ctaLabel}
            onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Help email (shown on form)"
            value={form.ctaLink}
            onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
          />
        </>
      )}
    </div>
  );

  const mediaBlock =
    form.imageUrl &&
    (premium ? (
      <div className="mt-4 max-w-[240px]">
        <AdminOfferTileCard
          secureUrl={form.imageUrl}
          resourceType={form.mediaType}
          downloadName={sectionKey}
          onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
        />
      </div>
    ) : (
      <div className="mt-4 max-w-sm">
        <MediaAssetCard
          secureUrl={form.imageUrl}
          resourceType={form.mediaType}
          label={`${pageTitle} visual`}
          downloadName={sectionKey}
          onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
        />
      </div>
    ));

  if (premium) {
    return (
      <section className="admin-product-card">
        <div className="admin-product-card-head">
          <span className="admin-product-card-head-icon">
            <FileText size={16} />
          </span>
          <span className="min-w-0 flex-1">
            {pageTitle}
            <span className="admin-product-hint mt-0.5 block font-normal normal-case tracking-normal">
              Preview at{' '}
              <a href={pagePath} target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
                {pagePath}
              </a>
            </span>
          </span>
        </div>

        {fields}

        {!form.imageUrl && <p className="admin-product-hint">No image or video yet.</p>}
        {mediaBlock}

        <label className="admin-offer-upload-btn mt-4">
          <CloudUpload size={18} />
          {uploading ? 'Uploading…' : form.imageUrl ? 'Replace Image / Video' : 'Upload Image / Video'}
          <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
        </label>
        <p className="admin-product-hint mt-2">
          Size: 1000×1400 px (3:4). JPG/WebP, under 600 KB · MP4, under 15 MB (optional)
        </p>

        <div className="admin-product-actions mt-6">
          <button type="button" className="admin-btn-add" onClick={submit} disabled={save.isPending}>
            <Check size={16} />
            {save.isPending ? 'Saving…' : `Save ${pageTitle}`}
          </button>
          <button type="button" className="admin-btn-cancel" onClick={clearDraft}>
            <X size={16} />
            Reset
          </button>
        </div>
        {msg && (
          <p
            className={`admin-product-hint mt-3 ${msg.includes('failed') || msg.includes('required') ? 'admin-product-msg' : 'text-[#15803d]'}`}
          >
            {msg}
          </p>
        )}
      </section>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-light">{pageTitle}</h2>
        <span className="text-[10px] uppercase tracking-widest text-stone-600">{pagePath}</span>
      </div>

      {fields}

      {mediaBlock}
      {!form.imageUrl && <p className="mt-4 text-sm text-stone-600">No image or video yet.</p>}

      <label className="btn-primary btn-accent mt-4 inline-flex cursor-pointer text-[10px]">
        {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image / video' : 'Upload image / video'}
        <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
      </label>
      <UploadSizeHint variant="portrait" video className="mt-2" />

      <button type="button" className="btn-primary mt-4 block w-full text-[10px]" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : `Save ${pageTitle}`}
      </button>
      {msg && <p className="mt-3 text-sm text-stone-400">{msg}</p>}
    </div>
  );
}

function PremiumTextarea({ id, placeholder, value, onChange }) {
  return (
    <div className="admin-product-textarea-wrap">
      <textarea
        id={id}
        className="admin-product-textarea"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}