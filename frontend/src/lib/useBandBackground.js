import { useTheme } from '../context/ThemeContext';

/** Light/dark background from site_sections band config (dark falls back to light, then default). */
export function useBandBackgroundUrl(bandCfg, defaultLight, defaultDark = defaultLight) {
  const { isDark } = useTheme();
  if (isDark) {
    if (bandCfg?.darkImageUrl) return bandCfg.darkImageUrl;
    if (bandCfg?.imageUrl) return bandCfg.imageUrl;
    return defaultDark || defaultLight;
  }
  return bandCfg?.imageUrl || defaultLight;
}

export function hasCustomBandBackground(bandCfg) {
  return Boolean(bandCfg?.imageUrl || bandCfg?.darkImageUrl);
}