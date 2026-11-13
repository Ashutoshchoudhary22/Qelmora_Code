import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from '../../components/admin/UploadSizeHint';

const SECTION_KEY = 'brand_story';

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

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-light">Brand story</h1>
        <p className="mt-2 text-sm text-stone-500">Homepage section — headline, text, link, optional side image or video.</p>
      </div>

      <div className="space-y-4">
        <input
          className="input-field"
          placeholder="Eyebrow (e.g. Brand story)"
          value={form.eyebrow}
          onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
        />
        <textarea
          className="input-field min-h-[100px]"
          placeholder="Headline quote"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
        <textarea
          className="input-field min-h-[140px]"
          placeholder="Body paragraph"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="input-field"
            placeholder="CTA label"
            value={form.ctaLabel}
            onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="CTA link (e.g. /about)"
            value={form.ctaLink}
            onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-stone-500">Side media (optional)</p>
        {form.imageUrl ? (
          <div className="mt-4 max-w-sm">
            <MediaAssetCard
              secureUrl={form.imageUrl}
              resourceType={form.mediaType}
              label="Brand story visual"
              downloadName="brand-story"
              onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-600">No image — left column stays text-only on homepage.</p>
        )}
        <label className="btn-primary btn-accent mt-4 inline-flex cursor-pointer text-[10px]">
          {uploading ? 'Uploading…' : form.imageUrl ? 'Replace media' : 'Upload image / video'}
          <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
        </label>
        <UploadSizeHint variant="wide" video className="mt-2" />
      </div>

      <button type="button" className="btn-primary btn-accent w-full sm:w-auto" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save brand story'}
      </button>
      {msg && <p className="text-sm text-stone-400">{msg}</p>}
    </div>
  );
}
