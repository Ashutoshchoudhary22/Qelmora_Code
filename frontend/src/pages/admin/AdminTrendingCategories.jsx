import { LayoutGrid } from 'lucide-react';
import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminTrendingCategories() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <LayoutGrid size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Trending Categories</h1>
              <p>
                Category tiles in the Discover band on each gender shop page — below the collection and offer carousel
                on <span className="text-stone-600">/shop/men</span> and{' '}
                <span className="text-stone-600">/shop/women</span>.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body flex flex-col gap-8">
        <ShopOfferPanel
          variant="premium"
          sectionOnly
          placement="shop_trending_men"
          label="Men — Trending Categories"
          previewPath="/shop/men#trending-categories"
          sizeVariant="categoryCard"
          description="Title = label on tile; link = internal path or full URL."
        />
        <ShopOfferPanel
          variant="premium"
          sectionOnly
          placement="shop_trending_women"
          label="Women — Trending Categories"
          previewPath="/shop/women#trending-categories"
          sizeVariant="categoryCard"
          description="Title = label on tile; link = internal path or full URL."
        />
      </div>
    </div>
  );
}