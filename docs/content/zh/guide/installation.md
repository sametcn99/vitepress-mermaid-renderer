---
sidebarDepth: 2
---

# 安装与设置

本章会安装 `vitepress-mermaid-renderer`，将它接入 `.vitepress`
主题，并确认 Mermaid 图表可以使用本地化工具栏控件。

## 选择包管理器

此仓库使用 Bun。不使用 Bun 的项目也可以参考其他包管理器命令。

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

Mermaid 和 Vue 是 peer dependencies。当前 docs 项目使用 Mermaid
`^11.14.0`、由 VitePress 提供的 Vue，以及 VitePress `^1.6.4`。

## 在 `.vitepress/theme` 中接入 renderer

创建或编辑 `.vitepress/theme/index.ts`。下面的示例会把当前 VitePress
locale 接入工具栏 i18n API。

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

Renderer 在服务端渲染期间保持空操作。VitePress 在浏览器中完成 hydration 后，它会接管 Mermaid 代码块，并在当前 locale 改变时发送工具栏更新。

## 运行本地预览

```bash
bun run docs:dev
```

预览服务器中，所有标记为 `mermaid` 的代码块都会使用配置好的工具栏渲染。访问
`/`、`/tr/` 和 `/zh/`，确认导航、侧边栏、搜索标签和工具栏文本都匹配当前语言。

> 如果 `vitepress build` 时图表无法渲染，请删除 `.vitepress/cache`
> 和构建输出后重新运行。
