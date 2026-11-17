import { Link } from 'react-router-dom';

export function HomePromoBand({ banner }) {
  const title = banner?.title || 'Archive edit — up to 30% on signature outerwear';
  const subtitle = banner?.subtitle?.trim();
  const ctaLabel = banner?.ctaLabel || 'Shop the edit';
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

        <div className="relative flex min-h-[300px] flex-col justify-center px-6 py-12 md:min-h-[380px] md:max-w-2xl md:px-12 lg:min-h-[420px] lg:px-16">
          <p className="text-[10px] uppercase tracking-[0.45em] text-q-accent">Limited offer</p>
          <h2 className="font-display mt-4 text-4xl font-light leading-[1.08] tracking-tight text-stone-50 md:text-5xl lg:text-[3.25rem]">
            {title}
          </h2>
          {subtitle && <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-300 md:text-base">{subtitle}</p>}
          <Link to={ctaLink} className="btn-primary btn-accent mt-8 w-fit px-8 py-3 text-[11px] tracking-[0.22em]">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}