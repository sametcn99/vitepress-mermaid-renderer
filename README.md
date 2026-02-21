# VitePress Mermaid Renderer

Transform your static Mermaid diagrams into interactive, dynamic visualizations in VitePress. This powerful plugin brings life to your documentation by enabling interactive features like zooming, panning, and fullscreen viewing.

_Stay up to date with new releases in the [CHANGELOG](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/CHANGELOG.md)._

## Key Features

- **Smooth Zooming**: Capable of zooming in and out for better readability.
- **Intuitive Navigation**: Easy panning allows for exploring complex diagrams.
- **Code Copy**: Extract the Mermaid source code with a single click.
- **View Reset**: Instantly restore the diagram to its default view.
- **Fullscreen Mode**: View diagrams in a distraction-free fullscreen mode.
- **Theme Integration**: Automatically adapts to Light and Dark modes.
- **Download Options**: Export diagrams as SVG, PNG, or JPG.

## How It Works

Your Mermaid diagrams spring to life automatically. The plugin detects Mermaid code blocks (marked with `mermaid` language) and transforms them into interactive diagrams equipped with a powerful toolbar.

## Quick Start

### Installation

Install the package using your preferred package manager:

```bash
npm install vitepress-mermaid-renderer
```

### VitePress Configuration

Update your `.vitepress/theme/index.ts` file to initialize the renderer:

```typescript
import { h, nextTick, watch } from "vue";
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

## Configuration

Customize the Mermaid renderer by passing configuration options to `createMermaidRenderer()`.

```typescript
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

For a complete list of available configuration options, refer to the [Mermaid Configuration Documentation](https://mermaid.js.org/config/schema-docs/config.html).

### Toolbar Configuration

You can fully customize the toolbar for desktop, mobile, and fullscreen modes using `setToolbar()`.

```typescript
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

## Contributing

We welcome contributions! Whether it's submitting pull requests, reporting issues, or suggesting improvements, your input helps make this plugin better for everyone.

## Local Development

To test the package locally, you can use one of the following methods:

### Automated Test Script

Run the `test.ts` helper to walk through the full local-preview flow in one step. This script cleans artifacts, rebuilds, packs, installs, and launches the dev server.

```bash
bun test.ts
```

### Manual Linking

```bash
# In the package directory
npm run build
npm link

# In your test project
npm link vitepress-mermaid-renderer
```

### Manual Packing

```bash
# In the package directory
npm run build
npm pack

# In your test project
npm install /path/to/vitepress-mermaid-renderer-1.0.0.tgz
```

## Links

- [NPM Package](https://www.npmjs.com/package/vitepress-mermaid-renderer)
- [GitHub Repository](https://github.com/sametcn99/vitepress-mermaid-renderer)
- [Live Examples](https://vitepress-mermaid-renderer.vercel.app)

---

<div align="center">
  <strong>If you found this project helpful, please consider giving it a star on GitHub!</strong>
</div>
