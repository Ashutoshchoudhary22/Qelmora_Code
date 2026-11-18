import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { ShopBreadcrumb } from '../components/shop/ShopBreadcrumb';
import { ShopProductFilters } from '../components/shop/ShopProductFilters';
import { buildBandProductUrl, SHOP_SORT_OPTIONS } from '../lib/shopListFilters';

const TITLES = { men: 'Men', women: 'Women' };

const BANDS = {
  all: {
    eyebrow: null,
    headline: (gender) => `Clothes for ${gender.toLowerCase()}`,
    sub: null,
    baseQuery: (cat) => `category=${cat}`,
    empty: 'No products in this collection yet.',
    showHighlightFilters: true,
    bandLocks: {},
  },
  'new-arrivals': {
    eyebrow: 'Just landed',
    headline: () => 'New arrivals',
    sub: (gender) => `Every new drop in the ${gender.toLowerCase()}’s shop.`,
    baseQuery: (cat) => `category=${cat}&newArrival=1`,
    empty: 'No new arrivals in this shop yet.',
    showHighlightFilters: false,
    bandLocks: { newArrival: true },
  },
  'best-sellers': {
    eyebrow: 'Curated',
    headline: () => 'Best sellers',
    sub: (gender) => `Featured pieces for ${gender.toLowerCase()} — marked in Products admin.`,
    baseQuery: (cat) => `category=${cat}&featured=1`,
    empty: 'No featured products in this shop yet.',
    showHighlightFilters: false,
    bandLocks: { featured: true },
  },
};

export default function ShopBandPage() {
  const { category, band } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopCategory = category === 'men' || category === 'women' ? category : null;
  const bandConfig = BANDS[band];
  const title = TITLES[shopCategory] || 'Shop';

  const listPath = shopCategory && bandConfig
    ? buildBandProductUrl(`/products?${bandConfig.baseQuery(shopCategory)}&limit=48`, searchParams)
    : null;
  const facetsPath =
    shopCategory && bandConfig
      ? buildBandProductUrl(`/products/facets?${bandConfig.baseQuery(shopCategory)}`, searchParams)
      : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'shop-band', shopCategory, band, listPath],
    enabled: Boolean(listPath),
    queryFn: async () => (await api.get(listPath)).data,
  });

  const { data: facets } = useQuery({
    queryKey: ['products', 'shop-facets', shopCategory, band, facetsPath],
    enabled: Boolean(facetsPath),
    queryFn: async () => (await api.get(facetsPath)).data,
  });

  const items = data?.items || [];
  const total = data?.total ?? items.length;
  const sort = searchParams.get('sort') || 'newest';

  if (!shopCategory || !bandConfig) {
    return (
      <main className="site-container py-20">
        <p className="text-stone-500">Page not found.</p>
        <Link to="/shop/men" className="mt-4 inline-block text-sm text-q-accent">
          Back to shop
        </Link>
      </main>
    );
  }

  const headline = typeof bandConfig.headline === 'function' ? bandConfig.headline(title) : bandConfig.headline(title);

  function onSortChange(e) {
    const value = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (value === 'newest') next.delete('sort');
    else next.set('sort', value);
    setSearchParams(next, { replace: true });
  }

  return (
    <main className="site-container pb-10 pt-4 md:pb-14 md:pt-5">
      <ShopBreadcrumb category={shopCategory} band={band} />

      <header className="mt-3 flex flex-col gap-4 sm:mt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          {bandConfig.eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">{bandConfig.eyebrow}</p>
          )}
          <h1
            className={`font-display flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-3xl font-light tracking-tight md:text-4xl ${
              bandConfig.eyebrow ? 'mt-2' : ''
            }`}
          >
            <span>{headline}</span>
            {!isLoading && !error && (
              <span className="font-sans text-sm font-normal text-stone-500 md:text-[0.95rem]">
                {total} product{total === 1 ? '' : 's'}
              </span>
            )}
          </h1>
          {bandConfig.sub && (
            <p className="mt-2 text-sm leading-relaxed text-stone-400">{bandConfig.sub(title)}</p>
          )}
        </div>

        <div className="shop-sort-field flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 lg:ml-auto">
          <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Sort by</span>
          <select
            value={sort}
            onChange={onSortChange}
            className="min-w-[12.5rem] border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-q-accent dark:border-white/15 dark:bg-[#141210] dark:text-stone-100"
            aria-label="Sort products"
          >
            {SHOP_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-6 lg:mt-6 lg:flex-row lg:items-start lg:gap-8">
        <ShopProductFilters
          genderLabel={title}
          facets={facets}
          showHighlightFilters={bandConfig.showHighlightFilters}
          bandLocks={bandConfig.bandLocks}
          className="order-1 lg:sticky lg:top-28 lg:w-[min(100%,19rem)] lg:shrink-0"
        />

        <div className="order-2 min-w-0 flex-1">
          {isLoading && <p className="text-stone-500">Loading…</p>}
          {error && <p className="text-stone-500">Unable to load products.</p>}
          {!isLoading && !error && (
            <ProductGrid items={items} empty={bandConfig.empty} columnsClass="md:grid-cols-2 xl:grid-cols-3" />
          )}
        </div>
      </div>
    </main>
  );
}