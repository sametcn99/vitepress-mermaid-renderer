---
sidebarDepth: 2
---

# 故障排除与最佳实践

即使安装正确，VitePress 文档站点在生产环境中也可能遇到 Mermaid 渲染问题。此清单聚焦 renderer、多语言文档和工具栏 i18n。

## 1. 安装或更新问题

安装包或升级版本后如果出现意外错误，请清理 VitePress 缓存和构建产物。删除
`.vitepress/cache` 和 `dist`
后重新启动开发服务器，通常可以解决陈旧依赖导致的问题。

## 2. 图表没有显示

- 确认 Mermaid 代码块使用 `mermaid` 语言标签。拼写错误会阻止检测。
- 部署前运行 `bun run docs:dev`，并在控制台检查 hydration 错误。
- 将 renderer 初始化放在客户端 VitePress 主题文件中，而不是 server-only
  config 文件中。

## 3. 工具栏按钮缺失

- 检查 `setToolbar()`
  配置。Renderer 会进行深度合并，错误的嵌套对象可能影响所有断点。
- 如果需要为图表使用更精简的 toolbar，请在首次 render 前调用
  `mermaidRenderer.setToolbar()`。
- 移动端 toolbar 会在窄视口下更精简。使用 `positions`
  让控件在不同断点中固定到一致角落。

## 4. 深色模式渲染不正确

- 确认你监听了
  `useData().isDark`。没有这个 hook 时，Mermaid 会停留在初次加载时的主题。
- 在 watcher 中调用
  `createMermaidRenderer({ theme: isDark.value ? "dark" : "forest" })`。

## 5. 工具栏文本没有本地化

- 确认 VitePress locale key 与 `i18n.locales` 中的 key 一致。本 docs 站点支持
  `root`、`tr` 和 `zh`。
- 将 `useData()` 中的 `localeIndex.value` 传给
  `setToolbar({ i18n: { localeIndex } })`。
- 如果要翻译复制成功消息，请包含 `copyCodeCopied` key。
- 为了让客户端 locale 切换更新已挂载图表，请 watch `localeIndex` 并再次调用
  `setToolbar()`。

## 6. 构建时 SVG 出错

当 Mermaid 依赖发生变化时，在 `vitepress build` 前清理
`.vitepress/cache`。陈旧缓存可能保留旧 renderer 版本的结果。

## 7. 可访问性检查

- 屏幕阅读器可以利用 `showLanguageLabel`
  理解图表上下文。如果关闭它，请在周围文本中提供说明。
- 对承载关键信息的图表，请在正文中提供等价说明。
- 验证本地化工具栏文本不仅是视觉 tooltip，也能作为有意义的 `aria-label`。

## 8. 最佳实践回顾

- 保持安装示例和使用细节与当前文档描述的包行为一致。
- 部署前测试 `/`、`/tr/` 和 `/zh/`。
- 升级插件后同时执行缓存清理、docs build 和 smoke tests。

遵循此清单可以让交互式 Mermaid 图表保持稳定、高性能，并符合搜索引擎预期。
