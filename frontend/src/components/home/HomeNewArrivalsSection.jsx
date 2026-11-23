import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { hasCustomBandBackground, useBandBackgroundUrl } from '../../lib/useBandBackground';
import { ProductGrid } from '../ProductGrid';

const DEFAULT_NEW_ARRIVALS_BG = '/profile/our-story-golden-silk.png';

function resolveBandCfg(bandCfg, legacyBand) {
  if (hasCustomBandBackground(bandCfg)) return bandCfg;
  if (hasCustomBandBackground(legacyBand)) return legacyBand;
  return bandCfg;
}

function HomeNewArrivalsGenderBand({ sectionKey, legacyBand, title, viewAllTo, items, isLoading }) {
  const { data: bandCfg } = useQuery({
    queryKey: ['content', sectionKey],
    queryFn: async () => {
      try {
        return (await api.get(`/content/${sectionKey}`)).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const effectiveCfg = resolveBandCfg(bandCfg, legacyBand);
  const bgUrl = useBandBackgroundUrl(effectiveCfg, DEFAULT_NEW_ARRIVALS_BG);
  const hasCustomBg = hasCustomBandBackground(effectiveCfg);

  return (
    <div
      className={`home-new-arrivals-band home-new-arrivals-band--split relative overflow-hidden${
        hasCustomBg ? ' home-new-arrivals-band--has-bg' : ''
      }`}
    >
      <div className="home-new-arrivals-band-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="home-new-arrivals-band-scrim" aria-hidden />

      <div className="home-new-arrivals-band-inner site-container relative z-[2] pt-14 md:pt-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h3 className="font-display text-2xl font-light">{title}</h3>
          <Link
            to={viewAllTo}
            className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent"
          >
            View all {title.toLowerCase()}
          </Link>
        </div>
        {isLoading ? <p className="text-stone-500">Loading…</p> : <ProductGrid items={items} />}
      </div>
    </div>
  );
}

export function HomeNewArrivalsSection() {
  const { data: legacyBand } = useQuery({
    queryKey: ['content', 'new_arrivals_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/new_arrivals_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: newMen, isLoading: loadingNewMen } = useQuery({
    queryKey: ['products', 'new', 'men'],
    queryFn: async () => (await api.get('/products?newArrival=1&category=men&limit=4')).data,
  });

  const { data: newWomen, isLoading: loadingNewWomen } = useQuery({
    queryKey: ['products', 'new', 'women'],
    queryFn: async () => (await api.get('/products?newArrival=1&category=women&limit=4')).data,
  });

  return (
    <section className="home-new-arrivals">
      <div className="home-new-arrivals-intro site-container pt-20 pb-6 md:pb-8">
        <p className="home-new-arrivals-eyebrow">Just landed</p>
        <h2 className="home-new-arrivals-title font-display">New arrivals</h2>
      </div>

      <div className="home-new-arrivals-bands">
        <HomeNewArrivalsGenderBand
          sectionKey="home_men_new_arrivals_band"
          legacyBand={legacyBand}
          title="Men"
          viewAllTo="/shop/men#new-arrivals"
          items={newMen?.items}
          isLoading={loadingNewMen}
        />
        <HomeNewArrivalsGenderBand
          sectionKey="home_women_new_arrivals_band"
          legacyBand={legacyBand}
          title="Women"
          viewAllTo="/shop/women#new-arrivals"
          items={newWomen?.items}
          isLoading={loadingNewWomen}
        />
      </div>
    </section>
  );
}