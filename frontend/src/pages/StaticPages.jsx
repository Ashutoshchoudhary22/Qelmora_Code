import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CategoryCollectionCards } from '../components/CategoryCollectionCards';
import { CollectionPlacementGrid } from '../components/CollectionPlacementGrid';
import { StaticPageContent } from '../components/StaticPageContent';
import { ContactForm } from '../components/ContactForm';

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
  const { data, isLoading } = useQuery({
    queryKey: ['content', 'contact'],
    queryFn: async () => (await api.get('/content/contact')).data,
  });

  if (isLoading) {
    return (
      <main className="site-container py-20">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  const bodyParagraphs = (data?.body || 'Mon–Sat, 10am–7pm IST\nBandra Kurla Complex, Mumbai, India')
    .split('\n')
    .filter(Boolean);

  return (
    <main className="site-container py-16 md:py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">{data?.eyebrow || 'Contact'}</p>
          <h1 className="font-display mt-4 text-4xl font-light md:text-5xl">{data?.headline || 'Client care'}</h1>
          <div className="mt-8 space-y-3 text-sm leading-8 text-stone-500">
            {bodyParagraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
          {data?.imageUrl && (
            <div className="mt-10 overflow-hidden border border-white/10 bg-[#141210]">
              {data.mediaType === 'video' ? (
                <video src={data.imageUrl} className="aspect-[4/5] w-full object-cover" muted loop playsInline controls />
              ) : (
                <img src={data.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
              )}
            </div>
          )}
        </div>
        <ContactForm formIntro={data?.ctaLabel} helpEmail={data?.ctaLink} />
      </div>
    </main>
  );
}

export function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const { data: nowhereTiles, isLoading: loadingTiles } = useQuery({
    queryKey: ['banners', 'page_nowhere_else'],
    queryFn: async () => (await api.get('/banners?placement=page_nowhere_else')).data,
  });
  const hasNowhereTiles = (nowhereTiles?.items || []).length > 0;

  return (
    <main className="site-container py-20">
      <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">Exclusive to QELMORA</p>
      <h1 className="font-display mt-4 text-5xl font-light">Nowhere else</h1>
      <p className="mt-4 max-w-xl text-sm leading-8 text-stone-500">
        Beyond this edit, you won&apos;t find these capsules anywhere else — limited runs, our mills, our cut. Same
        category visuals as the homepage, managed in admin.
      </p>
      {isLoading || loadingTiles ? (
        <p className="mt-12 text-stone-500">Loading…</p>
      ) : hasNowhereTiles ? (
        <CollectionPlacementGrid
          placement="page_nowhere_else"
          columns={2}
          className="mt-12"
          emptyMessage="Add tiles in Admin → Nowhere Else."
        />
      ) : (
        <CategoryCollectionCards items={data?.items} slugs={['men', 'women']} columns={2} className="mt-12" />
      )}
    </main>
  );
}
