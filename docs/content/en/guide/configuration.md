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
  startOnLoad: false,
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
  securityLevel: 'strict',
});
```

| Option                   | Purpose                                                                                                                                                                                                                                                                         |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `theme`                  | Toggles between Mermaid’s built-in palettes. VitePress’s `isDark` signal keeps the background consistent with the site theme.                                                                                                                                                   |
| `startOnLoad`            | Keep this `false` when using the renderer so Mermaid rendering stays controlled by the plugin lifecycle.                                                                                                                                                                        |
| `flowchart` / `sequence` | Mirrors the options in the official Mermaid config schema while maintaining type safety. Set margins, spacing, and label behavior per diagram family.                                                                                                                           |
| `gantt`                  | Customize date formatting or axis visibility when embedding project timelines.                                                                                                                                                                                                  |
| `securityLevel`          | Mermaid security mode passed through to `mermaid.initialize()`. Use the strictness level that matches your content policy. **Changed:** the default is now `'strict'`, which disables inline HTML inside diagrams. Use `'loose'` only when you fully trust all diagram sources. |
| `static`                 | When `true`, renders a plain SVG without the toolbar, zoom, pan, fullscreen, download, or keyboard controls. Theme updates continue to re-render the SVG.                                                                                                                       |

Calling `createMermaidRenderer()` again with a new Mermaid config
**deep-merges** the config into the existing singleton (nested objects like
`flowchart` are merged rather than replaced) and dispatches a runtime update to
mounted diagrams.

## Static SVG mode

Enable `static` to render the Mermaid SVG directly in VitePress without any
interactive plugin functionality. The normal responsive SVG sizing and Mermaid
theme updates remain active.

```typescript
createMermaidRenderer({
  static: true,
  theme: isDark.value ? 'dark' : 'default',
});
```

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
          renderErrorText: 'Diyagram render edilemedi',
          toggleErrorDetailsText: 'Detayları göster',
          toggleErrorDetailsHideText: 'Detayları gizle',
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
          renderErrorText: '图表渲染失败',
          toggleErrorDetailsText: '显示详情',
          toggleErrorDetailsHideText: '隐藏详情',
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
- `showLanguageLabel` controls whether VitePress's original `mermaid` code-block
  label remains visible after enhancement.
- `resetView`, `copyCode`, and accessible button labels are important for
  keyboard and screen reader workflows.

## Security

By default, `securityLevel` is set to `'strict'`, which **disables inline HTML**
inside Mermaid diagrams. This is the safest default because Mermaid diagrams are
often sourced from user-written Markdown files, and inline HTML in that context
can introduce XSS vulnerabilities.

If you need advanced Mermaid features that require inline HTML (for example,
clickable links or formatted labels inside flowchart nodes), you can explicitly
opt into the `loose` security level — but **only** when you fully trust all
diagram sources:

```typescript
// ⚠️ Only use 'loose' when you trust every Mermaid code block on the site.
const mermaidRenderer = createMermaidRenderer({
  securityLevel: 'loose',
});
```

SVG downloads are sanitized regardless of `securityLevel`: `<script>`,
`<iframe>`, `<object>`, `<embed>`, stylesheet `<link>` elements, and all `on*`
event-handler attributes are stripped before serialization.

## CSS custom properties (design tokens)

All visual constants in the renderer stylesheet are exposed as CSS custom
properties on `.mermaid-container`. Override them to customise the look without
editing the source stylesheet:

| Variable                          | Default                     | Purpose                      |
| :-------------------------------- | :-------------------------- | :--------------------------- |
| `--mermaid-control-bg`            | `var(--vp-c-bg)`            | Toolbar button background    |
| `--mermaid-control-text`          | `var(--vp-c-text-1)`        | Toolbar button text colour   |
| `--mermaid-control-border`        | `var(--vp-c-divider)`       | Toolbar button border        |
| `--mermaid-control-shadow`        | `0 2px 4px rgba(0,0,0,0.1)` | Toolbar button shadow        |
| `--mermaid-control-radius`        | `0.375rem`                  | Toolbar button border radius |
| `--mermaid-control-padding`       | `0.375rem`                  | Toolbar button padding       |
| `--mermaid-control-gap`           | `0.25rem`                   | Toolbar button gap           |
| `--mermaid-spinner-duration`      | `1s`                        | Loading spinner cycle time   |
| `--mermaid-notification-duration` | `2s`                        | "Copied" notification time   |
| `--mermaid-error-bg`              | `var(--vp-c-danger-soft)`   | Error container background   |
| `--mermaid-error-border`          | `var(--vp-c-danger-1)`      | Error container border       |
| `--mermaid-error-text`            | `var(--vp-c-danger-1)`      | Error container text         |

## Configurable zoom limits

Zoom boundaries are customisable through `MermaidNavigationOptions`:

```typescript
import { useMermaidNavigation } from 'vitepress-mermaid-renderer';

const { zoomIn, zoomOut, resetView } = useMermaidNavigation({
  minScale: 0.1, // default 0.2
  maxScale: 20, // default 10
  zoomStep: 1.5, // default 1.2
});
```

This is useful for accessibility or diagram-specific customisaton where the
default zoom range is too narrow or too wide.

## Reduced motion

The renderer respects the user's `prefers-reduced-motion` OS setting. When
enabled, all animations and transitions inside `.mermaid-container` are disabled
automatically — no configuration required.

By controlling configuration through a single renderer instance, you keep
Mermaid diagrams consistent across pages, breakpoints, themes, and languages.
For a detailed reference of all available toolbar options and types, see the
[Configuration Types](./types.md) page.
