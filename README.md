# VitePress Mermaid Renderer

[![npm version](https://img.shields.io/npm/v/vitepress-mermaid-renderer)](https://npmx.dev/package/vitepress-mermaid-renderer)
[![npm monthly downloads](https://img.shields.io/npm/dm/vitepress-mermaid-renderer)](https://npmx.dev/package/vitepress-mermaid-renderer)
[![Release](https://github.com/sametcn99/vitepress-mermaid-renderer/actions/workflows/release.yml/badge.svg)](https://github.com/sametcn99/vitepress-mermaid-renderer/actions/workflows/release.yml)

Transform static Mermaid diagrams into interactive visualizations in VitePress.
Enable smooth zooming, panning, fullscreen dialogs, and dynamic theme
adaptations.

_Stay up to date with new releases in the
[CHANGELOG](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/CHANGELOG.md)._

## Key Features

- **Smooth Zooming:** Incrementally zoom in/out with reactive percentage
  readouts.
- **Intuitive Panning:** Drag to navigate and explore complex, multi-layered
  diagrams.
- **Single-Click Code Copy:** Extract raw Mermaid source code instantly.
- **Instant View Reset:** Restore zoom, pan, and transform coordinates to
  default in one click.
- **Flexible Fullscreen Modes:** Choose between native browser Fullscreen API or
  custom inline modal overlays.
- **Vibrant Adaptive Themes:** Smoothly matches Light/Dark mode transitions.
- **High-Quality Downloads:** Export and download diagrams as SVG, PNG, or JPG.
- **Complete Customization:** Selectively toggle toolbar buttons per display
  mode (desktop, mobile, fullscreen).
- **i18n Support:** Easily localize all tooltips and states dynamically using
  VitePress locale data.

---

## Quick Start

### 1. Installation

```bash
npm install vitepress-mermaid-renderer
```

### 2. Integration

Update your `.vitepress/theme/index.ts` file:

```typescript
import { h, nextTick, watch } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData();

    const initMermaid = () => {
      createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'default',
      });
    };

    nextTick(() => initMermaid());
    watch(
      () => isDark.value,
      () => initMermaid(),
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
```

That's it! Any fenced `mermaid` code blocks in your markdown will automatically
be rendered with interactive controls.

---

## Documentation & Examples

For full configuration guidelines, advanced security options, custom toolbar
settings, multilinguality (i18n) setups, and live sandbox demonstrations, please
visit official website:

**[vitepress-mermaid-renderer.vercel.app](https://vitepress-mermaid-renderer.vercel.app)**

---

## Contributing & Development

Please refer to
[CONTRIBUTING.md](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/CONTRIBUTING.md)
for more details.

---

_If you found this project helpful, please consider giving it a star on
[GitHub](https://github.com/sametcn99/vitepress-mermaid-renderer)!_
