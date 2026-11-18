import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CloudUpload, Instagram, Layers, Link2, Type, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from '../../components/admin/AdminOfferTileCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

const SECTION_KEY = 'instagram';
const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

const INSTAGRAM_GUIDELINES = [
  { label: 'Size', value: '1080×1080 px (1:1)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 500 KB' },
  { label: 'Video', value: 'MP4, under 15 MB (optional)' },
];

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

  const items = posts?.items || [];

  function resetMeta() {
    if (!meta) return;
    setTitle(meta.eyebrow || '@qelmora on Instagram');
    setProfileLink(meta.ctaLink || 'https://instagram.com');
    setMsg('');
  }

  async function onFiles(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    setMsg('');
    try {
      for (let i = 0; i < files.length; i++) {
        const metaUpload = await uploadToCloudinary(files[i], 'qelmora/instagram', '/instagram/admin/cloudinary-signature');
        await api.post('/instagram/admin', {
          secureUrl: metaUpload.secure_url,
          publicId: metaUpload.public_id,
          resourceType: metaUpload.resource_type,
          sortOrder: items.length + i,
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

  function confirmRemove(id) {
    if (window.confirm('Remove this post from the marquee?')) removePost.mutate(id);
  }

  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <Instagram size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Instagram Feed</h1>
              <p>Images or videos for the &quot;@qelmora on Instagram&quot; marquee on the homepage.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body admin-shop-category-body">
        <section className="admin-product-card">
          <div className="admin-product-card-head">
            <span className="admin-product-card-head-icon">
              <Layers size={16} />
            </span>
            Marquee posts
          </div>
          <p className="admin-product-hint -mt-2 mb-4">Sort order follows upload sequence (oldest first in list).</p>

          {isLoading ? (
            <p className="admin-product-hint">Loading posts…</p>
          ) : items.length === 0 ? (
            <p className="admin-product-hint">No posts yet — upload below.</p>
          ) : (
            <div className="admin-offer-tile-grid">
              {items.map((p) => (
                <AdminOfferTileCard
                  key={p.id}
                  secureUrl={p.secureUrl}
                  resourceType={p.resourceType}
                  downloadName={`instagram-${p.id}`}
                  onRemove={() => confirmRemove(p.id)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="admin-shop-category-form-row">
          <section className="admin-product-card">
            <div className="admin-product-card-head">
              <span className="admin-product-card-head-icon">
                <Instagram size={16} />
              </span>
              Section settings
            </div>

            <div className="admin-product-fields">
              <InstagramField
                id="ig-title"
                label="Section title"
                icon={Type}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Section title"
              />
              <InstagramField
                id="ig-link"
                label="Instagram profile URL"
                icon={Link2}
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                placeholder="https://instagram.com/qelmora"
              />
            </div>

            <label className="admin-offer-upload-btn mt-4">
              <CloudUpload size={18} />
              {uploading ? 'Uploading…' : 'Add Images / Videos'}
              <input type="file" multiple accept="image/*,video/*" className="hidden" disabled={uploading} onChange={onFiles} />
            </label>
            <p className="admin-product-hint mt-2">1080×1080 px (1:1). JPG/WebP, under 500 KB per file.</p>

            <div className="admin-product-actions mt-6">
              <button type="button" className="admin-btn-add" onClick={saveAll} disabled={saveMeta.isPending}>
                <Check size={16} />
                {saveMeta.isPending ? 'Saving…' : 'Save Title & Link'}
              </button>
              <button type="button" className="admin-btn-cancel" onClick={resetMeta}>
                <X size={16} />
                Reset
              </button>
            </div>
            {msg && (
              <p
                className={`admin-product-hint mt-3 ${msg.includes('failed') || msg.includes('Upload') ? 'admin-product-msg' : 'text-[#15803d]'}`}
              >
                {msg}
              </p>
            )}
          </section>

          <aside className="admin-shop-category-guidelines">
            <h3 className="text-sm font-semibold text-stone-900">Image guidelines</h3>
            <ul className="admin-guidelines-list">
              {INSTAGRAM_GUIDELINES.map((row) => (
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

function InstagramField({ id, label, icon: Icon, placeholder, value, onChange }) {
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