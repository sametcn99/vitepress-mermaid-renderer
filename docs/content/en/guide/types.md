# Configuration Types

This page provides a reference for the toolbar configuration options available
in **VitePress Mermaid Renderer**.

## Renderer Configuration

`createMermaidRenderer()` accepts Mermaid configuration options directly. It
also accepts the renderer-specific options shown below.

| Option   | Type      | Default | Description                                                                 |
| :------- | :-------- | :------ | :-------------------------------------------------------------------------- |
| `static` | `boolean` | `false` | Renders a plain theme-aware SVG without controls or interactive navigation. |

All other renderer options, such as `theme`, `flowchart`, and `securityLevel`,
follow the
[Mermaid configuration schema](https://mermaid.js.org/config/configuration.html).

## Toolbar Configuration

These options are passed to `mermaidRenderer.setToolbar()`.

---

The `desktop`, `mobile`, and `fullscreen` objects share the same structure to
control toolbar behavior.

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

The `positions` object allows you to anchor the toolbar to different corners of
the diagram container.

| Key          | Values              | Default  | Description                 |
| :----------- | :------------------ | :------- | :-------------------------- |
| `vertical`   | `'top' \| 'bottom'` | `bottom` | Vertical anchor position.   |
| `horizontal` | `'left' \| 'right'` | `right`  | Horizontal anchor position. |

---

## Toolbar Text Localization (`i18n`)

The `i18n` option lets the toolbar mirror the active VitePress locale. It
localizes button tooltips and transient toolbar status text. It accepts the
following shape:

| Key           | Type                                                  | Description                                                     |
| :------------ | :---------------------------------------------------- | :-------------------------------------------------------------- |
| `localeIndex` | `string`                                              | Active VitePress locale key (matches `useData().localeIndex`).  |
| `tooltips`    | `Partial<ToolbarText>`                                | Global overrides applied when no locale-specific entry matches. |
| `locales`     | `Record<string, { tooltips?: Partial<ToolbarText> }>` | Per-locale toolbar text tables, keyed by `localeIndex`.         |

### `ToolbarText`

| Key                          | Default English            |
| :--------------------------- | :------------------------- |
| `zoomIn`                     | `Zoom In`                  |
| `zoomOut`                    | `Zoom Out`                 |
| `resetView`                  | `Reset View`               |
| `copyCode`                   | `Copy Code`                |
| `copyCodeCopied`             | `Copied`                   |
| `download`                   | `Download Diagram`         |
| `toggleFullscreen`           | `Toggle Fullscreen`        |
| `renderErrorText`            | `Failed to render diagram` |
| `toggleErrorDetailsText`     | `Show Details`             |
| `toggleErrorDetailsHideText` | `Hide Details`             |

Resolution order per key: `locales[localeIndex].tooltips[key]` → `tooltips[key]`
→ built-in default. Empty strings are ignored at every level.

### Example localized map

```typescript
const i18n = {
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
};
```

---

## Example Usage

```typescript
const mermaidRenderer = createMermaidRenderer({
  theme: 'forest',
});

mermaidRenderer.setToolbar({
  downloadFormat: 'png',
  desktop: {
    download: 'enabled',
    positions: { vertical: 'top', horizontal: 'right' },
  },
});
```

For more details on how to apply these configurations, see the
[Configuration Guide](./configuration.md) and
[Toolbar Customization](./toolbar.md).
