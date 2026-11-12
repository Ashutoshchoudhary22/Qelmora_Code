import { LoginBannerEditor } from '../../components/admin/LoginBannerEditor';

export default function AdminLoginBanner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-light">Login banner</h1>
        <p className="mt-2 text-sm text-stone-500">Side image and copy shown beside the login and signup forms.</p>
      </div>
      <LoginBannerEditor />
    </div>
  );
}
