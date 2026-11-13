import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

export default function AdminNowhereElse() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-light">Nowhere Else page</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          Tiles on /collections (Nowhere Else). Same add flow as homepage — exclusive capsules, drops, or shop links.
        </p>
      </div>
      <ShopOfferPanel
        placement="page_nowhere_else"
        label="Nowhere Else tiles"
        previewPath="/collections"
        sizeVariant="categoryCard"
        description="Shown below the page headline. Use sort order for display sequence."
      />
    </div>
  );
}
