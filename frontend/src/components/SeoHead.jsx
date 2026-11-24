import { useEffect } from 'react';
import {
  SEO_DEFAULTS,
  absoluteUrl,
  formatPageTitle,
  truncateMeta,
} from '../lib/seo';

function upsertMeta(attr, key, content) {
  if (content == null || content === '') return;
  const selector =
    attr === 'property' ? `meta[property="${key}"][data-seo-managed]` : `meta[name="${key}"][data-seo-managed]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"][data-seo-managed]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(jsonLd) {
  const id = 'seo-jsonld-graph';
  let el = document.getElementById(id);
  const list = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];

  if (!list.length) {
    el?.remove();
    return;
  }

  const graph = list.length === 1 ? list[0] : { '@context': 'https://schema.org', '@graph': list };

  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    el.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(graph);
}

/**
 * Client-side head tags for SPA routes (title, description, OG, Twitter, canonical, JSON-LD).
 */
export function SeoHead({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = formatPageTitle(title || SEO_DEFAULTS.defaultTitle);
  const desc = truncateMeta(description || SEO_DEFAULTS.defaultDescription, 160);
  const canonicalPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonical = absoluteUrl(canonicalPath);
  const ogImage = absoluteUrl(image || SEO_DEFAULTS.defaultOgImage);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:site', SEO_DEFAULTS.twitterHandle);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', ogImage);

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SEO_DEFAULTS.brand);
    upsertMeta('property', 'og:locale', 'en_IN');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', ogImage);

    upsertLink('canonical', canonical);
    upsertJsonLd(jsonLd);
  }, [fullTitle, desc, canonical, ogImage, robots, type, jsonLd]);

  return null;
}