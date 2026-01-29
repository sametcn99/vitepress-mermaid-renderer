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
    ["meta", { name: "og:site_name", content: "VitePress Mermaid Renderer" }],
    ["meta", { name: "og:image", content: "/vitepress-logo.png" }],
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
    ["meta", { name: "twitter:image", content: "/vitepress-logo.png" }],
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
        content:
          "plugin, mermaid, diagrams, markdown, vitepress, mermaid-js, documentation, mermaid-diagrams, mermaid-renderer, vitepress-plugin, vitepress-mermaid, vitepress-diagrams, vitepress-plugin-mermaid, vitepress-mermaid-renderer, vitepress-plugin-mermaid-renderer",
      },
    ],
    ["meta", { name: "author", content: "sametcn99" }],
    ["link", { rel: "icon", type: "image/png", href: "/vitepress-logo.png" }],
    [
      "script",
      {
        defer: "",
        src: "https://umami.sametcc.me/script.js",
        "data-website-id": "19cf72d9-ab3b-4ea1-84f5-1a787217ea7e",
      },
    ],
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
      {
        text: "Guide",
        items: [
          { text: "Overview", link: "/guide/getting-started" },
          { text: "Installation & Setup", link: "/guide/installation" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Toolbar Customization", link: "/guide/toolbar" },
          { text: "Configuration Types", link: "/guide/types" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
        ],
      },
      { text: "Examples", link: "/examples/basic" },
      {
        text: "Resources",
        items: [
          {
            text: "Mermaid Documentation",
            link: "https://mermaid.js.org/intro/",
          },
        ],
      },
    ],

    // Sidebar
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Overview", link: "/guide/getting-started" },
          { text: "Installation & Setup", link: "/guide/installation" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Toolbar Customization", link: "/guide/toolbar" },
          { text: "Configuration Types", link: "/guide/types" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
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
