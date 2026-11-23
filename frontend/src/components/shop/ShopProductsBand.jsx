import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { hasCustomBandBackground, useBandBackgroundUrl } from '../../lib/useBandBackground';

const SHOP_PRODUCTS_BAND_KEYS = {
  men: 'shop_men_products_band',
  women: 'shop_women_products_band',
};

/** Full-width band behind shop listing blocks (collection, new arrivals, view-all pages). */
export function ShopProductsBand({ shopCategory, children, className = '' }) {
  const productsBandKey = shopCategory ? SHOP_PRODUCTS_BAND_KEYS[shopCategory] : null;

  const { data: productsBandCfg } = useQuery({
    queryKey: ['content', productsBandKey],
    queryFn: async () => {
      try {
        return (await api.get(`/content/${productsBandKey}`)).data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(productsBandKey),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const productsBgUrl = useBandBackgroundUrl(productsBandCfg, '', '');
  const hasProductsBandBg = hasCustomBandBackground(productsBandCfg);

  if (!shopCategory) {
    return children;
  }

  return (
    <div
      className={`shop-products-band relative w-full overflow-hidden${hasProductsBandBg ? ' shop-products-band--has-bg' : ''} ${className}`.trim()}
    >
      {hasProductsBandBg && productsBgUrl && (
        <>
          <div
            className="shop-products-band-bg"
            style={{ backgroundImage: `url(${productsBgUrl})` }}
            aria-hidden
          />
          <div className="shop-products-band-scrim" aria-hidden />
        </>
      )}
      {children}
    </div>
  );
}