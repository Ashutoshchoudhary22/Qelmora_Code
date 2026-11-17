import { ShopOfferPanel } from '../../components/admin/ShopOfferPanel';

export default function AdminTrendingCategories() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-light">Trending categories</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          Category tiles in the Discover band on each gender shop page — below the collection and offer carousel on{' '}
          <span className="text-stone-400">/shop/men</span> and <span className="text-stone-400">/shop/women</span>.
        </p>
      </div>

      <div className="space-y-8">
        <ShopOfferPanel
          placement="shop_trending_men"
          label="Men — trending categories"
          previewPath="/shop/men#trending-categories"
          sizeVariant="categoryCard"
          description="Title = label on tile; link = internal path or full URL."
        />
        <ShopOfferPanel
          placement="shop_trending_women"
          label="Women — trending categories"
          previewPath="/shop/women#trending-categories"
          sizeVariant="categoryCard"
          description="Title = label on tile; link = internal path or full URL."
        />
      </div>
    </div>
  );
}