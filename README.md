# VitePress Mermaid Renderer 🎨

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://vitepress-mermaid-renderer.sametcc.me)
![NPM Downloads](https://img.shields.io/npm/dw/vitepress-mermaid-renderer)

Transform your static Mermaid diagrams into interactive, dynamic visualizations in VitePress! This powerful plugin brings life to your documentation by enabling interactive features like zooming, panning, and fullscreen viewing.

Stay up to date with new releases in the [CHANGELOG](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/CHANGELOG.md).

## ✨ Key Features

- 🔍 Smooth Zoom In/Out capabilities
- 🔄 Intuitive Diagram Navigation with panning
- 📋 One-Click Diagram Code Copy
- 📏 Quick View Reset
- 🖥️ Immersive Fullscreen Mode
- 🎨 Seamless VitePress Theme Integration
- ⚡ Lightning-fast Performance
- 🛠️ Easy Configuration

## 🚀 Quick Start

### Installation

Choose your preferred package manager:

```bash
# Using bun
bun add vitepress-mermaid-renderer

# Using npm
npm install vitepress-mermaid-renderer

# Using yarn
yarn add vitepress-mermaid-renderer

# Using pnpm
pnpm add vitepress-mermaid-renderer
```

### VitePress Configuration

Your `.vitepress/theme/index.ts` file should look like this:

```typescript
import { h, nextTick, watchEffect, watch } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? "dark" : "forest",
      });
    };

    // initial mermaid setup
    nextTick(() => initMermaid());

    // on theme change, re-render mermaid charts
    watch(
      () => isDark.value,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
```

## ⚙️ Configuration

You can customize the Mermaid renderer by passing configuration options to `createMermaidRenderer()`:

```ts
const mermaidRenderer = createMermaidRenderer({
  theme: "dark",
  startOnLoad: false,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
  },
});
```

Use `setToolbar()` whenever you need to enable or disable specific controls for desktop, mobile, or fullscreen toolbars.

The optional toolbar configuration accepts `desktop`, `mobile`, and `fullscreen` objects. Each button can be set to `"enabled"` or `"disabled"`. Desktop and mobile controls default to `"enabled"`, while fullscreen controls default to `"disabled"` so you can opt in explicitly. You can also define a `positions` object inside each mode to anchor the toolbar to any corner without using a separate block, and `zoomLevel` to keep the zoom percentage visible even if the zoom buttons are disabled:

```ts
mermaidRenderer.setToolbar({
  showLanguageLabel: true,
  desktop: {
    zoomIn: "disabled",
    zoomLevel: "enabled",
    positions: { vertical: "top", horizontal: "left" },
  },
  mobile: {
    zoomLevel: "disabled",
    positions: { vertical: "bottom", horizontal: "left" },
  },
  fullscreen: {
    zoomLevel: "enabled",
    positions: { vertical: "top", horizontal: "right" },
  },
});
```

If you omit `positions`, every mode defaults to the bottom-right corner. `zoomLevel` defaults to `"enabled"` across all modes.

Need to hide the little `mermaid` label that VitePress renders in the top-right corner of the original code block? Set `showLanguageLabel: false` in `setToolbar()` (or the `<MermaidDiagram toolbar>` prop) and the renderer will strip it out when it swaps the code fence with the interactive diagram.

### Toolbar option reference

| Key                                 | Type                   | Default                  | Description                                                                                                                               |
| ----------------------------------- | ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `showLanguageLabel`                 | `boolean`              | `true`                   | Toggles the original VitePress `mermaid` badge that normally appears on fenced code blocks.                                               |
| `desktop` / `mobile` / `fullscreen` | `ToolbarModeOverrides` | `DEFAULT_TOOLBAR_CONFIG` | Mode-specific overrides for buttons, zoom text, and toolbar placement. Each mode is optional—omit it to inherit the defaults shown below. |

| Mode field             | Modes                       | Type                      | Default (desktop / mobile / fullscreen) | Notes                                                                                |
| ---------------------- | --------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `zoomIn`               | Desktop, Mobile, Fullscreen | `"enabled" \| "disabled"` | `enabled / disabled / disabled`         | Mobile defaults to disabled but can be enabled when you need on-the-go zooming.      |
| `zoomOut`              | Desktop, Mobile, Fullscreen | `"enabled" \| "disabled"` | `enabled / disabled / disabled`         | Mobile defaults to disabled but can be enabled when you need on-the-go zooming.      |
| `resetView`            | Desktop, Mobile, Fullscreen | `"enabled" \| "disabled"` | `enabled / enabled / disabled`          | Resets zoom + pan to the initial state.                                              |
| `copyCode`             | Desktop, Mobile, Fullscreen | `"enabled" \| "disabled"` | `enabled / enabled / disabled`          | Copies the raw Mermaid source to the clipboard.                                      |
| `toggleFullscreen`     | Desktop, Mobile, Fullscreen | `"enabled" \| "disabled"` | `enabled / enabled / enabled`           | Expands the diagram container to fullscreen.                                         |
| `zoomLevel`            | Desktop, Mobile, Fullscreen | `"enabled" \| "disabled"` | `enabled / enabled / enabled`           | Controls the visibility of the percentage indicator even if zoom buttons are hidden. |
| `positions.vertical`   | Desktop, Mobile, Fullscreen | `"top" \| "bottom"`       | `bottom / bottom / bottom`              | Anchors the toolbar to the top or bottom edge inside the diagram container.          |
| `positions.horizontal` | Desktop, Mobile, Fullscreen | `"left" \| "right"`       | `right / right / right`                 | Anchors the toolbar to the left or right edge inside the diagram container.          |

For a complete list of available configuration options, refer to the [Mermaid Configuration Documentation](https://mermaid.js.org/config/schema-docs/config.html).

## 🔧 How It Works

Your Mermaid diagrams spring to life automatically! The plugin detects Mermaid code blocks (marked with `mermaid` language) and transforms them into interactive diagrams with a powerful toolset:

- 🔍 Dynamic zoom controls
- 🖱️ Smooth pan navigation
- 🎯 One-click view reset
- 📺 Immersive fullscreen experience
- 📝 Easy code copying

## 🤝 Contributing

We welcome contributions! Whether it's submitting pull requests, reporting issues, or suggesting improvements, your input helps make this plugin better for everyone.

## 🧪 Local Development

Want to test the package locally? Here are two methods:

### Automated test.ts script

Run the `test.ts` helper to walk through the full local-preview flow in one step. The script (powered by Bun) cleans previous build artifacts, rebuilds the package, creates a `.tgz` archive, installs that archive into `test-project`, and finally launches the VitePress docs dev server.

```bash
bun test.ts
```

> Press `Ctrl+C` to stop the dev server when you are finished. The script requires Bun to execute, but will fall back to npm for package management if Bun is not installed globally.

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
- [Documentation](https://vitepress-mermaid-renderer.sametcc.me)
