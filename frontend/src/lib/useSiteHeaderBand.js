import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { hasCustomBandBackground, useBandBackgroundUrl } from './useBandBackground';

export function useSiteHeaderBand() {
  const { data: bandCfg } = useQuery({
    queryKey: ['content', 'site_header_band'],
    queryFn: async () => {
      try {
        return (await api.get('/content/site_header_band')).data;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const bgUrl = useBandBackgroundUrl(bandCfg, '', '');
  const hasCustomBg = hasCustomBandBackground(bandCfg);

  return { bandCfg, bgUrl, hasCustomBg };
}