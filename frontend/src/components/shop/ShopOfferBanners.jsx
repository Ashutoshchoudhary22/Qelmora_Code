import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

const STEP_MS = 3800;

function OfferTile({ banner }) {
  const url = banner.secureUrl;
  const link = banner.ctaLink?.trim();
  const isExternal = link?.startsWith('http');

  const img = (
    <div className="group relative aspect-square overflow-hidden bg-stone-200">
      {banner.resourceType === 'video' ? (
        <video
          src={url}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img
          src={url}
          alt={banner.title || 'Offer'}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      )}
    </div>
  );

  if (!link) return img;
  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="block">
        {img}
      </a>
    );
  }
  return (
    <Link to={link} className="block">
      {img}
    </Link>
  );
}

function useSlidesPerView() {
  const [perView, setPerView] = useState(3);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setPerView(mq.matches ? 3 : 1);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return perView;
}

function ShopOfferStepCarousel({ items }) {
  const perView = useSlidesPerView();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, items.length - perView);
  const canStep = items.length > perView || (perView === 1 && items.length > 1);

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
      className="site-container relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * slidePercent}%)`,
            transition: 'transform 650ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {items.map((b) => (
            <div key={b.id} className="box-border shrink-0 grow-0 px-1 sm:px-1.5" style={{ width: `${slidePercent}%` }}>
              <OfferTile banner={b} />
            </div>
          ))}
        </div>
      </div>
      {canStep && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Offer slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-q-accent' : 'w-1.5 bg-white/25'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ShopOfferBanners({ placement }) {
  const { data } = useQuery({
    queryKey: ['banners', placement],
    queryFn: async () => (await api.get(`/banners?placement=${placement}`)).data,
    enabled: !!placement,
  });

  const items = useMemo(() => data?.items || [], [data?.items]);
  if (!items.length) return null;

  return (
    <section className="shop-offer-band border-b border-white/10 bg-[#0a0a0a] py-4 md:py-6">
      <ShopOfferStepCarousel items={items} />
    </section>
  );
}
