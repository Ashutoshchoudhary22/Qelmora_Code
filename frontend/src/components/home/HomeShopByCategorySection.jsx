import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useBandBackgroundUrl } from '../../lib/useBandBackground';
import { CategoryCollectionCards } from '../CategoryCollectionCards';
import { CollectionPlacementGrid } from '../CollectionPlacementGrid';

const DEFAULT_SHOP_CATEGORY_BG = '/profile/our-story-golden-silk.png';

export function HomeShopByCategorySection() {
  const { data: bandCfg } = useQuery({
    queryKey: ['content', 'shop_by_category_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/shop_by_category_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const { data: homeCategoryTiles } = useQuery({
    queryKey: ['banners', 'home_shop_by_category'],
    queryFn: async () => (await api.get('/banners?placement=home_shop_by_category')).data,
  });

  const hasHomeCategoryTiles = (homeCategoryTiles?.items || []).length > 0;
  const bgUrl = useBandBackgroundUrl(bandCfg, DEFAULT_SHOP_CATEGORY_BG);

  return (
    <section className="home-shop-category-band relative overflow-hidden">
      <div className="home-shop-category-band-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden />
      <div className="home-shop-category-band-scrim" aria-hidden />

      <div className="home-shop-category-band-inner site-container relative z-[2] py-20">
        <p className="home-shop-category-eyebrow">Shop by category</p>
        {hasHomeCategoryTiles ? (
          <CollectionPlacementGrid
            placement="home_shop_by_category"
            columns={2}
            className="mt-10"
          />
        ) : (
          <CategoryCollectionCards
            items={categories?.items}
            slugs={['men', 'women']}
            columns={2}
            className="mt-10"
          />
        )}
      </div>
    </section>
  );
}