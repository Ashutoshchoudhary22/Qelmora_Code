import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function robotsTxtPlugin(siteUrl) {
  const origin = (siteUrl || 'http://localhost:5173').replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin/
Disallow: /account
Disallow: /account/
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password

Sitemap: ${origin}/sitemap.xml
`;

  return {
    name: 'qelmora-robots',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: body,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

  return {
    plugins: [react(), tailwindcss(), robotsTxtPlugin(env.VITE_SITE_URL)],
    server: {
      proxy: {
        '/sitemap.xml': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: () => '/api/v1/seo/sitemap.xml',
        },
      },
    },
  };
});