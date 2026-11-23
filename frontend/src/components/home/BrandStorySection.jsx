import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star } from 'lucide-react';
import { api } from '../../api/client';
import { useBandBackgroundUrl } from '../../lib/useBandBackground';

const DEFAULT_BRAND_BG = '/profile/our-story-golden-silk.png';

function BrandStoryHeadline({ text }) {
  const parts = String(text).split(/(the stitch)/i);
  return parts.map((part, index) =>
    /^the stitch$/i.test(part) ? (
      <em key={`em-${index}`} className="home-brand-story-em">
        {part}
      </em>
    ) : (
      <span key={`t-${index}`}>{part}</span>
    )
  );
}

export function BrandStorySection() {
  const { data: brandStory } = useQuery({
    queryKey: ['content', 'brand_story'],
    queryFn: async () => (await api.get('/content/brand_story')).data,
  });

  const { data: bandCfg } = useQuery({
    queryKey: ['content', 'brand_story_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/brand_story_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const bgUrl = useBandBackgroundUrl(bandCfg, DEFAULT_BRAND_BG);
  const headline =
    brandStory?.headline ||
    'QELMORA began with a refusal — to chase trends, to shout, to compromise on the stitch.';

  return (
    <section className="home-brand-story-premium relative overflow-hidden">
      <div className="home-brand-story-premium-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="home-brand-story-premium-scrim" aria-hidden />
      <div className="home-brand-story-premium-inner site-container py-16 md:py-20 lg:py-24">
        <div className="home-brand-story-grid">
          <div className="home-brand-story-copy">
            <p className="home-brand-story-eyebrow">
              <span>{brandStory?.eyebrow || 'Brand story'}</span>
            </p>
            <h2 className="home-brand-story-title font-display">
              <BrandStoryHeadline text={headline} />
            </h2>
            <p className="home-brand-story-body">
              {brandStory?.body ||
                'We make fewer pieces, with better fiber, for people who treat clothing as identity, not ornament. Every release is a chapter — yours to wear in.'}
            </p>
            <Link to={brandStory?.ctaLink || '/about'} className="home-brand-story-cta">
              {brandStory?.ctaLabel || 'Read the full story'}
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          </div>

          <div className="home-brand-story-visual">
            {brandStory?.imageUrl ? (
              <div className="home-brand-story-card">
                <span className="home-brand-story-card-back" aria-hidden />
                <div className="home-brand-story-card-frame">
                  {brandStory.mediaType === 'video' ? (
                    <video
                      src={brandStory.imageUrl}
                      className="home-brand-story-card-media"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    <img src={brandStory.imageUrl} alt="" className="home-brand-story-card-media" loading="lazy" />
                  )}
                  <span className="home-brand-story-badge home-brand-story-badge--fit">OVERSIZED FIT</span>
                  <span className="home-brand-story-badge home-brand-story-badge--rating">
                    <Star size={12} fill="currentColor" aria-hidden />
                    4.6
                  </span>
                </div>
              </div>
            ) : (
              <div className="home-brand-story-card home-brand-story-card--empty">
                <span className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Upload image in admin → Brand story</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}