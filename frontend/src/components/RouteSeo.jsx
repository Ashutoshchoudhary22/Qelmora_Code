import { useLocation } from 'react-router-dom';
import { getSeoForPath } from '../lib/seo';
import { SeoHead } from './SeoHead';

export function RouteSeo() {
  const { pathname } = useLocation();
  const config = getSeoForPath(pathname);

  if (config?.skipRouteSeo) return null;

  return (
    <SeoHead
      title={config.title}
      description={config.description}
      path={config.path ?? pathname}
      noindex={config.noindex}
      jsonLd={config.jsonLd}
    />
  );
}