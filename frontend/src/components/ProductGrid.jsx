import { ProductCard } from './ProductCard';

export function ProductGrid({
  items,
  empty = 'No pieces in this collection yet.',
  columnsClass = 'md:grid-cols-3 lg:grid-cols-4',
}) {
  if (!items?.length) {
    return <p className="py-12 text-sm text-stone-500">{empty}</p>;
  }
  return (
    <div className={`grid grid-cols-2 gap-4 md:gap-6 ${columnsClass}`}>
      {items.map((p) => (
        <ProductCard key={p.id || p.slug} product={p} />
      ))}
    </div>
  );
}
