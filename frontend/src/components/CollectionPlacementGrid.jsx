import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

function Tile({ banner, fallbackShop, imageFit = 'cover' }) {
  const mediaFit = imageFit === 'contain' ? 'object-contain object-center' : 'object-cover object-center';
  const url = banner.secureUrl;
  const link = banner.ctaLink?.trim() || fallbackShop;
  const isExternal = link.startsWith('http');
  const label = banner.title?.trim() || 'Explore';

  const card = (
    <div className="group relative aspect-[4/5] w-full overflow-hidden border border-white/10 bg-[#141210] transition hover:border-q-accent/40">
      {banner.resourceType === 'video' ? (
        <video
          src={url}
          className={`absolute inset-0 h-full w-full ${mediaFit} transition duration-500 group-hover:scale-[1.03]`}
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img
          src={url}
          alt={label}
          className={`absolute inset-0 h-full w-full ${mediaFit} transition duration-500 group-hover:scale-[1.03]`}
          loading="lazy"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Category</p>
        <h3 className="font-display mt-2 text-3xl font-light text-stone-50">{label}</h3>
        {banner.subtitle && <p className="mt-1 text-xs text-stone-300">{banner.subtitle}</p>}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="block">
        {card}
      </a>
    );
  }
  return (
    <Link to={link} className="block">
      {card}
    </Link>
  );
}

export function CollectionPlacementGrid({
  placement,
  fallbackShop = '/shop/men',
  columns = 2,
  className = '',
  emptyMessage = 'No tiles yet.',
  imageFit = 'cover',
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['banners', placement],
    queryFn: async () => (await api.get(`/banners?placement=${placement}`)).data,
    enabled: !!placement,
  });

  const items = data?.items || [];
  const gridCols = columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  if (isLoading) return <p className="text-stone-500">Loading…</p>;
  if (!items.length) return <p className="text-sm text-stone-600">{emptyMessage}</p>;

  return (
    <div className={`grid gap-4 ${gridCols} ${className}`}>
      {items.map((b) => (
        <Tile key={b.id} banner={b} fallbackShop={fallbackShop} imageFit={imageFit} />
      ))}
    </div>
  );
}
