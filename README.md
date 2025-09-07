# VitePress Mermaid Renderer 🎨

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://vitepress-mermaid-renderer.vercel.app/)

Transform your static Mermaid diagrams into interactive, dynamic visualizations in VitePress! This powerful plugin brings life to your documentation by enabling interactive features like zooming, panning, and fullscreen viewing.

## ✨ Key Features

- 🔍 Smooth Zoom In/Out capabilities
- 🔄 Intuitive Diagram Navigation with panning
- 📋 One-Click Diagram Code Copy
- 📏 Quick View Reset
- 🖥️ Immersive Fullscreen Mode
- 🎨 Seamless VitePress Theme Integration
- ⚡ Lightning-fast Performance
- 🛠️ Easy Configuration
- 🌐 Client-Side Only Rendering (SSR safe)

## 🚀 Quick Start

### Installation

Choose your preferred package manager:

```bash
# Using npm
npm install vitepress-mermaid-renderer

# Using yarn
yarn add vitepress-mermaid-renderer

# Using pnpm
pnpm add vitepress-mermaid-renderer

# Using bun
bun add vitepress-mermaid-renderer
```

### VitePress Configuration

Your `.vitepress/theme/index.ts` file should look like this:

```typescript
// https://vitepress.dev/guide/custom-theme
import { h, nextTick } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";
import "vitepress-mermaid-renderer/dist/style.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {});
  },
  enhanceApp({ app, router, siteData }) {
    // Use the client-safe wrapper for SSR compatibility
    // Optional: Pass custom Mermaid configuration
    const mermaidRenderer = createMermaidRenderer({
      // Example configuration options
      // theme: 'dark',
      // startOnLoad: false,
      // flowchart: { useMaxWidth: true }
    });
    mermaidRenderer.initialize();

    if (router) {
      router.onAfterRouteChange = () => {
        nextTick(() => mermaidRenderer.renderMermaidDiagrams());
      };
    }
  },
} satisfies Theme;
```

## ⚙️ Configuration

You can customize the Mermaid renderer by passing configuration options to `createMermaidRenderer()`:

```typescript
const mermaidRenderer = createMermaidRenderer({
  theme: "dark", // 'default', 'dark', 'forest', 'neutral'
  startOnLoad: false,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
  },
  // Any other Mermaid configuration options
});
```

For a complete list of available configuration options, refer to the [Mermaid Configuration Documentation](https://mermaid.js.org/config/schema-docs/config.html).

## 🔧 How It Works

Your Mermaid diagrams spring to life automatically! The plugin detects Mermaid code blocks (marked with `mermaid` language) and transforms them into interactive diagrams with a powerful toolset:

- 🔍 Dynamic zoom controls
- 🖱️ Smooth pan navigation
- 🎯 One-click view reset
- 📺 Immersive fullscreen experience
- 📝 Easy code copying

## 📝 Client-Side Only Rendering

This plugin is designed to work only on the client side, making it fully compatible with server-side rendering (SSR). All rendering operations are protected by environment checks to ensure they only execute in the browser.

To ensure SSR compatibility:

- Use `createMermaidRenderer(config?)` rather than `MermaidRenderer.getInstance()`
- Import styles from the distributed CSS file
- Make sure browser environment checks are in place

The `createMermaidRenderer` function accepts an optional configuration object that will be passed to Mermaid.js for customizing diagram appearance and behavior.

## 🤝 Contributing

We welcome contributions! Whether it's submitting pull requests, reporting issues, or suggesting improvements, your input helps make this plugin better for everyone.

## 🧪 Local Development

Want to test the package locally? Here are two methods:

### Method 1: npm link

```bash
# In the package directory
npm run build
npm link

# In your test project
npm link vitepress-mermaid-renderer
```

### Method 2: npm pack

```bash
# In the package directory
npm run build
npm pack

# In your test project
npm install /path/to/vitepress-mermaid-renderer-1.0.0.tgz
```

## 📦 Links

- [NPM Package](https://www.npmjs.com/package/vitepress-mermaid-renderer)
- [GitHub Repository](https://github.com/sametcn99/vitepress-mermaid-renderer)
- [Documentation](https://vitepress-mermaid-renderer.vercel.app)
