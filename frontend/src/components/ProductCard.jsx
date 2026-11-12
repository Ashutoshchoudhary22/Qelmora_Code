import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { formatInr } from '../lib/money';

export function ProductCard({ product }) {
  const price = Number(product.price);
  const compare = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#161412]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] tracking-[0.4em] text-stone-600">QELMORA</div>
        )}
        {product.isNewArrival && (
          <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 text-[9px] uppercase tracking-widest text-q-accent">
            New
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 pt-4">
        <div>
          <h3 className="text-sm font-medium text-stone-100">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-stone-300">{formatInr(price)}</span>
            {compare != null && compare > price && (
              <span className="text-stone-600 line-through">{formatInr(compare)}</span>
            )}
          </div>
        </div>
        <ArrowUpRight size={16} className="text-stone-600 transition group-hover:text-q-accent" />
      </div>
    </Link>
  );
}
