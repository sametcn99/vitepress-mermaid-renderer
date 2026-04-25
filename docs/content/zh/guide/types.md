# 配置类型

本页概述 **VitePress Mermaid Renderer** 中可用的工具栏配置选项。

## 顶层配置

这些选项传给 `mermaidRenderer.setToolbar()`。

| 选项                | 类型                      | 默认值      | 说明                                            |
| :------------------ | :------------------------ | :---------- | :---------------------------------------------- |
| `showLanguageLabel` | `boolean`                 | `true`      | 显示或隐藏 VitePress 原始的 `mermaid` 标签。    |
| `downloadFormat`    | `'svg' \| 'png' \| 'jpg'` | `'svg'`     | 指定图表下载格式。                              |
| `fullscreenMode`    | `'browser' \| 'dialog'`   | `'browser'` | 控制全屏使用原生 API 还是页面内 dialog。        |
| `desktop`           | `object`                  | `{}`        | 桌面端工具栏配置。                              |
| `mobile`            | `object`                  | `{}`        | 移动端工具栏配置。                              |
| `fullscreen`        | `object`                  | `{}`        | 全屏模式下的工具栏配置。                        |
| `i18n`              | `object`                  | 英文        | 根据 VitePress `localeIndex` 本地化工具栏文本。 |

## 工具栏配置

`desktop`、`mobile` 和 `fullscreen` 对象共享同一结构。

| Key            | 类型                      | 说明                 |
| :------------- | :------------------------ | :------------------- |
| `[buttonName]` | `'enabled' \| 'disabled'` | 启用或隐藏特定按钮。 |
| `zoomLevel`    | `'enabled' \| 'disabled'` | 控制缩放百分比显示。 |
| `positions`    | `object`                  | 定义工具栏锚定位置。 |

### 默认按钮状态

| 按钮               | Desktop    | Mobile     | Fullscreen | 说明                          |
| :----------------- | :--------- | :--------- | :--------- | :---------------------------- |
| `zoomIn`           | `enabled`  | `disabled` | `disabled` | 放大图表。                    |
| `zoomOut`          | `enabled`  | `disabled` | `disabled` | 缩小图表。                    |
| `resetView`        | `enabled`  | `enabled`  | `disabled` | 将图表恢复到初始视图。        |
| `copyCode`         | `enabled`  | `enabled`  | `disabled` | 将 Mermaid 源码复制到剪贴板。 |
| `download`         | `disabled` | `disabled` | `disabled` | 以指定格式下载图表。          |
| `toggleFullscreen` | `enabled`  | `enabled`  | `enabled`  | 切换图表全屏模式。            |

### 位置配置

| Key          | 值                  | 默认值   | 说明       |
| :----------- | :------------------ | :------- | :--------- |
| `vertical`   | `'top' \| 'bottom'` | `bottom` | 垂直锚点。 |
| `horizontal` | `'left' \| 'right'` | `right`  | 水平锚点。 |

## 工具栏文本本地化 (`i18n`)

| Key           | 类型                                                  | 说明                                                |
| :------------ | :---------------------------------------------------- | :-------------------------------------------------- |
| `localeIndex` | `string`                                              | 当前 VitePress locale key。                         |
| `tooltips`    | `Partial<ToolbarText>`                                | 没有 locale-specific 值时使用的全局覆盖。           |
| `locales`     | `Record<string, { tooltips?: Partial<ToolbarText> }>` | 以 `localeIndex` 为 key 的 locale-specific 文本表。 |

### `ToolbarText`

| Key                | 默认英文            |
| :----------------- | :------------------ |
| `zoomIn`           | `Zoom In`           |
| `zoomOut`          | `Zoom Out`          |
| `resetView`        | `Reset View`        |
| `copyCode`         | `Copy Code`         |
| `copyCodeCopied`   | `Copied`            |
| `download`         | `Download Diagram`  |
| `toggleFullscreen` | `Toggle Fullscreen` |

解析顺序：`locales[localeIndex].tooltips[key]` → `tooltips[key]`
→ 内置默认值。空字符串会在每层被忽略。

## 示例用法

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

更多应用细节见[配置](./configuration.md)和[工具栏自定义](./toolbar.md)。
