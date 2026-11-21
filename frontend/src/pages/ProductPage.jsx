import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Expand,
  Flame,
  Heart,
  Maximize2,
  RotateCcw,
  Ruler,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { colorSwatchHex } from '../lib/colorSwatch';
import { discountPercent, formatInr } from '../lib/money';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function sortSizes(list) {
  return [...list].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function displayRating(productId) {
  const id = Number(productId) || 1;
  return (4 + (id % 8) * 0.1).toFixed(1);
}

function displayReviewCount(productId) {
  const id = Number(productId) || 1;
  return 40 + ((id * 17) % 120);
}

function showFitBadge(name) {
  const n = String(name || '').toLowerCase();
  return /hoodie|t-shirt|tee|oversized/.test(n);
}

const TAB_COPY = {
  details: null,
  size: 'Our fits run true to size with a relaxed drape. Between sizes? Size down for structure, up for ease. Chest and length measurements follow industry standard grading.',
  fabric:
    'Premium combed cotton blend with a soft hand-feel. Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.',
  reviews:
    'Customers love the fit and fabric quality. Verified buyers mention consistent sizing and comfortable everyday wear. More reviews coming soon.',
};

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { booting, isAuthenticated } = useAuth();
  const { openCart } = useCartDrawer();
  const qc = useQueryClient();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [wishlisted, setWishlisted] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data,
  });

  const categorySlug = product?.categorySlug;

  const { data: moreInCategory, isLoading: loadingMore } = useQuery({
    queryKey: ['products', 'you-may-like', categorySlug, slug],
    enabled: Boolean(product && slug),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '12' });
      if (categorySlug) params.set('category', categorySlug);
      const res = await api.get(`/products?${params}`);
      const items = (res.data?.items || []).filter((p) => p.slug !== slug);
      return { items: items.slice(0, 8) };
    },
  });

  const youMayLikeItems = useMemo(() => {
    if (product?.related?.length) return product.related;
    return moreInCategory?.items || [];
  }, [product?.related, moreInCategory?.items]);

  const sizes = useMemo(
    () => sortSizes([...new Set(product?.variants?.map((v) => v.size) || [])]),
    [product]
  );
  const colors = useMemo(() => {
    const list = product?.variants?.filter((v) => !size || v.size === size) || [];
    return [...new Set(list.map((v) => v.color))];
  }, [product, size]);

  const variant = useMemo(() => {
    return product?.variants?.find((v) => v.size === size && v.color === color);
  }, [product, size, color]);

  useEffect(() => {
    if (!product?.variants?.length) return;
    setSize((s) => s || product.variants[0].size);
  }, [product]);

  useEffect(() => {
    if (!product?.variants?.length || !size) return;
    const forSize = product.variants.filter((v) => v.size === size);
    if (!forSize.length) return;
    setColor((c) => (c && forSize.some((v) => v.color === c) ? c : forSize[0].color));
  }, [product, size]);

  const addMutation = useMutation({
    mutationFn: async ({ buyNow }) => {
      if (booting) throw new Error('wait');
      if (!isAuthenticated) throw new Error('login');
      if (!variant?.id) throw new Error('variant');
      await api.post('/cart/items', { variantId: Number(variant.id), quantity: qty });
      if (buyNow) navigate('/checkout');
    },
    onSuccess: (_, { buyNow }) => {
      qc.invalidateQueries({ queryKey: ['cart-summary'] });
      qc.invalidateQueries({ queryKey: ['cart'] });
      if (buyNow) {
        setMsg('Proceeding to checkout…');
      } else {
        setMsg('');
        openCart();
      }
    },
    onError: (e) => {
      if (e.message === 'login' || e.response?.status === 401) {
        navigate('/login', { state: { from: `/product/${slug}` } });
        return;
      }
      if (e.message === 'variant') {
        setMsg('Choose a size and color.');
        return;
      }
      setMsg(e.response?.data?.message || 'Could not add to cart');
    },
  });

  if (isLoading) return <main className="p-20 text-stone-500">Loading…</main>;
  if (error || !product) return <main className="p-20 text-stone-500">Product not found.</main>;

  const media = product.media || [];
  const active = media[activeMedia];
  const price = variant?.priceOverride ?? product.price;
  const compare = product.compareAtPrice ?? product.compare_at_price;
  const off = discountPercent(price, compare);
  const rating = displayRating(product.id);
  const reviewCount = displayReviewCount(product.id);
  const tabKeys = [
    { id: 'details', label: 'Details' },
    { id: 'size', label: 'Size Guide' },
    { id: 'fabric', label: 'Fabric & Care' },
    { id: 'reviews', label: `Reviews (${reviewCount})` },
  ];

  const tabBody =
    activeTab === 'details'
      ? product.description || 'Elevated everyday essential from QELMORA.'
      : TAB_COPY[activeTab];

  return (
  <main className="product-detail-page site-container py-8 md:py-12">
      <Link to="/" className="product-detail-breadcrumb">
        ← Home
      </Link>

      <div className="product-detail-grid">
        <div>
          <div className="product-detail-hero">
            {showFitBadge(product.name) && (
              <span className="product-detail-badge-fit">
                <Maximize2 size={12} aria-hidden />
                Oversized fit
              </span>
            )}
            {active?.secureUrl && active.resourceType !== 'video' && (
              <button
                type="button"
                className="product-detail-expand"
                aria-label="View full size"
                onClick={() => setLightbox(true)}
              >
                <Expand size={18} />
              </button>
            )}
            {active?.resourceType === 'video' ? (
              <video src={active.secureUrl} controls className="h-full w-full object-cover" />
            ) : active?.secureUrl ? (
              <img src={active.secureUrl} alt={product.name} />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-500">No media</div>
            )}
          </div>
          {media.length > 1 && (
            <div className="product-detail-thumb-row scrollbar-hide">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMedia(i)}
                  className={`product-detail-thumb ${i === activeMedia ? 'product-detail-thumb--active' : ''}`}
                >
                  <img src={m.secureUrl} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="product-detail-eyebrow">{product.category || 'QELMORA'}</p>
          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-meta">
            <div className="product-detail-rating">
              <Star size={16} fill="var(--pd-star)" stroke="var(--pd-star)" />
              <strong>{rating}</strong>
              <span>({reviewCount} Reviews)</span>
            </div>
            {product.isFeatured && (
              <span className="product-detail-chip">
                <Flame size={14} aria-hidden />
                Bestseller
              </span>
            )}
            {product.isNewArrival && !product.isFeatured && (
              <span className="product-detail-chip">New arrival</span>
            )}
          </div>

          <div className="product-detail-price-row">
            <span className="product-detail-price">{formatInr(price)}</span>
            {compare && Number(compare) > Number(price) && (
              <span className="product-detail-compare">{formatInr(compare)}</span>
            )}
            {off != null && <span className="product-detail-off">{off}% OFF</span>}
          </div>

          <div className="product-detail-block">
            <div className="product-detail-label-row">
              <span>
                Size: <strong>{size || '—'}</strong>
              </span>
              <button
                type="button"
                className="product-detail-size-guide"
                onClick={() => setActiveTab('size')}
              >
                <Ruler size={14} aria-hidden />
                Size Guide
              </button>
            </div>
            <div className="product-detail-sizes">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setColor('');
                  }}
                  className={`product-detail-size-btn ${size === s ? 'product-detail-size-btn--active' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="product-detail-block">
            <p className="product-detail-label-row" style={{ marginBottom: '0.65rem' }}>
              Color: <strong>{color || '—'}</strong>
            </p>
            <div className="product-detail-swatches">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={`product-detail-swatch ${color === c ? 'product-detail-swatch--active' : ''}`}
                  style={{ backgroundColor: colorSwatchHex(c) }}
                />
              ))}
            </div>
          </div>

          <div className="product-detail-block">
            <div className="product-detail-qty-row">
              <div className="product-detail-qty">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(10, q + 1))}>
                  +
                </button>
              </div>
              {variant && (
                <div className="product-detail-stock">
                  <span className="inline-flex items-center gap-1">
                    <Check size={16} aria-hidden />
                    {variant.stock} in stock
                  </span>
                  <small>SKU: {variant.sku}</small>
                </div>
              )}
            </div>
          </div>

          {!isAuthenticated && !booting && (
            <p className="mt-4 text-sm text-[var(--pd-muted)]">Sign in to add items to your bag.</p>
          )}

          <div className="product-detail-actions">
            <button
              type="button"
              disabled={booting || !variant || addMutation.isPending}
              className="product-detail-btn-cart"
              onClick={() => addMutation.mutate({ buyNow: false })}
            >
              <ShoppingBag size={18} aria-hidden />
              {booting ? 'Loading…' : 'Add to cart'}
            </button>
            <button
              type="button"
              disabled={booting || !variant || addMutation.isPending}
              className="product-detail-btn-buy"
              onClick={() => addMutation.mutate({ buyNow: true })}
            >
              <Zap size={18} aria-hidden />
              Buy now
            </button>
            <button
              type="button"
              className={`product-detail-btn-wish ${wishlisted ? 'product-detail-btn-wish--on' : ''}`}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={() => setWishlisted((v) => !v)}
            >
              <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          {msg && <p className="mt-4 text-sm text-[var(--pd-muted)]">{msg}</p>}

          <div className="product-detail-trust">
            <div className="product-detail-trust-item">
              <Truck size={18} aria-hidden />
              Free Shipping
            </div>
            <div className="product-detail-trust-item">
              <RotateCcw size={18} aria-hidden />
              Easy Returns (7 days)
            </div>
            <div className="product-detail-trust-item">
              <Shield size={18} aria-hidden />
              Secure Payment
            </div>
          </div>

          <nav className="product-detail-tabs" aria-label="Product information">
            {tabKeys.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`product-detail-tab ${activeTab === id ? 'product-detail-tab--active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="product-detail-tab-panel whitespace-pre-wrap">{tabBody}</div>
        </div>
      </div>

      <section className="product-detail-you">
        <p className="product-detail-eyebrow">Curated for you</p>
        <h2 className="product-detail-title text-[clamp(1.75rem,3vw,2.25rem)]">You may like</h2>
        <div className="mt-8">
          {loadingMore && !youMayLikeItems.length ? (
            <p className="text-sm text-[var(--pd-muted)]">Loading…</p>
          ) : youMayLikeItems.length ? (
            <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 md:gap-6 snap-x snap-mandatory">
              {youMayLikeItems.map((p) => (
                <div
                  key={p.id || p.slug}
                  className="w-[calc((100%-3*1rem)/4)] min-w-[calc((100%-3*1rem)/4)] shrink-0 snap-start md:w-[calc((100%-3*1.5rem)/4)] md:min-w-[calc((100%-3*1.5rem)/4)]"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--pd-muted)]">Publish more active products in admin to fill this row.</p>
          )}
        </div>
      </section>

      {lightbox && active?.secureUrl && (
        <button
          type="button"
          className="product-detail-lightbox"
          aria-label="Close full size image"
          onClick={() => setLightbox(false)}
        >
          <img src={active.secureUrl} alt={product.name} />
        </button>
      )}
    </main>
  );
}