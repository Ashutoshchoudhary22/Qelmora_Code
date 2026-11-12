import { Cloud, Download, ExternalLink, Trash2 } from 'lucide-react';
import { downloadMedia } from '../../lib/download';

export function MediaAssetCard({
  secureUrl,
  publicId,
  resourceType = 'image',
  label,
  onRemove,
  downloadName = 'qelmora-asset',
}) {
  if (!secureUrl) return null;

  const filename = downloadName || publicId?.split('/').pop() || 'qelmora-asset';

  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#121110]">
      <div className="relative aspect-[4/5] bg-black/40">
        {resourceType === 'video' ? (
          <video src={secureUrl} className="h-full w-full object-cover" muted playsInline controls />
        ) : (
          <img src={secureUrl} alt="" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300/90">
          <Cloud size={10} />
          Cloudinary
        </span>
      </div>

      <div className="space-y-2 p-3">
        {label && <p className="truncate text-xs text-stone-300">{label}</p>}
        {publicId && (
          <p className="truncate font-mono text-[10px] text-stone-600" title={publicId}>
            {publicId}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wider text-stone-300 transition hover:border-q-accent hover:text-q-accent"
            onClick={() => downloadMedia(secureUrl, filename)}
          >
            <Download size={12} />
            Download
          </button>
          <a
            href={secureUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wider text-stone-300 transition hover:border-stone-400"
          >
            <ExternalLink size={12} />
            Open
          </a>
          {onRemove && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-red-500/30 px-2 py-1 text-[10px] uppercase tracking-wider text-red-400/90 transition hover:border-red-400"
              onClick={onRemove}
            >
              <Trash2 size={12} />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
