import { Tag } from 'lucide-react';
import {
  ShopMenOffersBandBackgroundEditor,
  ShopWomenOffersBandBackgroundEditor,
} from '../../components/admin/FooterBackgroundEditor';
import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminShopOffers() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <Tag size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Shop Offers</h1>
              <p>
                Offer carousel at the top of each shop page. Trending categories live in Admin → Trending categories.
                Best sellers use Featured products in Products admin.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body flex flex-col gap-8">
        <ShopMenOffersBandBackgroundEditor />
        <ShopOfferPanel
          variant="premium"
          sectionOnly
          placement="shop_men"
          label="Men's Shop Offers"
          previewPath="/shop/men"
          sizeVariant="offerTile"
          description="Carousel on /shop/men. Sort order controls slide sequence."
        />
        <ShopWomenOffersBandBackgroundEditor />
        <ShopOfferPanel
          variant="premium"
          sectionOnly
          placement="shop_women"
          label="Women's Shop Offers"
          previewPath="/shop/women"
          sizeVariant="offerTile"
          description="Carousel on /shop/women. Sort order controls slide sequence."
        />
      </div>
    </div>
  );
}