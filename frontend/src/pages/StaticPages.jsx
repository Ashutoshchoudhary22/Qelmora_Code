import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CategoryCollectionCards } from '../components/CategoryCollectionCards';

import { StaticPageContent } from '../components/StaticPageContent';

export function AboutPage() {
  return (
    <StaticPageContent
      sectionKey="about"
      defaultEyebrow="About us"
      defaultHeadline="The QELMORA edit"
      defaultBody="Founded on the belief that luxury is restraint, QELMORA designs modular wardrobes for people who travel light and dress with intent. We partner with mills in Gujarat and Tamil Nadu, finish in small batches, and release only what we would wear ourselves."
    />
  );
}

export function ContactPage() {
  return (
    <StaticPageContent
      sectionKey="contact"
      defaultEyebrow="Contact"
      defaultHeadline="Client care"
      defaultBody={'hello@qelmora.com · Mon–Sat, 10am–7pm IST\nBandra Kurla Complex, Mumbai, India'}
      maxWidth="max-w-4xl"
    />
  );
}

export function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <h1 className="font-display text-5xl font-light">Collections</h1>
      <p className="mt-4 max-w-lg text-sm text-stone-500">
        Seasonal capsules and permanent icons. Same category visuals as the homepage — managed in admin.
      </p>
      {isLoading ? (
        <p className="mt-12 text-stone-500">Loading collections…</p>
      ) : (
        <CategoryCollectionCards items={data?.items} slugs={['men', 'women', 'new-arrivals']} columns={3} className="mt-12" />
      )}
    </main>
  );
}
