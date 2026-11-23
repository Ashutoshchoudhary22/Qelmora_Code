import { Cloud, Download, ExternalLink, GripVertical, Trash2 } from 'lucide-react';
import { downloadMedia } from '../../lib/download';

/** Cream-theme offer tile for admin premium panels */
export function AdminOfferTileCard({
  secureUrl,
  resourceType = 'image',
  downloadName,
  onRemove,
  /** `band` = full uncropped landscape preview (Bands & footer admin) */
  variant = 'tile',
}) {
  if (!secureUrl) return null;

  const filename = downloadName || 'qelmora-offer';
  const isBand = variant === 'band';
  const mediaClass = isBand
    ? 'admin-offer-tile-media-fit'
    : 'h-full w-full object-cover';

  return (
    <article className={`admin-offer-tile${isBand ? ' admin-offer-tile--band' : ''}`}>
      <div className="admin-offer-tile-media">
        {resourceType === 'video' ? (
          <video src={secureUrl} className={mediaClass} muted playsInline controls />
        ) : (
          <img src={secureUrl} alt="" className={mediaClass} />
        )}
        <span className="admin-offer-tile-cloud">
          <Cloud size={11} />
          Cloudinary
        </span>
      </div>
      <div className="admin-offer-tile-toolbar">
        <span className="admin-offer-tile-grip" aria-hidden title="Sort order via Sort Order field when adding">
          <GripVertical size={18} className="text-stone-400" />
        </span>
        <button
          type="button"
          className="admin-offer-tile-tool-btn"
          onClick={() => downloadMedia(secureUrl, filename)}
        >
          <Download size={15} />
          Download
        </button>
        <a href={secureUrl} target="_blank" rel="noreferrer" className="admin-offer-tile-tool-btn">
          <ExternalLink size={15} />
          Open
        </a>
        {onRemove && (
          <button type="button" className="admin-offer-tile-tool-btn admin-offer-tile-tool-btn--danger" onClick={onRemove}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </article>
  );
}