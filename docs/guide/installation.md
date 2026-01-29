---
sidebarDepth: 2
---

# Installation & Setup

This chapter walks through installing `vitepress-mermaid-renderer`, linking it to your `.vitepress` theme, and confirming that Mermaid diagrams load with toolbar controls.

## Choose your package manager

Select one of the common JavaScript toolchains and pin the renderer version to avoid surprises during CI builds.

```bash
bun add vitepress-mermaid-renderer
```

```bash
npm install vitepress-mermaid-renderer
```

```bash
yarn add vitepress-mermaid-renderer
```

```bash
pnpm add vitepress-mermaid-renderer
```

## Link the renderer inside your `.vitepress/theme`

Create or edit `.vitepress/theme/index.ts` and bootstrap the renderer in the `Layout` component.

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

This layout bootstrapping is the minimal required setup; the renderer stays idle until VitePress hydrates and then attaches to all Mermaid blocks.

## Run a local preview

```bash
npm run docs:dev
```

On the preview server, any Mermaid code block (```mermaid) will render with the default toolbar. Interact with zoom, pan, and copy in the browser console to confirm the event listeners fire.

> If diagrams fail to render during `vitepress build`, clean `.vitepress/cache` before re-running so Mermaid assets regenerate.
