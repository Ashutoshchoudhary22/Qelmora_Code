import { PanelBottom } from 'lucide-react';
import { FooterBackgroundEditor } from '../../components/admin/FooterBackgroundEditor';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminSiteFooter() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <PanelBottom size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Site footer</h1>
              <p>Optional background image for the storefront footer across all pages.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body">
        <FooterBackgroundEditor />
      </div>
    </div>
  );
}