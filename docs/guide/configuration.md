---
sidebarDepth: 2
---

# Configuration

`createMermaidRenderer()` gives you a fully typed configuration surface that controls the Mermaid runtime, toolbar, and rendering lifecycle. This page documents every option you are likely to touch when tailoring diagrams for different screen sizes, color schemes, and accessibility requirements.

## Core renderer options

```typescript
const mermaidRenderer = createMermaidRenderer({
  theme: isDark.value ? "dark" : "forest",
  startOnLoad: true,
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
      value.toLocaleString("en-US", { timeZone: "UTC" }),
  },
  securityLevel: "strict",
});
```

| Option                   | Purpose                                                                                                                                               |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`                  | Toggles between Mermaid’s built-in palettes. VitePress’s `isDark` signal keeps the background consistent with the site theme.                         |
| `startOnLoad`            | Defers rendering until you explicitly trigger `render()`; useful for lazy-loaded content.                                                             |
| `flowchart` / `sequence` | Mirrors the options in the official Mermaid config schema while maintaining type safety. Set margins, spacing, and label behavior per diagram family. |
| `gantt`                  | Customize date formatting or axis visibility when embedding project timelines.                                                                        |
| `securityLevel`          | Defaults to `strict` to protect against inline HTML injections in Markdown.                                                                           |

Use the renderer instance to call `setGlobalConfig()` whenever you need to apply runtime overrides or respond to user input.

## Theme awareness and re-rendering

```typescript
watch(
  () => isDark.value,
  () => {
    initMermaid();
  },
);
```

When the site switches between light and dark, update the renderer configuration and re-render all Mermaid canvases. The renderer debounces sequential calls so you avoid redundant work when multiple diagrams refresh simultaneously.

## Export and accessibility defaults

- `downloadFormat` controls whether the download widget offers `svg`, `png`, or `jpg`.
- `toolbar` defaults such as `resetView` and `copyCode` are heavily used by technical writers; toggle them off only after validating accessibility requirements.

By controlling configuration through a single renderer instance, you keep Mermaid diagrams consistent across pages, mobile breakpoints, and build stages.
For a detailed reference of all available options and types, see the [Configuration Types](./types.md) page.
