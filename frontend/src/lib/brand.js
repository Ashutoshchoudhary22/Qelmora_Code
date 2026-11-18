export const BRAND_NAME = 'QELMORA';

/** Correct common misspelling from CMS / banners (e.g. QELOMORA → QELMORA). */
export function formatBrandTitle(value, { suffix = '' } = {}) {
  if (!value || !String(value).trim()) {
    return `${BRAND_NAME}${suffix}`;
  }
  return String(value)
    .trim()
    .replace(/\bQELOMORA\b/gi, BRAND_NAME)
    .replace(/\bQelmora\b/g, BRAND_NAME);
}