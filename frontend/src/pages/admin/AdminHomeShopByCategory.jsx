import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

export default function AdminHomeShopByCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-light">Home — Shop by category</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          Add unlimited category tiles on the homepage &quot;Shop by category&quot; band. Title = label on card; link =
          optional path (e.g. /shop/men).
        </p>
      </div>
      <ShopOfferPanel
        placement="home_shop_by_category"
        label="Homepage tiles"
        previewPath="/"
        sizeVariant="categoryCard"
        description="Sort order controls left-to-right sequence on desktop."
      />
    </div>
  );
}
