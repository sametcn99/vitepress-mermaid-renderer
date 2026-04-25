import { defineConfig } from 'vitepress';
import {
  commonThemeConfig,
  locales,
  siteDescriptions,
  siteTitle,
} from './config/locales.mts';

/**
 * Keeps the English source files in content/en while preserving root URLs.
 *
 * @param id - VitePress page path relative to srcDir.
 * @returns The public route path VitePress should generate for the page.
 */
const rewriteContentPath = (id: string): string => {
  if (id.startsWith('en/')) {
    return id.slice('en/'.length);
  }

  return id;
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: siteTitle,
  description: siteDescriptions.root,
  base: '/',
  srcDir: 'content',

  // Site-wide settings
  lang: 'en-US',
  appearance: true,
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['README.md'],
  rewrites: rewriteContentPath,
  locales,

  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: siteTitle }],
    ['meta', { name: 'og:image', content: '/vitepress-logo.png' }],
    ['meta', { name: 'og:title', content: siteTitle }],
    [
      'meta',
      {
        name: 'og:description',
        content: siteDescriptions.root,
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: '/vitepress-logo.png' }],
    ['meta', { name: 'twitter:title', content: siteTitle }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: siteDescriptions.root,
      },
    ],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'plugin, mermaid, diagrams, markdown, vitepress, mermaid-js, documentation, mermaid-diagrams, mermaid-renderer, vitepress-plugin, vitepress-mermaid, vitepress-diagrams, vitepress-plugin-mermaid, vitepress-mermaid-renderer, vitepress-plugin-mermaid-renderer',
      },
    ],
    ['meta', { name: 'author', content: 'sametcn99' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/vitepress-logo.png' }],
    [
      'script',
      {
        defer: '',
        src: 'https://umami.sametcc.me/script.js',
        'data-website-id': '19cf72d9-ab3b-4ea1-84f5-1a787217ea7e',
      },
    ],
  ],

  themeConfig: commonThemeConfig,
});
