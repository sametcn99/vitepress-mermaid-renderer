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

| 选项                     | 作用                                                                                                                                                    |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `theme`                  | 在 Mermaid 内置主题之间切换。VitePress 的 `isDark` 信号会让图表背景跟随站点主题。                                                                       |
| `startOnLoad`            | 使用 renderer 生命周期时保持 `false`，让插件控制渲染流程。                                                                                              |
| `flowchart` / `sequence` | 映射官方 Mermaid config schema，可按图表类型设置间距和标签行为。                                                                                        |
| `gantt`                  | 嵌入项目时间线时自定义日期格式或坐标轴显示。                                                                                                            |
| `securityLevel`          | 传给 `mermaid.initialize()` 的 Mermaid 安全模式。**变更：** 默认值现在是 `'strict'`，禁用图表内的 inline HTML。仅在你信任所有图表来源时使用 `'loose'`。 |

如果再次调用 `createMermaidRenderer()` 并传入新的 Mermaid
config，现有 singleton 会**深度合并**配置（嵌套对象如 `flowchart`
会被合并而非替换），并向已挂载图表发送运行时更新。

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

根英文 locale 可以使用内置默认文本。土耳其语和中文页面会传入各自的 VitePress
`localeIndex`，从而解析对应的文本表。

## 导出和可访问性默认值

- `downloadFormat` 决定下载操作导出 `svg`、`png` 还是 `jpg`。
- `fullscreenMode` 可以是使用原生 Fullscreen API 的
  `browser`，也可以是页面内 overlay 的 `dialog`。
- `showLanguageLabel` 控制增强后是否保留 VitePress 原始的 `mermaid` 代码块标签。
- `resetView`、`copyCode` 和可访问按钮标签对键盘和屏幕阅读器流程很重要。

## 安全性

默认情况下，`securityLevel` 设为 `'strict'`，**禁用** Mermaid 图表内的 inline
HTML。这是最安全的默认值，因为 Mermaid 图表通常来自用户编写的 Markdown 文件，inline
HTML 可能引入 XSS 漏洞。

如果需要使用 inline
HTML 的高级 Mermaid 功能（例如流程图节点中的可点击链接或格式化标签），可以显式选择
`'loose'` 安全级别——但**仅**在你信任所有图表来源时：

```typescript
// ⚠️ 仅在你信任站点上所有 Mermaid 代码块时使用 'loose'。
const mermaidRenderer = createMermaidRenderer({
  securityLevel: 'loose',
});
```

SVG 下载无论 `securityLevel` 设置如何都会进行消毒：`<script>`、`<iframe>`、
`<object>`、`<embed>`、stylesheet `<link>` 元素以及所有 `on*`
事件处理属性在序列化前都会被移除。

## CSS 自定义属性（设计令牌）

渲染器样式表中的所有视觉常量都以 CSS 自定义属性的形式暴露在 `.mermaid-container`
上。覆盖这些属性即可自定义外观，无需编辑源样式表：

| 变量                              | 默认值                      | 用途               |
| :-------------------------------- | :-------------------------- | :----------------- |
| `--mermaid-control-bg`            | `var(--vp-c-bg)`            | 工具栏按钮背景     |
| `--mermaid-control-text`          | `var(--vp-c-text-1)`        | 工具栏按钮文字颜色 |
| `--mermaid-control-border`        | `var(--vp-c-divider)`       | 工具栏按钮边框     |
| `--mermaid-control-shadow`        | `0 2px 4px rgba(0,0,0,0.1)` | 工具栏按钮阴影     |
| `--mermaid-control-radius`        | `0.375rem`                  | 工具栏按钮圆角     |
| `--mermaid-control-padding`       | `0.375rem`                  | 工具栏按钮内边距   |
| `--mermaid-control-gap`           | `0.25rem`                   | 工具栏按钮间距     |
| `--mermaid-spinner-duration`      | `1s`                        | 加载动画周期       |
| `--mermaid-notification-duration` | `2s`                        | "已复制"通知时长   |
| `--mermaid-error-bg`              | `var(--vp-c-danger-soft)`   | 错误容器背景       |
| `--mermaid-error-border`          | `var(--vp-c-danger-1)`      | 错误容器边框       |
| `--mermaid-error-text`            | `var(--vp-c-danger-1)`      | 错误容器文字颜色   |

## 可配置的缩放限制

缩放边界可通过 `MermaidNavigationOptions` 自定义：

```typescript
import { useMermaidNavigation } from 'vitepress-mermaid-renderer';

const { zoomIn, zoomOut, resetView } = useMermaidNavigation({
  minScale: 0.1, // 默认 0.2
  maxScale: 20, // 默认 10
  zoomStep: 1.5, // 默认 1.2
});
```

适用于默认缩放范围过窄或过宽的可访问性或图表特定自定义场景。

## 减少动画

渲染器会自动遵守用户的 `prefers-reduced-motion` 操作系统设置。启用后，
`.mermaid-container` 内的所有动画和过渡效果将被自动禁用——无需额外配置。

通过一个 renderer 实例统一配置，可以让图表在页面、断点、主题和语言之间保持一致。完整选项见[配置类型](./types.md)。
