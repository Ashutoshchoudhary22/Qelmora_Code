import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

const STEP_MS = 4200;

function TrendingTile({ banner, fallbackShop }) {
  const url = banner.secureUrl;
  const link = banner.ctaLink?.trim() || fallbackShop;
  const isExternal = link.startsWith('http');
  const label = banner.title?.trim() || 'Explore';

  const card = (
    <div className="group relative aspect-[4/5] w-full overflow-hidden border border-white/10 bg-[#141210] transition duration-300 hover:border-q-accent/50 hover:shadow-[0_12px_40px_rgb(0_0_0/0.35)]">
      {banner.resourceType === 'video' ? (
        <video
          src={url}
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img
          src={url}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-q-accent">Shop</p>
        <h3 className="font-display mt-2 text-2xl font-light leading-tight text-stone-50 md:text-[1.65rem]">{label}</h3>
        {banner.subtitle && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-300">{banner.subtitle}</p>}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-q-accent"
      >
        {card}
      </a>
    );
  }
  return (
    <Link to={link} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-q-accent">
      {card}
    </Link>
  );
}

function useTrendingPerView() {
  const [perView, setPerView] = useState(2);
  useEffect(() => {
    const lg = window.matchMedia('(min-width: 1024px)');
    const sm = window.matchMedia('(min-width: 640px)');
    const sync = () => {
      if (lg.matches) setPerView(4);
      else if (sm.matches) setPerView(2);
      else setPerView(1);
    };
    sync();
    lg.addEventListener('change', sync);
    sm.addEventListener('change', sync);
    return () => {
      lg.removeEventListener('change', sync);
      sm.removeEventListener('change', sync);
    };
  }, []);
  return perView;
}

function TrendingCarousel({ items, shopPath }) {
  const perView = useTrendingPerView();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, items.length - perView);
  const canStep = items.length > perView;

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!canStep || paused) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [canStep, paused, maxIndex]);

  const slidePercent = 100 / perView;

  return (
    <div
      className="relative -mx-1 sm:-mx-1.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * slidePercent}%)`,
            transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {items.map((b) => (
            <div
              key={b.id}
              className="box-border shrink-0 grow-0 px-1 sm:px-1.5"
              style={{ width: `${slidePercent}%` }}
            >
              <TrendingTile banner={b} fallbackShop={shopPath} />
            </div>
          ))}
        </div>
      </div>

      {canStep && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Previous trending slide"
            className="hidden rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-widest text-stone-500 transition hover:border-q-accent/40 hover:text-q-accent sm:inline-block"
            onClick={() => setIndex((i) => (i <= 0 ? maxIndex : i - 1))}
          >
            Prev
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Trending slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-q-accent' : 'w-1.5 bg-white/25'}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next trending slide"
            className="hidden rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-widest text-stone-500 transition hover:border-q-accent/40 hover:text-q-accent sm:inline-block"
            onClick={() => setIndex((i) => (i >= maxIndex ? 0 : i + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function TrendingCategories({ placement, shopPath, genderLabel }) {
  const { data, isLoading } = useQuery({
    queryKey: ['banners', placement],
    queryFn: async () => (await api.get(`/banners?placement=${placement}`)).data,
    enabled: !!placement,
  });

  const items = data?.items || [];

  if (!isLoading && !items.length) {
    return null;
  }

  return (
    <section id="trending-categories" className="mt-14 scroll-mt-28 border-b border-white/10 pb-14">
      <div className="max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Discover</p>
        <h2 className="font-display mt-3 text-3xl font-light tracking-tight md:text-4xl">
          Trending categories{genderLabel ? ` — ${genderLabel}` : ''}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Curated edits and capsules — slides advance automatically; hover to pause.
        </p>
      </div>
      {isLoading ? (
        <p className="mt-10 text-stone-500">Loading trending tiles…</p>
      ) : (
        <div className="mt-10">
          <TrendingCarousel items={items} shopPath={shopPath} />
        </div>
      )}
    </section>
  );
}