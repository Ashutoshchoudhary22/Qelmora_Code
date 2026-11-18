import { AccountHeroEditor } from '../../components/admin/AccountHeroEditor';
import { AccountOverviewTilesEditor } from '../../components/admin/AccountOverviewTilesEditor';

export default function AdminAccountHero() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-light">Account page</h1>
        <p className="mt-2 text-sm text-stone-500">
          Hero background and overview shortcut cards on <span className="text-stone-300">/account</span>. Customer name,
          email, and phone still come from their profile.
        </p>
      </div>
      <AccountHeroEditor />
      <AccountOverviewTilesEditor />
    </div>
  );
}