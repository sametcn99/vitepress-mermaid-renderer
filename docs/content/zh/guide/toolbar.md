---
sidebarDepth: 2
---

# 工具栏自定义

内置工具栏会在支持拖拽的图表表面周围提供缩放、重置、全屏、下载和复制控件。它还支持本地化按钮标题、可访问标签和复制成功文本。

## Desktop、mobile 和 fullscreen

```typescript
mermaidRenderer.setToolbar({
  showLanguageLabel: true,
  downloadFormat: 'svg',
  fullscreenMode: 'browser',
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

- `fullscreenMode` 控制全屏体验：`browser` 使用原生 Fullscreen API，`dialog`
  打开页面内 modal overlay。
- **Desktop** 可以展示全部控件，因为鼠标和键盘交互空间更充足。
- **Mobile** 通常隐藏缩放按钮，保留重置和复制操作。
- **Fullscreen** 可以单独管理缩放比例显示和焦点友好的控件。

## 定位工具栏

`positions` 支持 `vertical: top|bottom` 和
`horizontal: left|right`。你可以把控件放到不会遮挡关键图表内容的角落。

## 本地化 tooltip 文本

工具栏默认使用英文文本。请从 VitePress 获取当前 `localeIndex`，并通过
`setToolbar` 的 `i18n` 选项传入按 locale 划分的文本表。

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
```

每个文本 key 的解析顺序如下：

1. `i18n.locales[localeIndex].tooltips[key]`
2. `i18n.tooltips[key]`
3. 内置英文默认值

空字符串会在每一层被忽略，因此工具栏文本不会被意外清空。复制按钮写入剪贴板后显示的短状态文本使用
`copyCodeCopied`。

每次调用 `setToolbar()` 都会派发 `vitepress-mermaid:toolbar-updated`
事件。已挂载图表会监听该事件，并在不重新挂载 SVG 的情况下应用新的工具栏文本。

## 可访问性建议

- 保持 `showLanguageLabel` 开启可以帮助屏幕阅读器识别 Mermaid 图表上下文。
- 每个断点都保留 `resetView`，可以在缩放或拖拽后提供可靠的恢复路径。
- 移动端不要堆叠过多按钮；使用 `positions` 将控件移离图表密集区域。

完整类型见[配置类型](./types.md)。
