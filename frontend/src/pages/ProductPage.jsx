import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { useAuth } from '../context/AuthContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { formatInr } from '../lib/money';

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

  const { data: teeProducts } = useQuery({
    queryKey: ['products', 'tees', categorySlug, slug],
    enabled: Boolean(categorySlug && product),
    queryFn: async () => {
      const res = await api.get(`/products?category=${categorySlug}&search=shirt&limit=12`);
      const items = (res.data?.items || []).filter((p) => p.slug !== slug);
      return { items: items.slice(0, 8) };
    },
  });

  const sizes = useMemo(() => [...new Set(product?.variants?.map((v) => v.size) || [])], [product]);
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

  return (
    <main className="site-container py-12 md:py-16">
      <Link to="/" className="text-[10px] uppercase tracking-widest text-stone-500">
        ← Home
      </Link>
      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="aspect-[3/4] overflow-hidden bg-[#161412]">
            {active?.resourceType === 'video' ? (
              <video src={active.secureUrl} controls className="h-full w-full object-cover" />
            ) : active?.secureUrl ? (
              <img src={active.secureUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-600">No media</div>
            )}
          </div>
          {media.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMedia(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden border ${i === activeMedia ? 'border-q-accent' : 'border-white/10'}`}
                >
                  <img src={m.secureUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">{product.category || 'QELMORA'}</p>
          <h1 className="font-display mt-3 text-4xl font-light md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xl text-stone-100">{formatInr(price)}</span>
            {compare && Number(compare) > Number(price) && (
              <span className="text-stone-600 line-through">{formatInr(compare)}</span>
            )}
          </div>

          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setColor('');
                  }}
                  className={`min-w-11 border px-3 py-2 text-xs ${size === s ? 'border-q-accent text-q-accent' : 'border-white/15 text-stone-400'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Color</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`border px-3 py-2 text-xs ${color === c ? 'border-q-accent text-q-accent' : 'border-white/15 text-stone-400'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Quantity</p>
            <div className="mt-3 inline-flex border border-white/15">
              <button type="button" className="px-4 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="min-w-10 px-4 py-2 text-center">{qty}</span>
              <button type="button" className="px-4 py-2" onClick={() => setQty((q) => Math.min(10, q + 1))}>
                +
              </button>
            </div>
            {variant && (
              <p className="mt-2 text-xs text-stone-500">{variant.stock} in stock · SKU {variant.sku}</p>
            )}
          </div>

          {!isAuthenticated && !booting && (
            <p className="mt-8 text-sm text-stone-500">Sign in to add items to your bag.</p>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={booting || !variant || addMutation.isPending}
              className="btn-primary flex-1 disabled:opacity-40"
              onClick={() => addMutation.mutate({ buyNow: false })}
            >
              {booting ? 'Loading…' : 'Add to cart'}
            </button>
            <button
              type="button"
              disabled={booting || !variant || addMutation.isPending}
              className="btn-primary btn-accent flex-1 disabled:opacity-40"
              onClick={() => addMutation.mutate({ buyNow: true })}
            >
              Buy now
            </button>
          </div>
          {msg && <p className="mt-4 text-sm text-stone-400">{msg}</p>}

          <div className="mt-12 border-t border-white/10 pt-8 text-sm leading-8 text-stone-400">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Details</p>
            <p className="mt-3 whitespace-pre-wrap">{product.description || 'No description yet.'}</p>
          </div>

          <details className="mt-6 text-sm text-stone-400">
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-stone-500">Size guide</summary>
            <p className="mt-3 leading-7">
              Our fits run true to size with a relaxed drape. Between sizes? Size down for structure, up for ease.
            </p>
          </details>
        </div>
      </div>

      <section className="mt-24 border-t border-white/10 pt-16">
        <p className="text-[10px] uppercase tracking-[0.35em] text-q-accent">Curated for you</p>
        <h2 className="font-display mt-2 text-3xl font-light">You may like</h2>
        <div className="mt-8">
          {loadingMore && !youMayLikeItems.length ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : (
            <ProductGrid
              items={youMayLikeItems}
              empty="Publish more active products in admin to fill this row."
            />
          )}
        </div>
      </section>

      {teeProducts?.items?.length > 0 && (
        <section className="mt-20 border-t border-white/10 pt-16">
          <p className="text-[10px] uppercase tracking-[0.35em] text-stone-500">Shop the edit</p>
          <h2 className="font-display mt-2 text-3xl font-light">T-shirts</h2>
          <div className="mt-8">
            <ProductGrid items={teeProducts.items} />
          </div>
          {categorySlug && (
            <Link
              to={`/shop/${categorySlug}?q=shirt`}
              className="mt-8 inline-block text-[10px] uppercase tracking-widest text-stone-500 hover:text-q-accent"
            >
              View all T-shirts →
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
