import { Sparkles } from 'lucide-react';
import { NowhereElseBandBackgroundEditor } from '../../components/admin/FooterBackgroundEditor';
import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminNowhereElse() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <Sparkles size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Nowhere Else</h1>
              <p>
                Tiles on /collections (Nowhere Else). Same add flow as homepage — exclusive capsules, drops, or shop
                links.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body flex flex-col gap-8">
        <NowhereElseBandBackgroundEditor />
        <ShopOfferPanel
        variant="premium"
        placement="page_nowhere_else"
        label="Nowhere Else Tiles"
        previewPath="/collections"
        sizeVariant="categoryCard"
        description="Shown below the page headline. Use sort order for display sequence."
        />
      </div>
    </div>
  );
}