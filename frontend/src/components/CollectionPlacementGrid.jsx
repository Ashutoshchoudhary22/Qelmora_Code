import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

function Tile({ banner, fallbackShop }) {
  const url = banner.secureUrl;
  const link = banner.ctaLink?.trim() || fallbackShop;
  const isExternal = link.startsWith('http');
  const label = banner.title?.trim() || 'Explore';

  const card = (
    <div className="group relative flex min-h-[220px] items-end overflow-hidden border border-white/10 bg-[#141210] p-6 transition hover:border-q-accent/40">
      {banner.resourceType === 'video' ? (
        <video
          src={url}
          className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-105"
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img
          src={url}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Category</p>
        <h3 className="font-display mt-2 text-3xl font-light">{label}</h3>
        {banner.subtitle && <p className="mt-1 text-xs text-stone-400">{banner.subtitle}</p>}
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
        <Tile key={b.id} banner={b} fallbackShop={fallbackShop} />
      ))}
    </div>
  );
}
