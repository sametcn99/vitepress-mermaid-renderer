---
sidebarDepth: 2
---

# Configuration

`createMermaidRenderer()` accepts Mermaid runtime options and returns the shared
renderer instance. Toolbar behavior is configured separately through
`setToolbar()`, including locale-aware text for multilingual VitePress sites.

## Core renderer options

```typescript
const mermaidRenderer = createMermaidRenderer({
  theme: isDark.value ? 'dark' : 'forest',
  startOnLoad: true,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  sequence: {
    diagramMarginX: 60,
    diagramMarginY: 20,
  },
  gantt: {
    axisFormatter: (value) =>
      value.toLocaleString('en-US', { timeZone: 'UTC' }),
  },
  securityLevel: 'loose',
});
```

| Option                   | Purpose                                                                                                                                               |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`                  | Toggles between Mermaid’s built-in palettes. VitePress’s `isDark` signal keeps the background consistent with the site theme.                         |
| `startOnLoad`            | Keep this `false` when using the renderer so Mermaid rendering stays controlled by the plugin lifecycle.                                              |
| `flowchart` / `sequence` | Mirrors the options in the official Mermaid config schema while maintaining type safety. Set margins, spacing, and label behavior per diagram family. |
| `gantt`                  | Customize date formatting or axis visibility when embedding project timelines.                                                                        |
| `securityLevel`          | Mermaid security mode passed through to `mermaid.initialize()`. Use the strictness level that matches your content policy.                            |

Calling `createMermaidRenderer()` again with a new Mermaid config merges the
config into the existing singleton and dispatches a runtime update to mounted
diagrams.

## Theme awareness and re-rendering

```typescript
watch(
  () => isDark.value,
  () => {
    initMermaid();
  },
);
```

When the site switches between light and dark, call the renderer again with the
new Mermaid theme. Mounted diagrams listen for the config update event and
re-render with the active palette.

## Locale-aware toolbar setup

```typescript
mermaidRenderer.setToolbar({
  i18n: {
    localeIndex: localeIndex.value,
    locales: {
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
    },
  },
});
```

The root English locale can rely on the built-in defaults. Turkish and Chinese
pages pass their VitePress `localeIndex` values so the toolbar resolves the
matching table.

## Export and accessibility defaults

- `downloadFormat` controls whether the download action exports `svg`, `png`, or
  `jpg`.
- `fullscreenMode` can be `browser` for the native Fullscreen API or `dialog`
  for an in-page overlay.
- `showLanguageLabel` controls whether VitePress’s original `mermaid` code-block
  label remains visible after enhancement.
- `resetView`, `copyCode`, and accessible button labels are important for
  keyboard and screen reader workflows.

By controlling configuration through a single renderer instance, you keep
Mermaid diagrams consistent across pages, breakpoints, themes, and languages.
For a detailed reference of all available toolbar options and types, see the
[Configuration Types](./types.md) page.
