---
sidebarDepth: 2
---

# Toolbar Customization

The built-in toolbar gives you zoom, pan, reset, fullscreen, download, and copy controls. Tailor the toolkit for each breakpoint so your diagrams stay clean on mobile while remaining powerful on desktops.

## Desktop vs Mobile vs Fullscreen

```typescript
mermaidRenderer.setToolbar({
  showLanguageLabel: true,
  downloadFormat: "svg",
  fullscreenMode: "browser", // "browser" (default) | "dialog"
  desktop: {
    zoomIn: "enabled",
    zoomOut: "enabled",
    resetView: "enabled",
    download: "enabled",
    positions: { vertical: "top", horizontal: "right" },
  },
  mobile: {
    zoomIn: "disabled",
    zoomOut: "disabled",
    resetView: "enabled",
    copyCode: "enabled",
    positions: { vertical: "bottom", horizontal: "left" },
  },
  fullscreen: {
    zoomLevel: "enabled",
    toggleFullscreen: "enabled",
  },
});
```

- `fullscreenMode` controls the fullscreen experience:
  - `browser` uses the native browser Fullscreen API (default).
  - `dialog` opens the diagram in an in-page modal overlay.

- **Desktop** should surface all controls because mouse and keyboard navigation are available.
- **Mobile** hides zoom buttons but keeps reset/copy so thumbs stay clear of the diagram area.
- **Fullscreen** mode reinjects zoom level readouts and focus-friendly switches.

## Positioning the toolbar

Position anchors support `vertical: top|bottom` and `horizontal: left|right`. This enables overlaying controls in corners that don’t obscure intricate diagrams. Add `positions` to the desktop, mobile, or fullscreen configuration to anchor the toolbar elegantly.

## Localizing tooltip text (i18n)

The toolbar buttons ship with English tooltips by default, but you can swap them out per VitePress locale through the `i18n` option of `setToolbar`. Pass the active locale index from VitePress and a per-locale tooltip table; missing keys fall back to the global override and ultimately to the built-in English defaults.

```typescript
import { useData } from "vitepress";

const { localeIndex } = useData();

mermaidRenderer.setToolbar({
  i18n: {
    localeIndex: localeIndex.value,
    locales: {
      tr: {
        tooltips: {
          zoomIn: "Yakınlaştır",
          zoomOut: "Uzaklaştır",
          resetView: "Görünümü sıfırla",
          copyCode: "Kodu kopyala",
          download: "Diyagramı indir",
          toggleFullscreen: "Tam ekranı aç/kapa",
        },
      },
    },
  },
});

// Re-run the call inside a `watch(localeIndex, ...)` so live language switches
// reach already-mounted diagrams. Each `setToolbar` invocation dispatches the
// `vitepress-mermaid:toolbar-updated` event, which mounted diagrams listen for
// and apply without re-rendering the SVG.
```

The resolution order for each tooltip key is:

1. `i18n.locales[localeIndex].tooltips[key]`
2. `i18n.tooltips[key]` (global override)
3. The built-in English default

Empty strings are ignored at every layer so a tooltip can never be blanked out by accident.

## Accessibility considerations

- Keep `showLanguageLabel` enabled so screen readers announce `Mermaid diagram` before the SVG is focused.
- Maintain `resetView` on every breakpoint; it’s a reliable escape hatch when zoom/drag generate confusion.
- Avoid stacking too many buttons on mobile to prevent accidental taps, and use `positions` to steer controls away from diagram hotspots.

With the right toolbar configuration you balance discoverability, responsiveness, and a premium documentation experience across all devices.

For a detailed reference of all available toolbar options and states, see the [Configuration Types](./types.md) page.
