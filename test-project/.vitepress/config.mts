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
    // Logo configuration
    siteTitle: "VitePress Mermaid Renderer",

    // Search configuration
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

    // Navigation
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

    // Sidebar
    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Getting Started", link: "/guide/getting-started" }],
      },
      {
        text: "Examples",
        items: [
          { text: "Basic Examples", link: "/examples/basic" },
          { text: "Advanced Examples", link: "/examples/advanced" },
        ],
      },
    ],

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

    // Footer configuration
    footer: {
      message: "Released under the GPL-3.0 License.",
      copyright: `Copyright © ${new Date().getFullYear()}`,
    },

    // Edit link configuration
    editLink: {
      pattern:
        "https://github.com/sametcn99/vitepress-mermaid-renderer/edit/main/test-project/:path",
      text: "Edit this page on GitHub",
    },

    // Documentation customization
    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },

    // Outbound links behavior
    externalLinkIcon: true,

    // Last updated text
    lastUpdatedText: "Last updated",
  },
});
