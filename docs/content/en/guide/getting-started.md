---
sidebarDepth: 2
---

# Getting Started with VitePress Mermaid Renderer

VitePress Mermaid Renderer turns static Mermaid diagrams into interactive
diagrams that stay responsive, theme-aware, and accessible. It includes
locale-aware toolbar text for multilingual VitePress sites, including English,
Turkish, and Chinese documentation.

## Why this plugin matters for VitePress docs

- **Interactive visualization** keeps complex diagrams legible on desktop and
  mobile. The renderer augments Mermaid with zoom, pan, reset, copy, download,
  and fullscreen controls.
- **Documentation-ready workflow** means you write Markdown once, and VitePress
  automatically enhances every fenced Mermaid block with the configured toolbar.
- **Locale-aware UI** lets toolbar titles, accessible labels, and copy-success
  text follow `useData().localeIndex` so every language has matching controls.
- **SEO-friendly delivery** keeps the documentation statically generated while
  the browser handles the interactive layer after hydration.

## What to expect from the guide

| Topic                 | Description                                                                                                          |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Installation & Setup  | Install `vitepress-mermaid-renderer`, wire it into `.vitepress/theme`, and verify local rendering.                   |
| Configuration         | Pass Mermaid options through `createMermaidRenderer()` and update theme-aware settings when VitePress state changes. |
| Toolbar Customization | Control per-mode buttons, download format, fullscreen behavior, positioning, and localized toolbar text.             |
| Configuration Types   | Review the top-level toolbar options and the exact i18n shape introduced for locale-specific text.                   |
| Troubleshooting       | Diagnose hydration, stale cache, route navigation, localization, and accessibility issues.                           |

## How the renderer works

1. VitePress renders Mermaid code fences as static Markdown during the build.
2. The theme calls `createMermaidRenderer()` on the client after hydration
   starts.
3. The renderer discovers Mermaid blocks, mounts Vue-powered diagram components,
   and injects the toolbar controls.
4. Runtime updates, such as theme or locale changes, dispatch update events to
   already-mounted diagrams.

This flow keeps Markdown authoring simple while giving readers an interactive
diagram surface in every supported locale.
