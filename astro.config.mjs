// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.escaninhodigital.com.br',
  trailingSlash: 'always',
  redirects: {
  "/acervo/historia/": "/acervo/materiais-de-apoio/",
  "/acervo/filosofia/": "/acervo/materiais-de-apoio/",
  "/acervo/atividades-adaptadas/": "/acervo/atividades-e-jogos/"
},
  integrations: [sitemap()],
});
