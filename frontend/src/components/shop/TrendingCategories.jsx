import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

function TrendingTile({ banner, fallbackShop }) {
  const url = banner.secureUrl;
  const link = banner.ctaLink?.trim() || fallbackShop;
  const isExternal = link.startsWith('http');
  const label = banner.title?.trim() || 'Category';

  const card = (
    <div className="group relative flex min-h-[180px] items-end overflow-hidden border border-white/10 bg-[#141210] p-5 transition hover:border-q-accent/40 sm:min-h-[200px]">
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
        <p className="text-[10px] uppercase tracking-[0.3em] text-q-accent">Shop</p>
        <h3 className="font-display mt-2 text-2xl font-light">{label}</h3>
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

export function TrendingCategories({ placement, shopPath, genderLabel }) {
  const { data, isLoading } = useQuery({
    queryKey: ['banners', placement],
    queryFn: async () => (await api.get(`/banners?placement=${placement}`)).data,
    enabled: !!placement,
  });

  const items = data?.items || [];

  return (
    <section id="trending-categories" className="mt-14 scroll-mt-28 border-b border-white/10 pb-14">
      <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Discover</p>
      <h2 className="font-display mt-2 text-3xl font-light">
        Trending categories{genderLabel ? ` — ${genderLabel}` : ''}
      </h2>
      {isLoading ? (
        <p className="mt-8 text-stone-500">Loading…</p>
      ) : items.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <TrendingTile key={b.id} banner={b} fallbackShop={shopPath} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-stone-600">
          Add category tiles in Admin → Shop page content → Trending categories ({genderLabel || 'men or women'}).
        </p>
      )}
    </section>
  );
}
