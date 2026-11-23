import { LogIn } from 'lucide-react';
import { LoginFormBandBackgroundEditor } from '../../components/admin/FooterBackgroundEditor';
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
              <p>Light/dark backgrounds for the form column and left campaign panel on /login and /register.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body flex flex-col gap-8">
        <LoginFormBandBackgroundEditor />
        <LoginBannerEditor variant="premium" />
      </div>
    </div>
  );
}