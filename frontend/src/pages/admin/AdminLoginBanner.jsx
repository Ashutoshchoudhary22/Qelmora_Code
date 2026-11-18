import { LogIn } from 'lucide-react';
import { LoginBannerEditor } from '../../components/admin/LoginBannerEditor';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminLoginBanner() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <LogIn size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Login Banner</h1>
              <p>Side image and copy shown beside the login and signup forms.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body">
        <LoginBannerEditor variant="premium" />
      </div>
    </div>
  );
}