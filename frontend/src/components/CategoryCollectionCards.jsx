import { Link } from 'react-router-dom';

const DEFAULT_SLUGS = ['men', 'women'];

function mediaUrl(cat) {
  return cat.imageUrl || cat.image_url;
}

function mediaType(cat) {
  return cat.mediaType || cat.media_type || 'image';
}

export function CategoryCollectionCards({ items, slugs = DEFAULT_SLUGS, columns = 3, className = '' }) {
  const bySlug = Object.fromEntries((items || []).map((c) => [c.slug, c]));
  const gridCols = columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';
  const cards = slugs.map((slug) => {
    const cat = bySlug[slug];
    return {
      slug,
      name: cat?.name || (slug === 'new-arrivals' ? 'New Arrivals' : slug.charAt(0).toUpperCase() + slug.slice(1)),
      mediaUrl: cat ? mediaUrl(cat) : null,
      mediaType: cat ? mediaType(cat) : 'image',
    };
  });

  return (
    <div className={`grid gap-4 ${gridCols} ${className}`}>
      {cards.map((card) => (
        <Link
          key={card.slug}
          to={`/shop/${card.slug}`}
          className="group relative flex min-h-[220px] items-end overflow-hidden border border-white/10 bg-[#141210] p-6 transition hover:border-q-accent/40"
        >
          {card.mediaUrl && card.mediaType === 'video' ? (
            <video
              src={card.mediaUrl}
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition group-hover:scale-105"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            card.mediaUrl && (
              <img
                src={card.mediaUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition group-hover:scale-105"
              />
            )
          )}
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Category</p>
            <h3 className="font-display mt-2 text-3xl font-light">{card.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
