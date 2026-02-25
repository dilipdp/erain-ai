import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://erainai.com',
  trailingSlash: 'never',
  devToolbar: {
    enabled: false,
  },

  // Cloudflare Pages (Astro v5+: use `output: 'static'`; individual routes can opt out via `export const prerender = false`)
  output: 'static',
  adapter: cloudflare(),

  integrations: [
    sitemap({
      filter: (page) => {
        try {
          const pathname = new URL(page).pathname;
          return pathname !== '/admin' && !pathname.startsWith('/admin/');
        } catch {
          return !page.includes('/admin');
        }
      },
    }),
  ],

  build: {
    format: 'directory',
  },
});
