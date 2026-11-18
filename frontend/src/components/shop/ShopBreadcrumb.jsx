import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const BAND_LABELS = {
  all: null,
  'new-arrivals': 'New arrivals',
  'best-sellers': 'Best sellers',
};

export function ShopBreadcrumb({ category, band }) {
  const gender = category === 'women' ? 'Women' : 'Men';
  const collectionLabel = `${gender} Clothing`;
  const shopPath = `/shop/${category}`;
  const bandLabel = BAND_LABELS[band] ?? band;

  const crumbs = [
    { label: 'Home', to: '/' },
    { label: gender, to: shopPath },
  ];

  if (band === 'all' || !bandLabel) {
    crumbs.push({ label: collectionLabel, current: true });
  } else {
    crumbs.push({ label: bandLabel, current: true });
  }

  return (
    <nav className="shop-breadcrumb flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 && (
            <ChevronRight size={14} className="shop-breadcrumb-sep shrink-0" aria-hidden />
          )}
          {crumb.current ? (
            <span className="shop-breadcrumb-current font-semibold">{crumb.label}</span>
          ) : (
            <Link to={crumb.to} className="shop-breadcrumb-link transition hover:text-q-accent">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}