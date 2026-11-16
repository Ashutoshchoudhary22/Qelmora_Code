import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { ShopOfferBanners } from '../components/shop/ShopOfferBanners';
import { TrendingCategories } from '../components/shop/TrendingCategories';

const TITLES = {
  men: 'Men',
  women: 'Women',
};

export default function ShopPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (category === 'unisex') navigate('/shop/men', { replace: true });
    if (category === 'new-arrivals') navigate('/shop/men#new-arrivals', { replace: true });
    if (searchParams.get('new') === '1' && (category === 'men' || category === 'women')) {
      navigate(`/shop/${category}#new-arrivals`, { replace: true });
    }
  }, [category, navigate, searchParams]);

  const shopCategory = category === 'men' || category === 'women' ? category : null;

  const { data: collection, isLoading: loadingCollection, error } = useQuery({
    queryKey: ['products', 'shop-collection', shopCategory],
    enabled: Boolean(shopCategory),
    queryFn: async () => (await api.get(`/products?category=${shopCategory}&limit=48`)).data,
  });

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['products', 'shop-best', shopCategory],
    enabled: Boolean(shopCategory),
    queryFn: async () =>
      (await api.get(`/products?category=${shopCategory}&featured=1&limit=12`)).data,
  });

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'shop-new', shopCategory],
    enabled: Boolean(shopCategory),
    queryFn: async () =>
      (await api.get(`/products?category=${shopCategory}&newArrival=1&limit=12`)).data,
  });

  const title = TITLES[shopCategory] || 'All collections';
  const offerPlacement = shopCategory === 'men' ? 'shop_men' : shopCategory === 'women' ? 'shop_women' : null;
  const trendingPlacement =
    shopCategory === 'men' ? 'shop_trending_men' : shopCategory === 'women' ? 'shop_trending_women' : null;
  const shopPath = shopCategory ? `/shop/${shopCategory}` : '/shop/men';
  const collectionItems = collection?.items || [];
  const newItems = newArrivals?.items || [];
  const bestItems = bestSellers?.items || [];

  return (
    <>
      {offerPlacement && (
        <div className="not-prose w-full">
          <ShopOfferBanners placement={offerPlacement} />
        </div>
      )}

      <main className="site-container py-14 md:py-20">
        {shopCategory && (
          <section
            id="collection"
            className={`scroll-mt-28 border-b border-white/10 pb-14 ${offerPlacement ? 'mt-0' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">In this shop</p>
            <h2 className="font-display mt-2 text-3xl font-light">The collection</h2>
            <p className="mt-2 max-w-lg text-xs text-stone-500">
              Every active product assigned to {title.toLowerCase()} in admin appears here.
            </p>
            {loadingCollection && <p className="mt-8 text-stone-500">Loading…</p>}
            {error && <p className="mt-8 text-stone-500">Unable to load products. Is the API running?</p>}
            {!loadingCollection && !error && (
              <div className="mt-8">
                <ProductGrid
                  items={collectionItems}
                  empty={`No active ${title.toLowerCase()} products yet. In admin, select ${title} under Shop categories and save.`}
                />
              </div>
            )}
          </section>
        )}

        {shopCategory && (loadingNew || newItems.length > 0) && (
          <section id="new-arrivals" className="mt-14 scroll-mt-28 border-b border-white/10 pb-14">
            <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Just landed</p>
            <h2 className="font-display mt-2 text-3xl font-light">New arrivals</h2>
            {loadingNew ? (
              <p className="mt-8 text-stone-500">Loading new pieces…</p>
            ) : (
              <div className="mt-8">
                <ProductGrid items={newItems} empty="New drops will appear here when marked in admin." />
              </div>
            )}
          </section>
        )}

        {trendingPlacement && (
          <TrendingCategories placement={trendingPlacement} shopPath={shopPath} genderLabel={title.toLowerCase()} />
        )}

        {shopCategory && (
          <section id="best-sellers" className="mt-14 scroll-mt-28">
            <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Curated</p>
            <h2 className="font-display mt-2 text-3xl font-light">Best sellers</h2>
            {loadingBest && <p className="mt-8 text-stone-500">Loading…</p>}
            {!loadingBest && (
              <div className="mt-8">
                <ProductGrid
                  items={bestItems}
                  empty={`Mark ${title.toLowerCase()} products as Featured in admin to show them here.`}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
