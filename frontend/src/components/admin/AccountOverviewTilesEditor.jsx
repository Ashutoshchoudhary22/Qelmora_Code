import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ACCOUNT_TILE_ICON_OPTIONS, accountTileIcon } from '../../lib/accountTileIcons';
import { MediaAssetCard } from './MediaAssetCard';
import { uploadToCloudinary } from '../../lib/cloudinary';

function emptyTile(sortOrder = 0) {
  return {
    id: undefined,
    title: '',
    description: '',
    linkPath: '/',
    iconKey: 'package',
    imageUrl: '',
    tileKey: '',
    sortOrder,
    isActive: true,
  };
}

export function AccountOverviewTilesEditor() {
  const qc = useQueryClient();
  const [tiles, setTiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['account-overview-tiles', 'admin'],
    queryFn: async () => (await api.get('/account-overview-tiles/admin/all')).data,
  });

  useEffect(() => {
    if (!data?.items) return;
    setTiles(
      data.items.map((t) => ({
        id: t.id,
        title: t.title || '',
        description: t.description || '',
        linkPath: t.linkPath || '/',
        iconKey: t.iconKey || 'package',
        imageUrl: t.imageUrl || '',
        tileKey: t.tileKey || '',
        sortOrder: t.sortOrder ?? 0,
        isActive: t.isActive !== false,
      }))
    );
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.put('/account-overview-tiles/admin/sync', { tiles: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-overview-tiles'] });
      qc.invalidateQueries({ queryKey: ['account-overview-tiles', 'admin'] });
    },
  });

  function updateTile(index, patch) {
    setTiles((list) => list.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onTileImage(index, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(index);
    setMsg('');
    try {
      const meta = await uploadToCloudinary(file, 'qelmora/account-tiles', '/content/admin/cloudinary-signature');
      updateTile(index, { imageUrl: meta.secure_url });
    } catch (err) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  }

  async function submit() {
    const clean = tiles.filter((t) => t.title.trim() && t.linkPath.trim());
    if (!clean.length) return setMsg('Add at least one card with a title and link.');
    setMsg('');
    try {
      await save.mutateAsync(
        clean.map((t, i) => ({
          id: t.id,
          title: t.title.trim(),
          description: t.description.trim(),
          linkPath: t.linkPath.trim(),
          iconKey: t.iconKey,
          imageUrl: t.imageUrl || null,
          tileKey: t.tileKey.trim() || null,
          sortOrder: Number(t.sortOrder) || i,
          isActive: t.isActive,
        }))
      );
      setMsg('Saved — open /account to preview.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  if (isLoading) return <p className="text-stone-500">Loading overview cards…</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5 lg:p-6">
      <p className="text-sm text-stone-500">
        Dark shortcut cards on <span className="text-stone-300">/account</span> — title, description, link, icon, and optional
        watermark image per card.
      </p>

      <ul className="mt-6 space-y-6">
        {tiles.map((tile, index) => {
          const Icon = accountTileIcon(tile.iconKey);
          return (
            <li key={tile.id ?? `new-${index}`} className="rounded-lg border border-white/10 bg-black/30 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-stone-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-q-accent/40 bg-q-accent/10 text-q-accent">
                    <Icon size={16} />
                  </span>
                  Card {index + 1}
                </span>
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={tile.isActive}
                    onChange={(e) => updateTile(index, { isActive: e.target.checked })}
                  />
                  Visible
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  className="input-field"
                  placeholder="Title"
                  value={tile.title}
                  onChange={(e) => updateTile(index, { title: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Link path (e.g. /account/orders)"
                  value={tile.linkPath}
                  onChange={(e) => updateTile(index, { linkPath: e.target.value })}
                />
                <input
                  className="input-field md:col-span-2"
                  placeholder="Short description"
                  value={tile.description}
                  onChange={(e) => updateTile(index, { description: e.target.value })}
                />
                <select
                  className="input-field"
                  value={tile.iconKey}
                  onChange={(e) => updateTile(index, { iconKey: e.target.value })}
                >
                  {ACCOUNT_TILE_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  max={99}
                  placeholder="Sort order"
                  value={tile.sortOrder}
                  onChange={(e) => updateTile(index, { sortOrder: Number(e.target.value) })}
                />
                <input
                  className="input-field md:col-span-2"
                  placeholder="Tile key (optional, for styling: help, collections…)"
                  value={tile.tileKey}
                  onChange={(e) => updateTile(index, { tileKey: e.target.value })}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-4">
                <label className="btn-primary btn-accent inline-flex cursor-pointer text-[10px]">
                  {uploadingId === index ? 'Uploading…' : tile.imageUrl ? 'Replace watermark' : 'Watermark image (optional)'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingId === index} onChange={(e) => onTileImage(index, e)} />
                </label>
                {tile.imageUrl && (
                  <div className="w-full max-w-[200px]">
                    <MediaAssetCard
                      secureUrl={tile.imageUrl}
                      resourceType="image"
                      label="Card watermark"
                      downloadName={`account-tile-${index + 1}`}
                      onRemove={() => updateTile(index, { imageUrl: '' })}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary text-[10px]"
          onClick={() => setTiles((list) => [...list, emptyTile(list.length)])}
        >
          Add card
        </button>
        <button type="button" className="btn-primary btn-accent text-[10px]" onClick={submit} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save all cards'}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-stone-400">{msg}</p>}
    </div>
  );
}