import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { hasCustomBandBackground, useBandBackgroundUrl } from '../../lib/useBandBackground';

/** site_sections keys: shop_{men|women}_{section}_band */
export function shopSectionBandKey(shopCategory, section) {
  if (!shopCategory || !section) return null;
  return `shop_${shopCategory}_${section}_band`;
}

export const SHOP_BAND_SECTIONS = {
  collection: 'collection',
  new_arrivals: 'new_arrivals',
  trending: 'trending',
  best_sellers: 'best_sellers',
};

/** One full-width band background per shop page block (not one image for the whole page). */
export function ShopSectionBand({ shopCategory, section, children, className = '' }) {
  const bandKey = shopSectionBandKey(shopCategory, section);

  const { data: bandCfg } = useQuery({
    queryKey: ['content', bandKey],
    queryFn: async () => {
      try {
        return (await api.get(`/content/${bandKey}`)).data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(bandKey),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const bgUrl = useBandBackgroundUrl(bandCfg, '', '');
  const hasCustomBg = hasCustomBandBackground(bandCfg);

  if (!shopCategory) {
    return children;
  }

  return (
    <div
      className={`shop-section-band relative w-full overflow-hidden${
        hasCustomBg ? ' shop-section-band--has-bg' : ''
      } ${className}`.trim()}
    >
      {hasCustomBg && bgUrl && (
        <>
          <div
            className="shop-section-band-bg"
            style={{ backgroundImage: `url(${bgUrl})` }}
            aria-hidden
          />
          <div className="shop-section-band-scrim" aria-hidden />
        </>
      )}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}