// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://escaninhodigital.com.br',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
