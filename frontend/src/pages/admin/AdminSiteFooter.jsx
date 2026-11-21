import { PanelBottom } from 'lucide-react';
import { FooterAndNewsletterEditors } from '../../components/admin/FooterBackgroundEditor';

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
              <h1 className="font-display">Bands &amp; footer</h1>
              <p>Background images for brand story, newsletter, and footer sections on the storefront.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body">
        <FooterAndNewsletterEditors />
      </div>
    </div>
  );
}