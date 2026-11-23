import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CategoryCollectionCards } from '../components/CategoryCollectionCards';
import { CollectionPlacementGrid } from '../components/CollectionPlacementGrid';
import { StaticPageContent } from '../components/StaticPageContent';
import { ContactForm } from '../components/ContactForm';
import { SiteSectionBand } from '../components/SiteSectionBand';

export function AboutPage() {
  return (
    <SiteSectionBand sectionKey="about_band">
      <StaticPageContent
        sectionKey="about"
        compactImage
        defaultEyebrow="About us"
        defaultHeadline="The QELMORA edit"
        defaultBody="Founded on the belief that luxury is restraint, QELMORA designs modular wardrobes for people who travel light and dress with intent. We partner with mills in Gujarat and Tamil Nadu, finish in small batches, and release only what we would wear ourselves."
      />
    </SiteSectionBand>
  );
}

export function ContactPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content', 'contact'],
    queryFn: async () => (await api.get('/content/contact')).data,
  });

  const bodyParagraphs = (data?.body || 'Mon–Sat, 10am–7pm IST\nBandra Kurla Complex, Mumbai, India')
    .split('\n')
    .filter(Boolean);

  const helpEmail = (data?.ctaLink || 'hello@qelmora.com').replace(/^mailto:/i, '');
  const metaLabels = ['Studio hours', 'Visit us'];

  if (isLoading) {
    return (
      <SiteSectionBand sectionKey="contact_band">
        <main className="site-container py-20">
          <p className="text-stone-500">Loading…</p>
        </main>
      </SiteSectionBand>
    );
  }

  return (
    <SiteSectionBand sectionKey="contact_band">
      <main className="site-container py-14 md:py-20">
      <div className="contact-page mx-auto max-w-5xl">
        <header className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">{data?.eyebrow || 'Contact'}</p>
          <h1 className="font-display mt-4 text-4xl font-light tracking-tight md:text-5xl">
            {data?.headline || 'Client care'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
            Questions on fit, delivery, or your order — we&apos;re here Mon–Sat.
          </p>

          <ul className="mt-10 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {bodyParagraphs.map((p, i) => (
              <li key={p.slice(0, 32)}>
                <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500">{metaLabels[i] || 'Details'}</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">{p}</p>
              </li>
            ))}
            <li>
              <p className="text-[10px] uppercase tracking-[0.32em] text-stone-500">Direct line</p>
              <a
                href={`mailto:${helpEmail}`}
                className="mt-2 inline-block text-sm text-q-accent underline-offset-4 hover:underline"
              >
                {helpEmail}
              </a>
            </li>
          </ul>
        </header>

        <div
          className={`mt-12 grid gap-8 md:items-start ${data?.imageUrl ? 'md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-10' : ''}`}
        >
          {data?.imageUrl && (
            <div className="mx-auto w-full max-w-[340px] shrink-0 overflow-hidden border border-white/10 bg-[#141210] md:mx-0 lg:max-w-[400px]">
              {data.mediaType === 'video' ? (
                <video src={data.imageUrl} className="aspect-[3/4] w-full object-cover" muted loop playsInline controls />
              ) : (
                <img src={data.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
              )}
            </div>
          )}
          <div className="contact-panel min-w-0 border border-white/10 p-6 md:p-8 lg:p-10">
            <ContactForm formIntro={data?.ctaLabel} helpEmail={helpEmail} hideEmailLink />
          </div>
        </div>
      </div>
      </main>
    </SiteSectionBand>
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
    <SiteSectionBand sectionKey="nowhere_else_band">
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
            imageFit="contain"
            className="mt-12 gap-6 md:gap-8"
            emptyMessage="Add tiles in Admin → Nowhere Else."
          />
        ) : (
          <CategoryCollectionCards items={data?.items} slugs={['men', 'women']} columns={2} className="mt-12" />
        )}
      </main>
    </SiteSectionBand>
  );
}
