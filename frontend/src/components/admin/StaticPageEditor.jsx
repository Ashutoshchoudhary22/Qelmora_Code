import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

export function StaticPageEditor({ sectionKey, pageTitle, pagePath }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    eyebrow: '',
    headline: '',
    body: '',
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

  async function submit() {
    if (!form.headline.trim()) return setMsg('Title is required.');
    setMsg('');
    try {
      await save.mutateAsync({
        eyebrow: form.eyebrow.trim(),
        headline: form.headline.trim(),
        body: form.body.trim() || null,
        imageUrl: form.imageUrl || null,
        mediaType: form.mediaType || 'image',
      });
      setMsg(`Saved — open ${pagePath} to preview.`);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) return <p className="text-stone-500">Loading {pageTitle}…</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-light">{pageTitle}</h2>
        <span className="text-[10px] uppercase tracking-widest text-stone-600">{pagePath}</span>
      </div>

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
      </div>

      {form.imageUrl ? (
        <div className="mt-4 max-w-sm">
          <MediaAssetCard
            secureUrl={form.imageUrl}
            resourceType={form.mediaType}
            label={`${pageTitle} visual`}
            downloadName={sectionKey}
            onRemove={() => setForm((f) => ({ ...f, imageUrl: '', mediaType: 'image' }))}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-600">No image or video yet.</p>
      )}

      <label className="btn-primary btn-accent mt-4 inline-flex cursor-pointer text-[10px]">
        {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image / video' : 'Upload image / video'}
        <input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFile} />
      </label>

      <button type="button" className="btn-primary mt-4 block w-full text-[10px]" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : `Save ${pageTitle}`}
      </button>
    </div>
  );
}
