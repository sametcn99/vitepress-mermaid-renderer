---
sidebarDepth: 2
---

# Troubleshooting & Best Practices

Even with a solid installation, VitePress documentation sites can run into
Mermaid rendering quirks once they hit production. This checklist focuses on the
renderer, multilingual docs, and toolbar i18n.

## 1. Installation or Update Issues

Errors can sometimes occur after installing the package or updating to a new
version. To resolve these, try clearing VitePress's cache and build artifacts.
Deleting the `.vitepress/cache` and `dist` (or your build output) folders and
then restarting the development server often fixes unexpected behavior caused by
stale dependencies.

## 2. Diagrams fail to appear

- Confirm Mermaid code fences use the `mermaid` language tag. Typos block
  detection.
- Run `bun run docs:dev` and inspect the console for hydration errors before
  deploying. Missing dependencies often log as
  `createMermaidRenderer is not defined` or `window is not defined`.
- Keep renderer setup inside the client-side VitePress theme, not inside
  server-only config files.

## 3. Toolbar missing buttons

- Check `setToolbar()` configuration; the renderer merges deeply, so a
  misconfigured nested object can drop buttons for all breakpoints.
- When you need a lean toolbar per diagram, call `mermaidRenderer.setToolbar()`
  immediately after `createMermaidRenderer()` and before the first render.
- Mobile toolbars hide by default in narrow viewports—but they can reappear if
  you stretch the window. Use `positions` to keep buttons pinned in the same
  corner across breakpoints.

## 4. Dark mode renders incorrectly

- Confirm you watch `useData().isDark` and re-render when it changes. Without
  this hook, Mermaid sticks to the theme active during the initial load.
- Call `createMermaidRenderer({ theme: isDark.value ? "dark" : "forest" })`
  inside the watcher so the singleton dispatches a runtime config update.

## 5. Toolbar text is not localized

- Confirm your VitePress locale keys match the keys passed to `i18n.locales`. In
  this docs site, the supported keys are `root`, `tr`, and `zh`.
- Pass `localeIndex.value` from `useData()` into
  `setToolbar({ i18n: { localeIndex } })`.
- Include `copyCodeCopied` if you want the copy-success status text translated
  too.
- Watch `localeIndex` and call `setToolbar()` again so client-side locale
  navigation updates already-mounted diagrams.

## 6. Build-time SVG breaks

- Clean `.vitepress/cache` before `vitepress build` when you change Mermaid
  dependencies; stale cache entries lock in old versions of the renderer.

## 7. Accessibility checks

- Screen readers rely on `showLanguageLabel` to announce that the container is a
  Mermaid diagram. Keep it enabled or add descriptive labels manually.
- Provide `alt` text equivalents in surrounding prose when diagrams convey
  critical information.
- Verify localized toolbar strings are meaningful as `aria-label` values, not
  just visual tooltips.

## 8. Best practices recap

- Cache the renderer instance and reuse it across renders to avoid unnecessary
  initialization.
- Keep installation snippets and examples aligned with the package behavior you
  document.
- Test `/`, `/tr/`, and `/zh/` before deploying multilingual changes.

By following this checklist, your interactive Mermaid diagrams remain resilient,
performant, and aligned with search engine expectations.
