import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "VitePress Mermaid Renderer",
  description:
    "A VitePress plugin to render Mermaid diagrams with interactive controls",
  base: "/",

  // Site-wide settings
  lang: "en-US",
  appearance: true,
  lastUpdated: true,
  cleanUrls: true,

  // Multilingual setup used by the toolbar i18n smoke tests
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      themeConfig: {
        siteTitle: "VitePress Mermaid Renderer",
        search: {
          provider: "local",
          options: {
            detailedView: true,
            translations: {
              button: {
                buttonText: "Search docs",
                buttonAriaLabel: "Search documentation",
              },
            },
          },
        },
        nav: [
          { text: "Home", link: "/" },
          { text: "Guide", link: "/guide/getting-started" },
          { text: "Examples", link: "/examples/basic" },
          {
            text: "Resources",
            items: [
              {
                text: "Mermaid Documentation",
                link: "https://mermaid.js.org/intro/",
              },
              {
                text: "VitePress Guide",
                link: "https://vitepress.dev/guide/what-is-vitepress",
              },
            ],
          },
        ],
        sidebar: [
          {
            text: "Guide",
            items: [
              { text: "Getting Started", link: "/guide/getting-started" },
            ],
          },
          {
            text: "Examples",
            items: [
              { text: "Basic Examples", link: "/examples/basic" },
              { text: "Advanced Examples", link: "/examples/advanced" },
            ],
          },
        ],
        footer: {
          message: "Released under the GPL-3.0 License.",
          copyright: `Copyright © ${new Date().getFullYear()}`,
        },
        editLink: {
          pattern:
            "https://github.com/sametcn99/vitepress-mermaid-renderer/edit/main/test-project/:path",
          text: "Edit this page on GitHub",
        },
        docFooter: {
          prev: "Previous page",
          next: "Next page",
        },
        lastUpdatedText: "Last updated",
      },
    },
    tr: {
      label: "Türkçe",
      lang: "tr-TR",
      link: "/tr/",
      themeConfig: {
        siteTitle: "VitePress Mermaid Renderer",
        search: {
          provider: "local",
          options: {
            detailedView: true,
            translations: {
              button: {
                buttonText: "Dokümanlarda ara",
                buttonAriaLabel: "Dokümanlarda ara",
              },
            },
          },
        },
        nav: [
          { text: "Ana Sayfa", link: "/tr/" },
          { text: "Rehber", link: "/tr/guide/getting-started" },
          { text: "Örnekler", link: "/tr/examples/basic" },
          {
            text: "Kaynaklar",
            items: [
              {
                text: "Mermaid Dokümantasyonu",
                link: "https://mermaid.js.org/intro/",
              },
              {
                text: "VitePress Rehberi",
                link: "https://vitepress.dev/guide/what-is-vitepress",
              },
            ],
          },
        ],
        sidebar: [
          {
            text: "Rehber",
            items: [
              {
                text: "Hızlı Başlangıç",
                link: "/tr/guide/getting-started",
              },
            ],
          },
          {
            text: "Örnekler",
            items: [
              { text: "Temel Örnekler", link: "/tr/examples/basic" },
              { text: "Gelişmiş Örnekler", link: "/tr/examples/advanced" },
            ],
          },
        ],
        footer: {
          message: "GPL-3.0 lisansı altında yayınlanmıştır.",
          copyright: `Telif Hakkı © ${new Date().getFullYear()}`,
        },
        editLink: {
          pattern:
            "https://github.com/sametcn99/vitepress-mermaid-renderer/edit/main/test-project/:path",
          text: "Bu sayfayı GitHub üzerinde düzenle",
        },
        docFooter: {
          prev: "Önceki sayfa",
          next: "Sonraki sayfa",
        },
        lastUpdatedText: "Son güncelleme",
      },
    },
  },

  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:title", content: "VitePress Mermaid Renderer" }],
    [
      "meta",
      {
        name: "og:description",
        content:
          "A VitePress plugin to render Mermaid diagrams with interactive controls",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "VitePress Mermaid Renderer" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "A VitePress plugin to render Mermaid diagrams with interactive controls",
      },
    ],
    [
      "meta",
      {
        name: "keywords",
        content: "vitepress, mermaid, diagrams, documentation, markdown",
      },
    ],
    ["meta", { name: "author", content: "sametcn99" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  ],

  themeConfig: {
    // Social links
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/sametcn99/vitepress-mermaid-renderer",
      },
      {
        icon: "npm",
        link: "https://www.npmjs.com/package/vitepress-mermaid-renderer",
      },
    ],

    // Outbound links behavior
    externalLinkIcon: true,
  },
});
