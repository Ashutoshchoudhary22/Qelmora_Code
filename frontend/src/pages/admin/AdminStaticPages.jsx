import { StaticPageEditor } from '../../components/admin/StaticPageEditor';

export default function AdminStaticPages() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-light">About & Contact</h1>
        <p className="mt-2 text-sm text-stone-500">One place to edit copy and hero images for /about and /contact.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <StaticPageEditor sectionKey="about" pageTitle="About us" pagePath="/about" />
        <StaticPageEditor sectionKey="contact" pageTitle="Contact us" pagePath="/contact" />
      </div>
    </div>
  );
}
