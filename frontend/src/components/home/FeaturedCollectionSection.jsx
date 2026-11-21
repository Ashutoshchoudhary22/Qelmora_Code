import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Star } from 'lucide-react';
import { api } from '../../api/client';

const DEFAULT_FEATURED_BG = '/profile/our-story-golden-silk.png';

export function FeaturedCollectionSection() {
  const { data: collectionBanner } = useQuery({
    queryKey: ['banners', 'collection'],
    queryFn: async () => (await api.get('/banners?placement=collection')).data,
  });

  const { data: bandCfg } = useQuery({
    queryKey: ['content', 'featured_collection_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/featured_collection_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const item = collectionBanner?.items?.[0];
  const bgUrl = bandCfg?.imageUrl || DEFAULT_FEATURED_BG;

  return (
    <section className="home-featured-collection relative overflow-hidden">
      <div className="home-featured-collection-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="home-featured-collection-scrim" aria-hidden />
      <div className="home-featured-collection-inner site-container py-16 md:py-20 lg:py-24">
        <div className="home-featured-collection-grid">
          <div className="home-featured-collection-visual">
            {item?.secureUrl ? (
              <div className="home-featured-collection-card">
                <span className="home-featured-collection-card-glow" aria-hidden />
                <div className="home-featured-collection-card-frame">
                  {item.resourceType === 'video' ? (
                    <video
                      src={item.secureUrl}
                      className="home-featured-collection-media"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    <img src={item.secureUrl} alt="" className="home-featured-collection-media" loading="lazy" />
                  )}
                  <span className="home-featured-collection-badge home-featured-collection-badge--fit">OVERSIZED FIT</span>
                  <span className="home-featured-collection-badge home-featured-collection-badge--rating">
                    <Star size={12} fill="currentColor" aria-hidden />
                    4.5
                  </span>
                  <div className="home-featured-collection-swatches" aria-hidden>
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ) : (
              <div className="home-featured-collection-card home-featured-collection-card--empty">
                <span className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
                  Add a collection banner in Admin → Banners
                </span>
              </div>
            )}
          </div>

          <div className="home-featured-collection-copy">
            <p className="home-featured-collection-eyebrow">
              <span>Featured collection</span>
            </p>
            <h2 className="home-featured-collection-title font-display">
              {item?.title || 'Collection limited'}
            </h2>
            <p className="home-featured-collection-body">
              {item?.subtitle ||
                'Sculpted layers in obsidian, ivory, and a single thread of amber — built for cities that never sleep.'}
            </p>
            <Link to={item?.ctaLink || '/collections'} className="home-featured-collection-cta">
              {item?.ctaLabel || 'Discover'}
              <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}