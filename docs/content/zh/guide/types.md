# 配置类型

本页概述 **VitePress Mermaid Renderer** 中可用的工具栏配置选项。

## Renderer 配置

`createMermaidRenderer()`
直接接收 Mermaid 配置选项，也支持下面的 renderer 专用选项。

| 选项             | 类型      | 默认值  | 说明                                                  |
| :--------------- | :-------- | :------ | :---------------------------------------------------- |
| `static`         | `boolean` | `false` | 生成没有控件和交互式导航的主题感知 SVG。              |
| `fitToContainer` | `boolean` | `false` | 在每次 Mermaid 渲染后将交互式图表适配并居中到其容器。 |

其他 renderer 选项（如 `theme`、`flowchart` 和 `securityLevel`）遵循
[Mermaid 配置 schema](https://mermaid.js.org/config/configuration.html)。

## 工具栏配置

这些选项传给 `mermaidRenderer.setToolbar()`。

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

| Key                          | 默认英文                   |
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
