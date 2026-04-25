---
sidebarDepth: 2
---

# VitePress Mermaid Renderer 入门

VitePress Mermaid
Renderer 会把静态 Mermaid 图表变成响应式、主题感知且可访问的交互式图表。它提供多语言 VitePress 站点所需的 locale 感知工具栏文本，适用于英文、土耳其语和中文文档。

## 为什么在 VitePress 文档中使用它

- **交互式可视化**
  可以让复杂图表在桌面端和移动端都保持可读。Renderer 会添加缩放、拖拽、重置、复制、下载和全屏控件。
- **面向文档的工作流**
  让你继续使用 Markdown 编写内容。VitePress 会为每个 Mermaid 代码块增强已配置的工具栏。
- **Locale 感知界面** 让工具栏标题、可访问标签和复制成功文本跟随
  `useData().localeIndex`。
- **SEO 友好输出** 保持静态生成文档，并在浏览器 hydration 后加载交互层。

## 本指南包含什么

| 主题         | 说明                                                                                      |
| :----------- | :---------------------------------------------------------------------------------------- |
| 安装与设置   | 安装 `vitepress-mermaid-renderer`，接入 `.vitepress/theme`，并验证本地渲染。              |
| 配置         | 通过 `createMermaidRenderer()` 传入 Mermaid 选项，并在 VitePress 状态变化时更新主题设置。 |
| 工具栏自定义 | 管理不同模式下的按钮、下载格式、全屏行为、位置和本地化文本。                              |
| 配置类型     | 查看工具栏选项和 locale 文本所需的 `i18n` 结构。                                          |
| 故障排除     | 诊断 hydration、陈旧缓存、路由切换、本地化和可访问性问题。                                |

## Renderer 如何工作

1. VitePress 在构建阶段把 Mermaid 代码块输出为静态 Markdown 内容。
2. 主题在客户端 hydration 开始后调用 `createMermaidRenderer()`。
3. Renderer 查找 Mermaid 代码块，挂载 Vue 驱动的图表组件，并注入工具栏。
4. 主题或 locale 变化等运行时更新会向已挂载图表发送更新事件。

这个流程让 Markdown 编写保持简单，同时为每个支持语言的读者提供交互式图表体验。
