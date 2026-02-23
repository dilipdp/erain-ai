import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://erainai.com',
  trailingSlash: 'never',
  devToolbar: {
    enabled: false,
  },

  // Admin pages use headers/auth → needs SSR
  output: 'server',

  adapter: node({
    mode: 'standalone',
  }),

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
