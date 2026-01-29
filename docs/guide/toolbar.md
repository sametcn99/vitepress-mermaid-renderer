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

- **Desktop** should surface all controls because mouse and keyboard navigation are available.
- **Mobile** hides zoom buttons but keeps reset/copy so thumbs stay clear of the diagram area.
- **Fullscreen** mode reinjects zoom level readouts and focus-friendly switches.

## Positioning the toolbar

Position anchors support `vertical: top|bottom` and `horizontal: left|right`. This enables overlaying controls in corners that don’t obscure intricate diagrams. Add `positions` to the desktop, mobile, or fullscreen configuration to anchor the toolbar elegantly.

## Accessibility considerations

- Keep `showLanguageLabel` enabled so screen readers announce `Mermaid diagram` before the SVG is focused.
- Maintain `resetView` on every breakpoint; it’s a reliable escape hatch when zoom/drag generate confusion.
- Avoid stacking too many buttons on mobile to prevent accidental taps, and use `positions` to steer controls away from diagram hotspots.

With the right toolbar configuration you balance discoverability, responsiveness, and a premium documentation experience across all devices.

For a detailed reference of all available toolbar options and states, see the [Configuration Types](./types.md) page.
