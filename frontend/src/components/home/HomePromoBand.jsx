import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BRAND_NAME } from '../../lib/brand';

export function HomePromoBand({ banner }) {
  const ctaLink = banner?.ctaLink || '/shop/men';
  const url = banner?.secureUrl;
  const isVideo = banner?.resourceType === 'video';

  return (
    <section className="site-container py-10 md:py-14">
      <div className="home-promo-band group relative min-h-[300px] overflow-hidden border border-white/10 bg-[#141210] md:min-h-[380px] lg:min-h-[420px]">
        {url &&
          (isVideo ? (
            <video
              src={url}
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ))}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/88 via-black/50 to-black/20 md:from-black/82 md:via-black/40 md:to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:hidden" aria-hidden />

        <div className="home-promo-band-copy relative z-[2] flex min-h-[300px] flex-col justify-center px-6 py-12 md:min-h-[380px] md:max-w-2xl md:px-12 lg:min-h-[420px] lg:px-16">
          <p className="home-limited-offer-label home-promo-eyebrow">Limited offer</p>
          <h2 className="home-promo-brand font-display">
            {BRAND_NAME}
            <sup className="home-promo-reg" aria-hidden>
              ®
            </sup>
          </h2>
          <p className="home-promo-tagline">Premium streetwear</p>
          <Link to={ctaLink} className="home-promo-cta">
            <span>Shop now</span>
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}