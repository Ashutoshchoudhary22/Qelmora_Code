import { formatInr } from './money';

export const STANDARD_SHOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SHOP_PRICE_BUCKETS = [
  { id: '400_699', label: `${formatInr(400)} - ${formatInr(699)}` },
  { id: '700_999', label: `${formatInr(700)} - ${formatInr(999)}` },
  { id: '1000_1499', label: `${formatInr(1000)} - ${formatInr(1499)}` },
  { id: '1500_above', label: `${formatInr(1500)} And Above` },
  { id: 'under399', label: `Under ${formatInr(399)}` },
];

export function mergePriceFacets(facetPrices = []) {
  const byId = Object.fromEntries(facetPrices.map((r) => [r.id, Number(r.count) || 0]));
  return SHOP_PRICE_BUCKETS.map((bucket) => ({
    ...bucket,
    count: byId[bucket.id] ?? 0,
  }));
}

export function mergeSizeFacets(facetSizes = []) {
  const byValue = Object.fromEntries(facetSizes.map((r) => [r.value, Number(r.count) || 0]));
  return STANDARD_SHOP_SIZES.map((value) => ({
    value,
    count: byValue[value] ?? 0,
  }));
}

export const SHOP_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price — low to high' },
  { value: 'price_desc', label: 'Price — high to low' },
  { value: 'name_asc', label: 'Name A–Z' },
];

export function parseCsvParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);
}

export function setCsvParam(searchParams, key, values) {
  const next = new URLSearchParams(searchParams);
  const clean = [...new Set(values.filter(Boolean))];
  if (!clean.length) next.delete(key);
  else next.set(key, clean.map(encodeURIComponent).join(','));
  return next;
}

export function buildBandProductUrl(basePath, searchParams) {
  const q = new URLSearchParams();
  const sort = searchParams.get('sort');
  const sizes = searchParams.get('sizes');
  const colors = searchParams.get('colors');
  const prices = searchParams.get('prices');
  const featured = searchParams.get('featured');
  const newArrival = searchParams.get('newArrival');
  const page = searchParams.get('page');
  if (sort && sort !== 'newest') q.set('sort', sort);
  if (sizes) q.set('sizes', sizes);
  if (colors) q.set('colors', colors);
  if (prices) q.set('prices', prices);
  if (featured === '1') q.set('featured', '1');
  if (newArrival === '1') q.set('newArrival', '1');
  if (page && page !== '1') q.set('page', page);
  const query = q.toString();
  return query ? `${basePath}&${query}` : basePath;
}

export function hasActiveFilters(searchParams, { bandFeatured = false, bandNewArrival = false } = {}) {
  const sizes = parseCsvParam(searchParams, 'sizes');
  const colors = parseCsvParam(searchParams, 'colors');
  const prices = parseCsvParam(searchParams, 'prices');
  const sort = searchParams.get('sort');
  const extraFeatured = !bandFeatured && searchParams.get('featured') === '1';
  const extraNew = !bandNewArrival && searchParams.get('newArrival') === '1';
  return (
    sizes.length > 0 ||
    colors.length > 0 ||
    prices.length > 0 ||
    (sort && sort !== 'newest') ||
    extraFeatured ||
    extraNew
  );
}