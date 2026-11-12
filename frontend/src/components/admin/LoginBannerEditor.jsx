import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

export function LoginBannerEditor() {
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

  if (isLoading) return <p className="text-stone-500">Loading login banner…</p>;

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
          <p className="text-sm text-stone-600">No banner yet — upload to show on login.</p>
        )}
      </div>

      <button type="button" className="btn-primary mt-6 w-full max-w-xs text-[10px]" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save login banner'}
      </button>
      {msg && <p className="mt-3 text-sm text-stone-400">{msg}</p>}
    </div>
  );
}
