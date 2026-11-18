import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadSizeHint } from './UploadSizeHint';

export function AccountHeroEditor() {
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

  if (isLoading) return <p className="text-stone-500">Loading account hero…</p>;

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
          <UploadSizeHint
            variant="wide"
            className="mt-2"
          />
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