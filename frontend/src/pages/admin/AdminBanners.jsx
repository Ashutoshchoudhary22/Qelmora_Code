import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function AdminBanners() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => (await api.get('/banners/admin')).data,
  });

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    placement: 'hero',
    ctaLabel: '',
    ctaLink: '',
    secureUrl: '',
    resourceType: 'image',
    publicId: '',
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const meta = await uploadToCloudinary(file, 'qelmora/banners', '/banners/admin/cloudinary-signature');
    setForm((f) => ({ ...f, secureUrl: meta.secure_url, resourceType: meta.resource_type, publicId: meta.public_id }));
  }

  async function save() {
    await api.post('/banners/admin', {
      title: form.title,
      subtitle: form.subtitle,
      placement: form.placement,
      ctaLabel: form.ctaLabel,
      ctaLink: form.ctaLink,
      secureUrl: form.secureUrl,
      resourceType: form.resourceType,
      publicId: form.publicId,
    });
    qc.invalidateQueries({ queryKey: ['admin-banners'] });
    setForm({ title: '', subtitle: '', placement: 'hero', ctaLabel: '', ctaLink: '', secureUrl: '', resourceType: 'image' });
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-light">Homepage banners</h1>
      <ul className="mt-6 space-y-2 text-sm text-stone-400">
        {(data?.items || []).map((b) => (
          <li key={b.id}>
            [{b.placement}] {b.title}
          </li>
        ))}
      </ul>
      <div className="mt-10 max-w-lg space-y-3">
        <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input-field" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <select className="input-field" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
          <option value="hero">Hero</option>
          <option value="promo">Promo</option>
          <option value="collection">Collection</option>
          <option value="announcement">Announcement</option>
        </select>
        <input type="file" accept="image/*,video/*" onChange={onFile} />
        <button type="button" className="btn-primary btn-accent w-full" onClick={save}>
          Add banner
        </button>
      </div>
    </div>
  );
}
