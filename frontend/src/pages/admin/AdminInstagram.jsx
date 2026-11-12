import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MediaAssetCard } from '../../components/admin/MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

const SECTION_KEY = 'instagram';

export default function AdminInstagram() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('@qelmora on Instagram');
  const [profileLink, setProfileLink] = useState('https://instagram.com');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['instagram-admin'],
    queryFn: async () => (await api.get('/instagram/admin')).data,
  });

  const { data: meta } = useQuery({
    queryKey: ['content', SECTION_KEY],
    queryFn: async () => (await api.get(`/content/${SECTION_KEY}`)).data,
  });

  useEffect(() => {
    if (!meta) return;
    if (meta.eyebrow) setTitle(meta.eyebrow);
    if (meta.ctaLink) setProfileLink(meta.ctaLink);
  }, [meta]);

  const saveMeta = useMutation({
    mutationFn: () =>
      api.patch(`/content/admin/${SECTION_KEY}`, {
        eyebrow: title.trim(),
        headline: 'Instagram',
        ctaLink: profileLink.trim() || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', SECTION_KEY] }),
  });

  const removePost = useMutation({
    mutationFn: (id) => api.delete(`/instagram/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-admin'] });
      qc.invalidateQueries({ queryKey: ['instagram'] });
    },
  });

  async function onFiles(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    setMsg('');
    try {
      for (let i = 0; i < files.length; i++) {
        const meta = await uploadToCloudinary(files[i], 'qelmora/instagram', '/instagram/admin/cloudinary-signature');
        await api.post('/instagram/admin', {
          secureUrl: meta.secure_url,
          publicId: meta.public_id,
          resourceType: meta.resource_type,
          sortOrder: (posts?.items?.length || 0) + i,
        });
      }
      qc.invalidateQueries({ queryKey: ['instagram-admin'] });
      qc.invalidateQueries({ queryKey: ['instagram'] });
      setMsg('Added to homepage marquee.');
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function saveAll() {
    try {
      await saveMeta.mutateAsync();
      setMsg('Instagram section saved.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  const items = posts?.items || [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-light">Instagram feed</h1>
        <p className="mt-2 text-sm text-stone-500">
          Images or videos for the “@qelmora on Instagram” marquee on the homepage.
        </p>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
        <input
          className="input-field"
          placeholder="Section title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Instagram profile URL"
          value={profileLink}
          onChange={(e) => setProfileLink(e.target.value)}
        />
        <label className="btn-primary btn-accent inline-flex cursor-pointer text-[10px]">
          {uploading ? 'Uploading…' : 'Add images / videos'}
          <input type="file" multiple accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFiles} />
        </label>
        <button type="button" className="btn-primary w-full text-[10px]" onClick={saveAll}>
          Save title & link
        </button>
      </div>

      {isLoading ? (
        <p className="text-stone-500">Loading posts…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-600">No posts yet — upload above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <MediaAssetCard
              key={p.id}
              secureUrl={p.secureUrl}
              publicId={p.publicId}
              resourceType={p.resourceType}
              downloadName={`instagram-${p.id}`}
              onRemove={() => removePost.mutate(p.id)}
            />
          ))}
        </div>
      )}

      {msg && <p className="text-sm text-stone-400">{msg}</p>}
    </div>
  );
}
