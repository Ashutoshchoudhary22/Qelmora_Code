import { ShoppingBag } from 'lucide-react';
import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminHomeShopByCategory() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <ShoppingBag size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Shop by Category</h1>
              <p>Add unlimited category tiles on the homepage &quot;Shop by category&quot; band.</p>
            </div>
          </div>
        </div>
      </header>

      <ShopOfferPanel
        variant="premium"
        placement="home_shop_by_category"
        label="Homepage Tiles"
        previewPath="/"
        sizeVariant="categoryCard"
        description="Sort order: control the left-to-right sequence on desktop."
      />
    </div>
  );
}
