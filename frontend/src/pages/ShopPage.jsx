import { useMemo } from 'react';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';

const TITLES = {
  men: 'Men',
  women: 'Women',
  'new-arrivals': 'New Arrivals',
};

export default function ShopPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (category === 'unisex') navigate('/shop/men', { replace: true });
  }, [category, navigate]);
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('q') || '';

  const queryKey = useMemo(() => ['products', 'shop', category, page, search], [category, page, search]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      if (category === 'new-arrivals') params.set('newArrival', '1');
      else if (category) params.set('category', category);
      return (await api.get(`/products?${params}`)).data;
    },
  });

  const title = TITLES[category] || 'All collections';

  return (
    <main className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">QELMORA / Shop</p>
      <h1 className="font-display mt-3 text-5xl font-light">{title}</h1>
      <p className="mt-4 max-w-lg text-sm text-stone-500">
        Every piece is sourced from our atelier partners. Inventory updates in real time.
      </p>
      {isLoading && <p className="mt-12 text-stone-500">Loading collection…</p>}
      {error && <p className="mt-12 text-stone-500">Unable to load products. Is the API running?</p>}
      <div className="mt-12">
        <ProductGrid items={data?.items} empty="Your edit is being prepared — check back after the admin publishes pieces." />
      </div>
      {data?.pages > 1 && (
        <p className="mt-8 text-center text-xs text-stone-600">
          Page {data.page} of {data.pages}
        </p>
      )}
    </main>
  );
}
