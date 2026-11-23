import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { hasCustomBandBackground, useBandBackgroundUrl } from '../lib/useBandBackground';

/** Full-width band background for static pages (site_sections key). */
export function SiteSectionBand({ sectionKey, children, className = '' }) {
  const { data: bandCfg } = useQuery({
    queryKey: ['content', sectionKey],
    queryFn: async () => {
      try {
        return (await api.get(`/content/${sectionKey}`)).data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(sectionKey),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const bgUrl = useBandBackgroundUrl(bandCfg, '', '');
  const hasCustomBg = hasCustomBandBackground(bandCfg);

  return (
    <div
      className={`shop-section-band relative w-full overflow-hidden${
        hasCustomBg ? ' shop-section-band--has-bg' : ''
      } ${className}`.trim()}
    >
      {hasCustomBg && bgUrl && (
        <>
          <div
            className="shop-section-band-bg"
            style={{ backgroundImage: `url(${bgUrl})` }}
            aria-hidden
          />
          <div className="shop-section-band-scrim" aria-hidden />
        </>
      )}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}