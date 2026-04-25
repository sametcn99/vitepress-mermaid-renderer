---
sidebarDepth: 2
---

# 配置

`createMermaidRenderer()`
接收 Mermaid 运行时选项，并返回共享的 renderer 实例。工具栏行为通过
`setToolbar()` 单独配置，也包括多语言 VitePress 站点需要的 locale 感知文本。

## 核心 renderer 选项

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
      value.toLocaleString('zh-CN', { timeZone: 'UTC' }),
  },
  securityLevel: 'loose',
});
```

| 选项                     | 作用                                                                              |
| :----------------------- | :-------------------------------------------------------------------------------- |
| `theme`                  | 在 Mermaid 内置主题之间切换。VitePress 的 `isDark` 信号会让图表背景跟随站点主题。 |
| `startOnLoad`            | 使用 renderer 生命周期时保持 `false`，让插件控制渲染流程。                        |
| `flowchart` / `sequence` | 映射官方 Mermaid config schema，可按图表类型设置间距和标签行为。                  |
| `gantt`                  | 嵌入项目时间线时自定义日期格式或坐标轴显示。                                      |
| `securityLevel`          | 传给 `mermaid.initialize()` 的 Mermaid 安全模式。请根据内容策略选择。             |

如果再次调用 `createMermaidRenderer()` 并传入新的 Mermaid
config，现有 singleton 会合并配置，并向已挂载图表发送运行时更新。

## 主题感知

```typescript
watch(
  () => isDark.value,
  () => {
    createMermaidRenderer({
      theme: isDark.value ? 'dark' : 'forest',
    });
  },
);
```

当站点在明暗主题间切换时，请用新的 Mermaid 主题再次调用 renderer。已挂载图表会监听 config
update 事件，并使用当前配色重新渲染。

## Locale 感知工具栏

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

根英文 locale 可以使用内置默认文本。土耳其语和中文页面会传入各自的 VitePress
`localeIndex`，从而解析对应的文本表。

## 导出和可访问性默认值

- `downloadFormat` 决定下载操作导出 `svg`、`png` 还是 `jpg`。
- `fullscreenMode` 可以是使用原生 Fullscreen API 的
  `browser`，也可以是页面内 overlay 的 `dialog`。
- `showLanguageLabel` 控制增强后是否保留 VitePress 原始的 `mermaid` 代码块标签。
- `resetView`、`copyCode` 和可访问按钮标签对键盘和屏幕阅读器流程很重要。

通过一个 renderer 实例统一配置，可以让图表在页面、断点、主题和语言之间保持一致。完整选项见[配置类型](./types.md)。
