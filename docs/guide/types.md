# Configuration Types

This page provides a detailed reference for the configuration options available in the **VitePress Mermaid Renderer**.

## Top-Level Configuration

These options are passed to the `createMermaidRenderer()` function or set via `mermaidRenderer.setConfig()`.

| Option              | Type                      | Default     | Description                                                           |
| :------------------ | :------------------------ | :---------- | :-------------------------------------------------------------------- |
| `showLanguageLabel` | `boolean`                 | `true`      | Toggles the original VitePress `mermaid` badge.                       |
| `downloadFormat`    | `'svg' \| 'png' \| 'jpg'` | `'svg'`     | Specifies the default download format for diagrams.                   |
| `fullscreenMode`    | `'browser' \| 'dialog'`   | `'browser'` | Controls whether fullscreen uses the native API or an in-page dialog. |
| `desktop`           | `object`                  | `{}`        | Toolbar configuration for desktop devices.                            |
| `mobile`            | `object`                  | `{}`        | Toolbar configuration for mobile devices.                             |
| `fullscreen`        | `object`                  | `{}`        | Toolbar configuration when in fullscreen mode.                        |
| `i18n`              | `object`                  | `{}`        | Tooltip localization, keyed by VitePress `localeIndex`.               |

---

## Toolbar Configuration

The `desktop`, `mobile`, and `fullscreen` objects share the same structure to control toolbar behavior.

| Key            | Type                      | Description                                                      |
| :------------- | :------------------------ | :--------------------------------------------------------------- |
| `[buttonName]` | `'enabled' \| 'disabled'` | Enable or disable specific buttons (e.g., `zoomIn`, `copyCode`). |
| `zoomLevel`    | `'enabled' \| 'disabled'` | Controls the visibility of the zoom percentage indicator.        |
| `positions`    | `object`                  | Defines where the toolbar is anchored on the screen.             |

### Default Button States

Below are the default visibility states for each button across different modes:

| Button             | Desktop    | Mobile     | Fullscreen | Description                                           |
| :----------------- | :--------- | :--------- | :--------- | :---------------------------------------------------- |
| `zoomIn`           | `enabled`  | `disabled` | `disabled` | Button to zoom into the diagram.                      |
| `zoomOut`          | `enabled`  | `disabled` | `disabled` | Button to zoom out of the diagram.                    |
| `resetView`        | `enabled`  | `enabled`  | `disabled` | Resets the diagram to its original zoom and position. |
| `copyCode`         | `enabled`  | `enabled`  | `disabled` | Copies the Mermaid source code to the clipboard.      |
| `download`         | `disabled` | `disabled` | `disabled` | Downloads the diagram in the specified format.        |
| `toggleFullscreen` | `enabled`  | `enabled`  | `enabled`  | Toggles the fullscreen mode for the diagram.          |

### Position Configuration

The `positions` object allows you to anchor the toolbar to different corners of the diagram container.

| Key          | Values              | Default  | Description                 |
| :----------- | :------------------ | :------- | :-------------------------- |
| `vertical`   | `'top' \| 'bottom'` | `bottom` | Vertical anchor position.   |
| `horizontal` | `'left' \| 'right'` | `right`  | Horizontal anchor position. |

---

## Tooltip Localization (`i18n`)

The `i18n` option lets the toolbar mirror the active VitePress locale. It accepts the following shape:

| Key           | Type                                                | Description                                                     |
| :------------ | :-------------------------------------------------- | :-------------------------------------------------------------- |
| `localeIndex` | `string`                                            | Active VitePress locale key (matches `useData().localeIndex`).  |
| `tooltips`    | `Partial<ToolbarTooltipText>`                       | Global overrides applied when no locale-specific entry matches. |
| `locales`     | `Record<string, { tooltips?: ToolbarTooltipText }>` | Per-locale tooltip tables, keyed by `localeIndex`.              |

### `ToolbarTooltipText`

| Key                | Default English     |
| :----------------- | :------------------ |
| `zoomIn`           | `Zoom In`           |
| `zoomOut`          | `Zoom Out`          |
| `resetView`        | `Reset View`        |
| `copyCode`         | `Copy Code`         |
| `download`         | `Download Diagram`  |
| `toggleFullscreen` | `Toggle Fullscreen` |

Resolution order per key: `locales[localeIndex].tooltips[key]` → `tooltips[key]` → built-in default. Empty strings are ignored at every level.

---

## Example Usage

```typescript
const mermaidRenderer = createMermaidRenderer({
  downloadFormat: "png",
  desktop: {
    zoomIn: "enabled",
    positions: { vertical: "top", horizontal: "right" },
  },
});
```

For more details on how to apply these configurations, see the [Configuration Guide](./configuration.md) and [Toolbar Customization](./toolbar.md).
