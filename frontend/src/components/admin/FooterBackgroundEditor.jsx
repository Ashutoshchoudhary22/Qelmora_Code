import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CloudUpload, ImageIcon, X } from 'lucide-react';
import { api } from '../../api/client';
import { AdminOfferTileCard } from './AdminOfferTileCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

const SECTION_KEY = 'site_footer';
const HEADLINE = 'Site footer background';

const FOOTER_GUIDELINES = [
  { label: 'Size', value: '2400×900 px or wider (landscape)' },
  { label: 'Format', value: 'JPG, PNG, or WebP' },
  { label: 'File size', value: 'Under 800 KB' },
  { label: 'Tip', value: 'Dark or muted images keep footer links readable' },
];

export function FooterBackgroundEditor() {
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['content', SECTION_KEY],
    queryFn: async () => (await api.get(`/content/${SECTION_KEY}`)).data,
  });

  useEffect(() => {
    if (!data) return;
    setImageUrl(data.imageUrl || '');
    setMediaType(data.mediaType || 'image');
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.patch(`/content/admin/${SECTION_KEY}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content', SECTION_KEY] });
      qc.invalidateQueries({ queryKey: ['content', 'site_footer'] });
    },
  });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/footer', '/content/admin/cloudinary-signature');
      setImageUrl(meta.secure_url);
      setMediaType(meta.resource_type === 'video' ? 'video' : 'image');
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function resetForm() {
    setImageUrl(data?.imageUrl || '');
    setMediaType(data?.mediaType || 'image');
    setMsg('');
  }

  async function submit() {
    setMsg('');
    try {
      await save.mutateAsync({
        headline: HEADLINE,
        body: data?.body || 'Optional full-width background image for the storefront footer.',
        imageUrl: imageUrl || null,
        mediaType: imageUrl ? mediaType : 'image',
      });
      setMsg(
        imageUrl
          ? 'Saved — refresh any storefront page to see the footer background.'
          : 'Removed — default footer background is active.'
      );
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) {
    return <p className="admin-product-hint">Loading footer settings…</p>;
  }

  return (
    <div className="admin-shop-category-form-row">
      <section className="admin-product-card">
        <div className="admin-product-card-head">
          <span className="admin-product-card-head-icon">
            <ImageIcon size={16} />
          </span>
          <span className="min-w-0 flex-1">
            Footer background
            <span className="admin-product-hint mt-0.5 block font-normal normal-case tracking-normal">
              Shown behind the site footer on every page. Remove the image and save to return to the default look.
            </span>
          </span>
        </div>

        {imageUrl ? (
          <div className="mt-4 max-w-md">
            <AdminOfferTileCard
              secureUrl={imageUrl}
              resourceType={mediaType}
              downloadName="site-footer-bg"
              onRemove={() => {
                setImageUrl('');
                setMediaType('image');
              }}
            />
          </div>
        ) : (
          <p className="admin-product-hint mt-4">No background image — visitors see the default footer style.</p>
        )}

        <label className="admin-offer-upload-btn mt-4">
          <CloudUpload size={18} />
          {uploading ? 'Uploading…' : imageUrl ? 'Replace background' : 'Upload background image'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onFile} />
        </label>

        <div className="admin-product-actions mt-6">
          <button type="button" className="admin-btn-add" onClick={submit} disabled={save.isPending || uploading}>
            <Check size={16} />
            {save.isPending ? 'Saving…' : 'Save footer background'}
          </button>
          <button type="button" className="admin-btn-cancel" onClick={resetForm}>
            <X size={16} />
            Reset
          </button>
        </div>
        {msg && <p className="admin-product-hint mt-3 text-[#15803d]">{msg}</p>}
      </section>

      <aside className="admin-shop-category-guidelines">
        <h3 className="text-sm font-semibold text-stone-900">Image guidelines</h3>
        <ul className="admin-guidelines-list">
          {FOOTER_GUIDELINES.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <span>{row.value}</span>
            </li>
          ))}
        </ul>
        <p className="admin-product-hint mt-4">
          Preview on{' '}
          <a href="/" target="_blank" rel="noreferrer" className="text-[#c97a35] underline underline-offset-2">
            homepage footer
          </a>
        </p>
        <div
          className="admin-guidelines-thumb"
          style={{ backgroundImage: 'url(/profile/QELMORA-admin.png)' }}
          aria-hidden
        />
      </aside>
    </div>
  );
}