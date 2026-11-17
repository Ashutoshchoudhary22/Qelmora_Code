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
          className="group relative aspect-[4/5] w-full overflow-hidden border border-white/10 bg-[#141210] transition hover:border-q-accent/40"
        >
          {card.mediaUrl && card.mediaType === 'video' ? (
            <video
              src={card.mediaUrl}
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
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
                className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
              />
            )
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Category</p>
            <h3 className="font-display mt-2 text-3xl font-light text-stone-50">{card.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
