import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { api } from '../api/client';
import { Newsletter } from '../components/Newsletter';
import { HeroBannerMedia } from '../components/home/HeroBannerMedia';
import { formatBrandTitle } from '../lib/brand';
import { HomePromoBand } from '../components/home/HomePromoBand';
import { BrandStorySection } from '../components/home/BrandStorySection';
import { FeaturedCollectionSection } from '../components/home/FeaturedCollectionSection';
import { HomeInstagramSection } from '../components/home/HomeInstagramSection';
import { HomeNewArrivalsSection } from '../components/home/HomeNewArrivalsSection';
import { HomeShopByCategorySection } from '../components/home/HomeShopByCategorySection';
export default function HomePage() {
  const { data: heroBanners } = useQuery({
    queryKey: ['banners', 'hero'],
    queryFn: async () => (await api.get('/banners?placement=hero')).data,
  });
  const hero = heroBanners?.items?.[0];

  const { data: promo } = useQuery({
    queryKey: ['banners', 'promo'],
    queryFn: async () => (await api.get('/banners?placement=promo')).data,
  });

  const promoItem = promo?.items?.[0];

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
          <p className="home-hero-kicker animate-fade-up">{hero?.subtitle || 'Premium streetwear'}</p>
          <h1 className="home-hero-title font-display font-semibold animate-fade-up">
            {formatBrandTitle(hero?.title, { suffix: '®' })}
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

      <HomeNewArrivalsSection />

      <HomeShopByCategorySection />

      <HomePromoBand banner={promoItem} />

      <FeaturedCollectionSection />

      <BrandStorySection />

      <HomeInstagramSection />

      <Newsletter />
    </main>
  );
}
