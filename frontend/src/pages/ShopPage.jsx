import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { ShopOfferBanners } from '../components/shop/ShopOfferBanners';
import { ShopSectionBand } from '../components/shop/ShopSectionBand';
import { TrendingCategories } from '../components/shop/TrendingCategories';
import { ViewAllLink } from '../components/shop/ViewAllLink';

const TITLES = {
  men: 'Men',
  women: 'Women',
};

const COLLECTION_COPY = {
  men: {
    eyebrow: 'Shop the edit',
    headline: 'The men’s collection',
    sub: 'Elevated staples and statement layers — small batches, live inventory. Find your size before it’s gone.',
  },
  women: {
    eyebrow: 'Shop the edit',
    headline: 'The women’s collection',
    sub: 'Quiet confidence in every cut — limited pieces, updated in real time. Own the look while stock lasts.',
  },
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
    queryFn: async () => (await api.get(`/products?category=${shopCategory}&limit=4`)).data,
  });

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['products', 'shop-best', shopCategory],
    enabled: Boolean(shopCategory),
    queryFn: async () =>
      (await api.get(`/products?category=${shopCategory}&featured=1&limit=4`)).data,
  });

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'shop-new', shopCategory],
    enabled: Boolean(shopCategory),
    queryFn: async () =>
      (await api.get(`/products?category=${shopCategory}&newArrival=1&limit=4`)).data,
  });

  const title = TITLES[shopCategory] || 'All collections';
  const offerPlacement = shopCategory === 'men' ? 'shop_men' : shopCategory === 'women' ? 'shop_women' : null;
  const trendingPlacement =
    shopCategory === 'men' ? 'shop_trending_men' : shopCategory === 'women' ? 'shop_trending_women' : null;
  const shopPath = shopCategory ? `/shop/${shopCategory}` : '/shop/men';
  const collectionItems = collection?.items || [];
  const collectionTotal = collection?.total ?? collectionItems.length;
  const newItems = newArrivals?.items || [];
  const newTotal = newArrivals?.total ?? newItems.length;
  const bestItems = bestSellers?.items || [];
  const bestTotal = bestSellers?.total ?? bestItems.length;
  const collectionCopy = shopCategory ? COLLECTION_COPY[shopCategory] : null;

  return (
    <>
      {offerPlacement && (
        <div className="not-prose w-full">
          <ShopOfferBanners placement={offerPlacement} />
        </div>
      )}

      {shopCategory && (
        <ShopSectionBand shopCategory={shopCategory} section="collection">
          <section
            id="collection"
            className={`site-container scroll-mt-28 border-b border-white/10 py-14 md:py-20 ${
              offerPlacement ? '' : 'pt-14'
            }`}
          >
            {collectionCopy && (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 max-w-2xl flex-1">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">{collectionCopy.eyebrow}</p>
                  <h2 className="font-display mt-3 text-4xl font-light tracking-tight text-stone-50 md:text-5xl">
                    {collectionCopy.headline}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-stone-400">{collectionCopy.sub}</p>
                  {!loadingCollection && !error && collectionTotal > 0 && (
                    <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-stone-500">
                      {collectionTotal} piece{collectionTotal === 1 ? '' : 's'} available now
                    </p>
                  )}
                </div>
                {!loadingCollection && !error && (
                  <ViewAllLink
                    to={`/shop/${shopCategory}/all`}
                    total={collectionTotal}
                    className="self-start sm:mt-1"
                  />
                )}
              </div>
            )}
            {loadingCollection && <p className="mt-10 text-stone-500">Loading the collection…</p>}
            {error && <p className="mt-10 text-stone-500">Unable to load products. Is the API running?</p>}
            {!loadingCollection && !error && (
              <div className="mt-10 md:mt-12">
                <ProductGrid
                  items={collectionItems}
                  empty="Fresh styles are on the way. Join the list below or check back soon."
                />
              </div>
            )}
          </section>
        </ShopSectionBand>
      )}

      {shopCategory && (loadingNew || newItems.length > 0) && (
        <ShopSectionBand shopCategory={shopCategory} section="new_arrivals">
          <section id="new-arrivals" className="site-container scroll-mt-28 border-b border-white/10 py-14 md:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Just landed</p>
                <h2 className="font-display mt-2 text-3xl font-light">New arrivals</h2>
              </div>
              {!loadingNew && (
                <ViewAllLink to={`/shop/${shopCategory}/new-arrivals`} total={newTotal} className="self-start" />
              )}
            </div>
            {loadingNew ? (
              <p className="mt-8 text-stone-500">Loading new pieces…</p>
            ) : (
              <div className="mt-8">
                <ProductGrid items={newItems} empty="New drops will appear here when marked in admin." />
              </div>
            )}
          </section>
        </ShopSectionBand>
      )}

      {trendingPlacement && shopCategory && (
        <ShopSectionBand shopCategory={shopCategory} section="trending">
          <div className="site-container">
            <TrendingCategories placement={trendingPlacement} shopPath={shopPath} genderLabel={title.toLowerCase()} />
          </div>
        </ShopSectionBand>
      )}

      {shopCategory && (
        <ShopSectionBand shopCategory={shopCategory} section="best_sellers">
          <section id="best-sellers" className="site-container scroll-mt-28 py-14 md:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Curated</p>
                <h2 className="font-display mt-2 text-3xl font-light">Best sellers</h2>
              </div>
              {!loadingBest && (
                <ViewAllLink to={`/shop/${shopCategory}/best-sellers`} total={bestTotal} className="self-start" />
              )}
            </div>
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
        </ShopSectionBand>
      )}
    </>
  );
}