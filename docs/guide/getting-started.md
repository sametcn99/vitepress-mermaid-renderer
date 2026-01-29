---
sidebarDepth: 2
---

# Getting Started with VitePress Mermaid Renderer

VitePress Mermaid Renderer turns static Mermaid diagrams into interactive experiences that stay responsive, theme-aware, and accessible. This guide highlights why the plugin is the go-to choice for documentation teams that need zooming, panning, toolbar controls, and export-ready diagrams without leaving the Markdown workflow.

## Why this plugin matters for VitePress docs

- **Interactive visualization** keeps complex diagrams legible on desktop and mobile. This plugin augments Mermaid with zoom, pan, reset, and fullscreen so your readers can explore nodes without manual scrolling.
- **Documentation-ready workflow** means you write Markdown once, and VitePress automatically powers every ` ```mermaid ` block with the full toolbar and copy/download options.
- **SEO-friendly delivery** relies on static assets while the user-facing experience is handled by lightweight scripts that respect VitePress caching and bundling.

## What to expect from the guide

| Topic                 | Description                                                                                                                                                                    |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installation & Setup  | Step-by-step package manager instructions, linking the renderer to your `.vitepress` theme, and validating your environment. (See [Installation & Setup](/guide/installation)) |
| Configuration         | Full reference for `createMermaidRenderer()`, theme-aware defaults, and how to extend Mermaid’s internal options. (See [Configuration Deep Dive](/guide/configuration))        |
| Toolbar Customization | Control which buttons show up on desktop, mobile, and fullscreen views plus positioning and group behavior. (See [Toolbar Customization](/guide/toolbar))                      |
| Troubleshooting       | Capture common pitfalls, cache clears, bundler checks, and accessibility fingerprints. (See [Troubleshooting](/guide/troubleshooting))                                         |

## How the renderer works

1. The plugin scans for ` ```mermaid ` fences during VitePress hydration.
2. It creates a renderer instance that can configure theme preference, toolbar controls, and download formats.
3. Before VitePress renders, the script swaps the raw code block with an SVG canvas, attaches zoom/pan listeners, and injects the toolbar.

This flow ensures the diagrams stay readable while keeping the Markdown source text searchable by crawlers.
