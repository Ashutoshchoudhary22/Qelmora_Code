export function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function discountPercent(price, compareAt) {
  const p = Number(price);
  const c = Number(compareAt);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}
