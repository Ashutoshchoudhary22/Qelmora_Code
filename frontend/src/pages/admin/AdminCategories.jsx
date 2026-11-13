import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { UploadSizeHint } from '../../components/admin/UploadSizeHint';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function AdminCategories() {
  const qc = useQueryClient();
  const [uploadingId, setUploadingId] = useState(null);
  const [msg, setMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await api.get('/categories/admin/list')).data,
  });

  const save = useMutation({
    mutationFn: ({ id, imageUrl, mediaType }) =>
      api.patch(`/categories/${id}`, { imageUrl, mediaType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setMsg('Saved — used as fallback when placement tiles are empty.');
    },
    onError: (e) => setMsg(e.response?.data?.message || 'Save failed'),
  });

  async function onFile(cat, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(cat.id);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/categories', '/categories/admin/cloudinary-signature');
      await save.mutateAsync({
        id: cat.id,
        imageUrl: meta.secure_url,
        mediaType: meta.resource_type === 'video' ? 'video' : 'image',
      });
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  }

  async function clearMedia(cat) {
    if (!window.confirm(`Remove media for ${cat.name}?`)) return;
    await save.mutateAsync({ id: cat.id, imageUrl: null, mediaType: 'image' });
  }

  const items = data?.items || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-light">Category media</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-500">
          Men & Women product categories — fallback images when homepage / Nowhere Else admin tiles are empty. For custom
          tiles use Admin → Shop by category and Nowhere Else.
        </p>
      </div>

      {isLoading ? (
        <p className="text-stone-500">Loading…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-light">{cat.name}</h2>
                <span className="text-[10px] uppercase tracking-widest text-stone-500">/{cat.slug}</span>
              </div>

              {cat.imageUrl ? (
                <div className="mt-4">
                  <MediaAssetCard
                    secureUrl={cat.imageUrl}
                    resourceType={cat.mediaType || 'image'}
                    label={`Homepage — ${cat.name}`}
                    downloadName={`category-${cat.slug}`}
                    onRemove={() => clearMedia(cat)}
                  />
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-600">No image or video yet.</p>
              )}

              <label className="btn-primary btn-accent mt-4 inline-flex w-full cursor-pointer justify-center text-[10px]">
                {uploadingId === cat.id ? 'Uploading…' : cat.imageUrl ? 'Replace media' : 'Upload image / video'}
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={uploadingId === cat.id}
                  onChange={(e) => onFile(cat, e)}
                />
              </label>
              <UploadSizeHint variant="categoryCard" video className="mt-2" />
            </div>
          ))}
        </div>
      )}

      {msg && <p className="text-sm text-stone-400">{msg}</p>}
    </div>
  );
}
