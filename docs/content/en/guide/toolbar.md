---
sidebarDepth: 2
---

# Toolbar Customization

The built-in toolbar gives you zoom, reset, fullscreen, download, and copy
controls around the pan-enabled diagram surface. It also lets you localize
button titles, accessible labels, and the copy-success status text.

## Desktop vs Mobile vs Fullscreen

```typescript
mermaidRenderer.setToolbar({
  showLanguageLabel: true,
  downloadFormat: 'svg',
  fullscreenMode: 'browser', // "browser" (default) | "dialog"
  desktop: {
    zoomIn: 'enabled',
    zoomOut: 'enabled',
    resetView: 'enabled',
    download: 'enabled',
    positions: { vertical: 'top', horizontal: 'right' },
  },
  mobile: {
    zoomIn: 'disabled',
    zoomOut: 'disabled',
    resetView: 'enabled',
    copyCode: 'enabled',
    positions: { vertical: 'bottom', horizontal: 'left' },
  },
  fullscreen: {
    zoomLevel: 'enabled',
    toggleFullscreen: 'enabled',
  },
});
```

- `fullscreenMode` controls the fullscreen experience:
  - `browser` uses the native browser Fullscreen API (default).
  - `dialog` opens the diagram in an in-page modal overlay.

- **Desktop** should surface all controls because mouse and keyboard navigation
  are available.
- **Mobile** hides zoom buttons but keeps reset/copy so thumbs stay clear of the
  diagram area.
- **Fullscreen** mode reinjects zoom level readouts and focus-friendly switches.

## Positioning the toolbar

Position anchors support `vertical: top|bottom` and `horizontal: left|right`.
This enables overlaying controls in corners that don’t obscure intricate
diagrams. Add `positions` to the desktop, mobile, or fullscreen configuration to
anchor the toolbar elegantly.

## Localizing tooltip text (i18n)

The toolbar buttons ship with English text by default. Pass the active
`localeIndex` from VitePress and a per-locale tooltip table through the `i18n`
option of `setToolbar`. Missing keys fall back to the global override and then
to the built-in English defaults.

```typescript
import { useData } from 'vitepress';

const { localeIndex } = useData();

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

watch(localeIndex, () => {
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
});
```

The resolution order for each localized toolbar text key is:

1. `i18n.locales[localeIndex].tooltips[key]`
2. `i18n.tooltips[key]` (global override)
3. The built-in English default

Empty strings are ignored at every layer so toolbar text can never be blanked
out by accident. Use `copyCodeCopied` to translate the short success message
shown after the copy button writes to the clipboard.

Every `setToolbar()` invocation dispatches a `vitepress-mermaid:toolbar-updated`
event. Mounted diagrams listen for that event and apply new toolbar text without
remounting the SVG.

## Accessibility considerations

- Keep `showLanguageLabel` enabled so screen readers announce `Mermaid diagram`
  before the SVG is focused.
- Maintain `resetView` on every breakpoint; it’s a reliable escape hatch when
  zoom/drag generate confusion.
- Avoid stacking too many buttons on mobile to prevent accidental taps, and use
  `positions` to steer controls away from diagram hotspots.

With the right toolbar configuration you balance discoverability,
responsiveness, and a premium documentation experience across all devices.

For a detailed reference of all available toolbar options and states, see the
[Configuration Types](./types.md) page.
