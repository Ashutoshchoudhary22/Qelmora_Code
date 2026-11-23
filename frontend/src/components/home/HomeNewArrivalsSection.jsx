import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useBandBackgroundUrl } from '../../lib/useBandBackground';
import { ProductGrid } from '../ProductGrid';

const DEFAULT_NEW_ARRIVALS_BG = '/profile/our-story-golden-silk.png';

export function HomeNewArrivalsSection() {
  const { data: bandCfg } = useQuery({
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

  const bgUrl = useBandBackgroundUrl(bandCfg, DEFAULT_NEW_ARRIVALS_BG);

  return (
    <section className="home-new-arrivals-band relative overflow-hidden">
      <div className="home-new-arrivals-band-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="home-new-arrivals-band-scrim" aria-hidden />

      <div className="home-new-arrivals-band-inner site-container relative z-[2] py-20">
        <p className="home-new-arrivals-eyebrow">Just landed</p>
        <h2 className="home-new-arrivals-title font-display">New arrivals</h2>
        <div className="mt-14 space-y-16">
          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h3 className="font-display text-2xl font-light">Men</h3>
              <Link
                to="/shop/men#new-arrivals"
                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent"
              >
                View all men
              </Link>
            </div>
            {loadingNewMen ? <p className="text-stone-500">Loading…</p> : <ProductGrid items={newMen?.items} />}
          </div>
          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h3 className="font-display text-2xl font-light">Women</h3>
              <Link
                to="/shop/women#new-arrivals"
                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent"
              >
                View all women
              </Link>
            </div>
            {loadingNewWomen ? <p className="text-stone-500">Loading…</p> : <ProductGrid items={newWomen?.items} />}
          </div>
        </div>
      </div>
    </section>
  );
}