import { User } from 'lucide-react';
import { AccountHeroEditor } from '../../components/admin/AccountHeroEditor';
import { AccountOverviewTilesEditor } from '../../components/admin/AccountOverviewTilesEditor';

const ADMIN_WELCOME_BG = '/profile/QELMORA-admin.png';

export default function AdminAccountHero() {
  return (
    <div className="admin-products-page">
      <header className="admin-welcome-band admin-welcome-band--qelmora">
        <div className="admin-welcome-band-bg" style={{ backgroundImage: `url(${ADMIN_WELCOME_BG})` }} />
        <div className="admin-welcome-band-scrim" aria-hidden />
        <div className="admin-welcome-band-inner admin-products-hero-inner">
          <div className="admin-products-hero-copy">
            <span className="admin-product-card-head-icon" aria-hidden>
              <User size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="font-display">Account Page</h1>
              <p>
                Hero background and overview shortcut cards on{' '}
                <span className="text-stone-600">/account</span>. Customer name, email, and phone still come from their
                profile.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-products-body flex flex-col gap-6">
        <AccountHeroEditor variant="premium" />
        <AccountOverviewTilesEditor variant="premium" />
      </div>
    </div>
  );
}