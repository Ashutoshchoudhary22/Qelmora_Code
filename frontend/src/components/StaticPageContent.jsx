import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function StaticPageContent({ sectionKey, defaultEyebrow, defaultHeadline, defaultBody }) {
  const { data, isLoading } = useQuery({
    queryKey: ['content', sectionKey],
    queryFn: async () => (await api.get(`/content/${sectionKey}`)).data,
  });

  if (isLoading) {
    return (
      <main className="site-container py-20">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  const bodyParagraphs = (data?.body || defaultBody || '').split('\n').filter(Boolean);

  return (
    <main className="site-container py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-q-accent">{data?.eyebrow || defaultEyebrow}</p>
          <h1 className="font-display mt-4 text-5xl font-light">{data?.headline || defaultHeadline}</h1>
          <div className="mt-8 space-y-4 text-sm leading-8 text-stone-400">
            {bodyParagraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
        {data?.imageUrl && (
          <div className="overflow-hidden border border-white/10 bg-[#141210]">
            {data.mediaType === 'video' ? (
              <video src={data.imageUrl} className="aspect-[4/5] w-full object-cover" muted loop playsInline controls />
            ) : (
              <img src={data.imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
