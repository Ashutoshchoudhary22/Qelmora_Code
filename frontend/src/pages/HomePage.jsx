import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { api } from '../api/client';
import { CategoryCollectionCards } from '../components/CategoryCollectionCards';
import { CollectionPlacementGrid } from '../components/CollectionPlacementGrid';
import { ProductGrid } from '../components/ProductGrid';
import { Newsletter } from '../components/Newsletter';
import { HeroBannerMedia } from '../components/home/HeroBannerMedia';
import { HomePromoBand } from '../components/home/HomePromoBand';
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
      <section className="home-hero relative flex min-h-[min(78vh,44rem)] items-end justify-start">
        {hero?.secureUrl ? (
          <HeroBannerMedia hero={hero} />
        ) : (
          <div className="hero-fallback home-hero-fill z-0 bg-[radial-gradient(ellipse_at_70%_20%,#3d342c_0%,#151311_45%,#090909_80%)]" />
        )}
        <div className="hero-scrim home-hero-fill z-[1]" aria-hidden />
        <div className="home-hero-content site-container relative z-[2] w-full pb-10 pt-0 md:pb-14">
          <p className="home-hero-kicker animate-fade-up">
            {hero?.subtitle || 'Premium streetwear'}
          </p>
          <h1 className="home-hero-title font-display font-semibold animate-fade-up">
            {hero?.title || 'QELMORA®'}
          </h1>
          <p className="home-hero-tagline animate-fade-up">Elevated essentials for a bold lifestyle</p>
          <p className="home-hero-desc animate-fade-up">
            Premium Hoodies • Sweatshirts • T-Shirts &amp; More
          </p>
          <div className="home-hero-actions animate-fade-up">
            <Link to={hero?.ctaLink || '/shop/men'} className="btn-hero-primary">
              <ShoppingBag size={16} strokeWidth={1.75} aria-hidden />
              <span>{hero?.ctaLabel || 'Explore collection'}</span>
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
            </Link>
            <Link to="/about" className="btn-hero-secondary">
              <span>Our story</span>
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="site-container py-20">
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
        <div className="site-container">
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

      <HomePromoBand banner={promoItem} />

      <section className="site-container grid gap-10 py-20 md:grid-cols-2 md:items-center">
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

      <section className="home-brand-story border-y border-white/10 bg-[#0a0a0a]">
        <div className="site-container grid gap-12 py-16 md:grid-cols-2 md:items-center md:gap-16 md:py-24 lg:gap-20">
          <div className="max-w-xl md:pr-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">{brandStory?.eyebrow || 'Brand story'}</p>
            <h2 className="font-display mt-5 text-3xl font-light leading-snug tracking-tight text-stone-100 md:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {brandStory?.headline ||
                'QELMORA began with a refusal — to chase trends, to shout, to compromise on the stitch.'}
            </h2>
            <p className="mt-6 text-sm leading-8 text-stone-500 md:text-[0.95rem]">
              {brandStory?.body ||
                'We make fewer pieces, with better fiber, for people who treat clothing as identity, not ornament. Every release is a chapter — yours to wear in.'}
            </p>
            <Link
              to={brandStory?.ctaLink || '/about'}
              className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-q-accent transition hover:text-q-accent-soft"
            >
              {brandStory?.ctaLabel || 'Read the full story'} <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="w-full md:justify-self-end">
            {brandStory?.imageUrl ? (
              <div className="home-brand-story-media mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden border border-white/10 bg-[#141210] sm:max-w-[340px] md:ml-auto md:max-w-[380px]">
                {brandStory.mediaType === 'video' ? (
                  <video
                    src={brandStory.imageUrl}
                    className="h-full w-full object-cover object-center"
                    muted
                    loop
                    playsInline
                    autoPlay
                  />
                ) : (
                  <img src={brandStory.imageUrl} alt="" className="h-full w-full object-cover object-center" loading="lazy" />
                )}
              </div>
            ) : (
              <div className="mx-auto flex aspect-[4/5] max-w-[300px] items-center justify-center border border-dashed border-white/15 bg-black/20 md:ml-auto md:max-w-[380px]">
                <span className="text-[10px] uppercase tracking-[0.4em] text-stone-600">Brand image</span>
              </div>
            )}
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
