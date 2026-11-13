const HINTS = {
  square: 'Size: 800×800 px (1:1). JPG or WebP, ideally under 500 KB.',
  categoryCard: 'Size: 1200×900 px (4:3) or 900×1125 px (4:5). JPG/WebP, under 600 KB.',
  hero: 'Size: 1920×1080 px (16:9). JPG/WebP, under 800 KB.',
  wide: 'Size: 1600×900 px (16:9). JPG/WebP, under 700 KB.',
  portrait: 'Size: 1000×1400 px (3:4). JPG/WebP, under 600 KB.',
  product: 'Size: at least 1200×1200 px (1:1), plain background. JPG/WebP, under 800 KB per file.',
  instagram: 'Size: 1080×1080 px (1:1). JPG/WebP, under 500 KB.',
  loginSplit: 'Size: 900×1200 px (3:4) for the side panel. JPG/WebP, under 600 KB.',
  offerTile: 'Size: 800×800 px (1:1) for shop offer carousel. JPG/WebP, under 500 KB.',
  promoWide: 'Size: 1920×720 px wide banner. JPG/WebP, under 800 KB.',
  videoShort: 'Video: MP4, under 15 MB, short loop (no audio needed).',
};

export function UploadSizeHint({ variant = 'square', video, className = '' }) {
  return (
    <p className={`text-[10px] leading-relaxed tracking-wide text-stone-600 ${className}`}>
      {HINTS[variant]}
      {video ? <> · {HINTS.videoShort}</> : null}
    </p>
  );
}

export function bannerPlacementSize(placement) {
  switch (placement) {
    case 'hero':
      return 'hero';
    case 'promo':
      return 'promoWide';
    case 'collection':
      return 'wide';
    case 'home_shop_by_category':
    case 'page_nowhere_else':
    case 'shop_trending_men':
    case 'shop_trending_women':
      return 'categoryCard';
    case 'shop_men':
    case 'shop_women':
      return 'offerTile';
    default:
      return 'wide';
  }
}
