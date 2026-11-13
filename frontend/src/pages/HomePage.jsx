import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play } from 'lucide-react';
import { api } from '../api/client';
import { CategoryCollectionCards } from '../components/CategoryCollectionCards';
import { CollectionPlacementGrid } from '../components/CollectionPlacementGrid';
import { ProductGrid } from '../components/ProductGrid';
import { Newsletter } from '../components/Newsletter';
export default function HomePage() {
  const { data: heroBanners } = useQuery({
    queryKey: ['banners', 'hero'],
    queryFn: async () => (await api.get('/banners?placement=hero')).data,
  });
  const hero = heroBanners?.items?.[0];

  const { data: newMen, isLoading: loadingNewMen } = useQuery({
    queryKey: ['products', 'new', 'men'],
    queryFn: async () => (await api.get('/products?newArrival=1&category=men&limit=4')).data,
  });
  const { data: newWomen, isLoading: loadingNewWomen } = useQuery({
    queryKey: ['products', 'new', 'women'],
    queryFn: async () => (await api.get('/products?newArrival=1&category=women&limit=4')).data,
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

  const { data: promo } = useQuery({
    queryKey: ['banners', 'promo'],
    queryFn: async () => (await api.get('/banners?placement=promo')).data,
  });

  const { data: collectionBanner } = useQuery({
    queryKey: ['banners', 'collection'],
    queryFn: async () => (await api.get('/banners?placement=collection')).data,
  });

  const { data: brandStory } = useQuery({
    queryKey: ['content', 'brand_story'],
    queryFn: async () => (await api.get('/content/brand_story')).data,
  });

  const { data: instagramMeta } = useQuery({
    queryKey: ['content', 'instagram'],
    queryFn: async () => (await api.get('/content/instagram')).data,
  });

  const { data: instagramFeed } = useQuery({
    queryKey: ['instagram'],
    queryFn: async () => (await api.get('/instagram')).data,
  });

  const promoItem = promo?.items?.[0];
  const collectionItem = collectionBanner?.items?.[0];

  return (
    <main>
      <section className="relative flex min-h-[88vh] items-end overflow-hidden">
        {hero?.secureUrl ? (
          hero.resourceType === 'video' ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={hero.secureUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img src={hero.secureUrl} alt={hero.title} className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <div className="hero-fallback absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#3d342c_0%,#151311_45%,#090909_80%)]" />
        )}
        <div className="hero-scrim absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-32 md:px-8 md:pb-24">
          <p className="animate-fade-up text-[10px] uppercase tracking-[0.45em] text-q-accent-soft">
            {hero?.subtitle || 'Autumn / Winter campaign'}
          </p>
          <h1 className="font-display animate-fade-up mt-5 max-w-4xl text-5xl font-light leading-[1.05] tracking-tight text-stone-50 sm:text-7xl md:text-8xl">
            {hero?.title || (
              <>
                Quiet confidence.
                <br />
                <span className="italic text-q-accent">Loud identity.</span>
              </>
            )}
          </h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-stone-300">
            Elevated streetwear and ritual-ready essentials — cut with precision, finished for the long road.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to={hero?.ctaLink || '/shop/men'} className="btn-primary">
              {hero?.ctaLabel || 'Explore collection'} <ArrowUpRight size={15} />
            </Link>
            <Link to="/about" className="btn-primary border-stone-600 text-stone-300 hover:border-stone-200">
              Our story <Play size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Just landed</p>
        <h2 className="font-display mt-2 text-4xl font-light">New arrivals</h2>
        <div className="mt-14 space-y-16">
          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h3 className="font-display text-2xl font-light">Men</h3>
              <Link to="/shop/men#new-arrivals" className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent">
                View all men
              </Link>
            </div>
            {loadingNewMen ? <p className="text-stone-500">Loading…</p> : <ProductGrid items={newMen?.items} />}
          </div>
          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h3 className="font-display text-2xl font-light">Women</h3>
              <Link to="/shop/women#new-arrivals" className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent">
                View all women
              </Link>
            </div>
            {loadingNewWomen ? <p className="text-stone-500">Loading…</p> : <ProductGrid items={newWomen?.items} />}
          </div>
        </div>
      </section>

      <section className="bg-[#0d0d0d] py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-stone-500">Shop by category</p>
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

      <section className="relative mx-auto max-w-7xl overflow-hidden px-5 py-8 md:px-8">
        <div className="relative min-h-[320px] border border-white/10">
          {promoItem?.secureUrl && (
            <img src={promoItem.secureUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative flex min-h-[320px] flex-col justify-center px-8 md:px-16">
            <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Limited offer</p>
            <h2 className="font-display mt-4 max-w-lg text-4xl font-light md:text-5xl">
              {promoItem?.title || 'Archive edit — up to 30% on signature outerwear'}
            </h2>
            <Link to={promoItem?.ctaLink || '/shop/men'} className="btn-primary btn-accent mt-8 w-fit">
              {promoItem?.ctaLabel || 'Shop the edit'}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center md:px-8">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#1a1816]">
          {collectionItem?.secureUrl ? (
            <img src={collectionItem.secureUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs tracking-[0.5em] text-stone-600">FEATURED</div>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Featured collection</p>
          <h2 className="font-display mt-4 text-5xl font-light leading-tight">
            {collectionItem?.title || 'Monochrome volumes'}
          </h2>
          <p className="mt-6 text-sm leading-8 text-stone-400">
            {collectionItem?.subtitle ||
              'Sculpted layers in obsidian, ivory, and a single thread of amber — built for cities that never sleep.'}
          </p>
          <Link to={collectionItem?.ctaLink || '/collections'} className="btn-primary mt-8 inline-flex">
            {collectionItem?.ctaLabel || 'Discover'} <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-2 md:items-center md:px-8">
          <div className="relative min-h-[200px] overflow-hidden">
            <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent md:absolute md:left-0 md:top-0">
              {brandStory?.eyebrow || 'Brand story'}
            </p>
            {brandStory?.imageUrl &&
              (brandStory.mediaType === 'video' ? (
                <video
                  src={brandStory.imageUrl}
                  className="mt-8 w-full object-cover md:mt-14 md:max-h-[320px]"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img src={brandStory.imageUrl} alt="" className="mt-8 w-full object-cover md:mt-14 md:max-h-[320px]" />
              ))}
          </div>
          <div>
            <p className="font-display text-3xl font-light leading-snug text-stone-200 md:text-4xl">
              {brandStory?.headline ||
                'QELMORA began with a refusal — to chase trends, to shout, to compromise on the stitch.'}
            </p>
            <p className="mt-6 text-sm leading-8 text-stone-500">
              {brandStory?.body ||
                'We make fewer pieces, with better fiber, for people who treat clothing as identity, not ornament. Every release is a chapter — yours to wear in.'}
            </p>
            <Link
              to={brandStory?.ctaLink || '/about'}
              className="mt-6 inline-block text-xs uppercase tracking-[0.25em] text-q-accent hover:text-q-accent-soft"
            >
              {brandStory?.ctaLabel || 'Read the full story'} →
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden py-16">
        <p className="mb-8 text-center text-[10px] uppercase tracking-[0.4em] text-stone-600">
          {instagramMeta?.eyebrow || '@qelmora on Instagram'}
        </p>
        <div className="relative flex overflow-hidden">
          <div className="marquee-track flex shrink-0 gap-4 pr-4">
            {(instagramFeed?.items?.length ? [...instagramFeed.items, ...instagramFeed.items] : []).map((post, i) => (
              <a
                key={`${post.id}-${i}`}
                href={instagramMeta?.ctaLink || 'https://instagram.com'}
                target="_blank"
                rel="noreferrer"
                className="block h-48 w-36 shrink-0 overflow-hidden bg-[#1c1a18] md:h-56 md:w-44"
              >
                {post.resourceType === 'video' ? (
                  <video src={post.secureUrl} className="h-full w-full object-cover" muted loop playsInline autoPlay />
                ) : (
                  <img src={post.secureUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </a>
            ))}
            {!instagramFeed?.items?.length &&
              [...Array(16)].map((_, i) => (
                <div key={i} className="h-48 w-36 shrink-0 bg-[#1c1a18] md:h-56 md:w-44" />
              ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
