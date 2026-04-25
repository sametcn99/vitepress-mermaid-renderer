---
sidebarDepth: 2
---

# Installation & Setup

This chapter installs `vitepress-mermaid-renderer`, links it to your
`.vitepress` theme, and confirms that Mermaid diagrams load with localized
toolbar controls.

## Choose your package manager

Use Bun for this repository. Other package managers are shown for projects that
do not use Bun.

::: code-group

```bash [bun]
bun add vitepress-mermaid-renderer
```

```bash [npm]
npm install vitepress-mermaid-renderer
```

```bash [yarn]
yarn add vitepress-mermaid-renderer
```

```bash [pnpm]
pnpm add vitepress-mermaid-renderer
```

:::

Mermaid and Vue are peer dependencies, so your VitePress project must also
provide compatible versions. The docs project uses Mermaid `^11.14.0`, Vue
through VitePress, and VitePress `^1.6.4`.

## Link the renderer inside your `.vitepress/theme`

Create or edit `.vitepress/theme/index.ts` and bootstrap the renderer in the
`Layout` component. The example below also wires the active VitePress locale
into the toolbar i18n API.

```typescript
import { h, nextTick, watch } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';

const toolbarLocales = {
  tr: {
    tooltips: {
      zoomIn: 'Yakınlaştır',
      zoomOut: 'Uzaklaştır',
      resetView: 'Görünümü sıfırla',
      copyCode: 'Kodu kopyala',
      copyCodeCopied: 'Kopyalandı',
      download: 'Diyagramı indir',
      toggleFullscreen: 'Tam ekranı aç/kapa',
    },
  },
  zh: {
    tooltips: {
      zoomIn: '放大',
      zoomOut: '缩小',
      resetView: '重置视图',
      copyCode: '复制代码',
      copyCodeCopied: '已复制',
      download: '下载图表',
      toggleFullscreen: '切换全屏',
    },
  },
};

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark, localeIndex } = useData();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
      });
      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        downloadFormat: 'svg',
        fullscreenMode: 'browser',
        desktop: {
          copyCode: 'enabled',
          toggleFullscreen: 'enabled',
          resetView: 'enabled',
          zoomOut: 'enabled',
          zoomIn: 'enabled',
          zoomLevel: 'enabled',
          download: 'enabled',
        },
        fullscreen: {
          copyCode: 'disabled',
          toggleFullscreen: 'enabled',
          resetView: 'disabled',
          zoomLevel: 'disabled',
          download: 'enabled',
        },
        i18n: {
          localeIndex: localeIndex.value,
          locales: toolbarLocales,
        },
      });
    };

    nextTick(() => initMermaid());

    watch(
      () => [isDark.value, localeIndex.value] as const,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
```

The renderer stays idle during server-side rendering. After VitePress hydrates
in the browser, it attaches to all Mermaid blocks and dispatches toolbar updates
when the active locale changes.

## Run a local preview

```bash
bun run docs:dev
```

On the preview server, any code fence marked as `mermaid` renders with the
configured toolbar. Visit `/`, `/tr/`, and `/zh/` to confirm that navigation,
sidebars, search labels, and toolbar text match the active language.

> If diagrams fail to render during `vitepress build`, remove `.vitepress/cache`
> and the build output before re-running so VitePress and Mermaid regenerate
> fresh assets.
