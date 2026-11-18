import { FileText } from 'lucide-react';
import { StaticPageEditor } from '../../components/admin/StaticPageEditor';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminStaticPages() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <FileText size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">About &amp; Contact</h1>
              <p>
                Edit /about and /contact copy, images, and contact form email line. Messages appear in Contact inbox.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <StaticPageEditor variant="premium" sectionKey="about" pageTitle="About us" pagePath="/about" />
          <StaticPageEditor variant="premium" sectionKey="contact" pageTitle="Contact us" pagePath="/contact" />
        </div>
      </div>
    </div>
  );
}