const BRAND = 'QELMORA';
const DEFAULT_TITLE = `${BRAND} — Elevated Essentials & Premium Streetwear`;
const DEFAULT_DESCRIPTION =
  'Discover QELMORA — luxury-minimal streetwear and elevated essentials. Small-batch hoodies, tees, and collections for men and women. Shop limited drops with fast India delivery.';
const DEFAULT_OG_IMAGE = '/promo/QELMORA Premium Essentials Banner.png';
const TWITTER_HANDLE = '@qelmora';

export function getSiteOrigin() {
  const fromEnv = import.meta.env.VITE_SITE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'https://qelmora.com';
}

export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = getSiteOrigin();
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${path}`;
}

export function formatPageTitle(title) {
  if (!title || !String(title).trim()) return DEFAULT_TITLE;
  const t = String(title).trim();
  if (t.toLowerCase().includes(BRAND.toLowerCase())) return t;
  return `${t} | ${BRAND}`;
}

export function stripHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateMeta(text, max = 160) {
  const plain = stripHtml(text);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}…`;
}

export function organizationJsonLd() {
  const origin = getSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: origin,
    logo: absoluteUrl('/favicon.svg'),
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };
}

export function webSiteJsonLd() {
  const origin = getSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/shop/men?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productJsonLd(product) {
  if (!product) return null;
  const origin = getSiteOrigin();
  const image =
    product.media?.[0]?.secureUrl ||
    product.image ||
    absoluteUrl(DEFAULT_OG_IMAGE);
  const price = Number(product.price);
  const inStock =
    !product.variants?.length || product.variants.some((v) => Number(v.stock) > 0);
  const description =
    truncateMeta(product.description, 500) ||
    `${product.name} — premium ${BRAND} streetwear. Limited stock.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: [absoluteUrl(image)],
    sku: product.variants?.[0]?.sku || product.slug,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      url: `${origin}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: Number.isFinite(price) ? price.toFixed(2) : undefined,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: BRAND },
    },
  };
}

export function breadcrumbJsonLd(items) {
  if (!items?.length) return null;
  const origin = getSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.path ? absoluteUrl(item.path) : undefined,
    })),
  };
}

export const SEO_DEFAULTS = {
  brand: BRAND,
  defaultTitle: DEFAULT_TITLE,
  defaultDescription: DEFAULT_DESCRIPTION,
  defaultOgImage: DEFAULT_OG_IMAGE,
  twitterHandle: TWITTER_HANDLE,
};

const NOINDEX_PREFIXES = [
  '/admin',
  '/account',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const SHOP_COPY = {
  men: {
    title: "Men's Collection",
    description:
      "Shop QELMORA men's streetwear — hoodies, tees, and elevated essentials. Limited batches, live inventory, fast delivery across India.",
  },
  women: {
    title: "Women's Collection",
    description:
      "Shop QELMORA women's edit — premium hoodies and minimalist streetwear. Small batches and real-time stock.",
  },
};

function shopBandCopy(category, band) {
  const base = SHOP_COPY[category] || {
    title: 'Shop',
    description: 'Browse QELMORA collections — premium streetwear and elevated essentials.',
  };
  if (!band) return base;
  const label = band.replace(/-/g, ' ');
  return {
    title: `${label.replace(/\b\w/g, (c) => c.toUpperCase())} — ${base.title}`,
    description: `${base.description} Explore ${label} in our ${category}'s shop.`,
  };
}

export function getSeoForPath(pathname) {
  if (NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return {
      title: BRAND,
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    };
  }

  if (pathname === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: '/',
      jsonLd: [organizationJsonLd(), webSiteJsonLd()],
    };
  }

  if (pathname === '/about') {
    return {
      title: 'About QELMORA',
      description:
        'QELMORA designs luxury-minimal wardrobes for people who travel light and dress with intent. Learn our story, craft, and small-batch philosophy.',
      path: '/about',
    };
  }

  if (pathname === '/contact') {
    return {
      title: 'Contact',
      description:
        'Reach the QELMORA studio — orders, sizing, and partnerships. Mon–Sat support with fast responses for customers across India.',
      path: '/contact',
    };
  }

  if (pathname === '/collections') {
    return {
      title: 'Collections',
      description:
        'Explore QELMORA collections — curated men’s and women’s drops, new arrivals, and category edits in one place.',
      path: '/collections',
    };
  }

  if (pathname.startsWith('/shop/')) {
    const parts = pathname.split('/').filter(Boolean);
    const category = parts[1];
    const band = parts[2];
    const copy = shopBandCopy(category, band);
    return {
      title: copy.title,
      description: copy.description,
      path: pathname,
    };
  }

  if (pathname.startsWith('/product/')) {
    return { skipRouteSeo: true };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: pathname,
  };
}