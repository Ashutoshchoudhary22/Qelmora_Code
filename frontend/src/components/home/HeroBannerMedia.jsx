/** Desktop + optional mobile hero assets from homepage_banners API */
export function HeroBannerMedia({ hero, className = 'home-hero-fill z-0' }) {
  if (!hero?.secureUrl) return null;

  const mobileUrl = hero.mobileSecureUrl;
  const mobileType = hero.mobileResourceType || 'image';
  const desktopType = hero.resourceType || 'image';

  const render = (url, type) => {
    if (type === 'video') {
      return <video className={className} src={url} autoPlay muted loop playsInline />;
    }
    return <img src={url} alt={hero.title || 'QELMORA'} className={className} />;
  };

  return (
    <>
      <div className="hidden md:contents">{render(hero.secureUrl, desktopType)}</div>
      <div className="contents md:hidden">
        {mobileUrl ? render(mobileUrl, mobileType) : render(hero.secureUrl, desktopType)}
      </div>
    </>
  );
}