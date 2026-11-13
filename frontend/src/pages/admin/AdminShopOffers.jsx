import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

export default function AdminShopOffers() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-light">Shop page content</h1>
        <p className="mt-2 text-sm text-stone-500">
          Offer carousel and trending category tiles on each shop page. Best sellers on /shop/men and /shop/women use Featured products in Products admin.
        </p>
      </div>

      <div className="space-y-8">
        <h2 className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Offer carousel</h2>
        <ShopOfferPanel placement="shop_men" label="Men's shop offers" previewPath="/shop/men" sizeVariant="offerTile" />
        <ShopOfferPanel placement="shop_women" label="Women's shop offers" previewPath="/shop/women" sizeVariant="offerTile" />
      </div>

      <div className="space-y-8 border-t border-white/10 pt-10">
        <h2 className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Trending categories</h2>
        <ShopOfferPanel
          placement="shop_trending_men"
          label="Men — trending categories"
          previewPath="/shop/men"
          sizeVariant="categoryCard"
          description="Trending categories tiles on /shop/men (replaces old best sellers block on shop)."
        />
        <ShopOfferPanel
          placement="shop_trending_women"
          label="Women — trending categories"
          previewPath="/shop/women"
          sizeVariant="categoryCard"
          description="Trending categories tiles on /shop/women."
        />
      </div>
    </div>
  );
}
