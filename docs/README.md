# VitePress Mermaid Renderer Docs

This folder contains the multilingual VitePress documentation site for
`vitepress-mermaid-renderer`.

## Supported Locales

| Locale             | Route  | Contents                                                   |
| ------------------ | ------ | ---------------------------------------------------------- |
| English            | `/`    | Home, guide, examples, and testing guide.                  |
| Turkish            | `/tr/` | Fully translated home, guide, examples, and testing guide. |
| Simplified Chinese | `/zh/` | Fully translated home, guide, examples, and testing guide. |

## File Layout

- `.vitepress/config.mts` contains the VitePress entry config.
- `.vitepress/config/locales.mts` contains localized navigation, sidebars,
  search labels, and footer text.
- `.vitepress/theme/index.ts` wires the renderer and toolbar i18n into the
  default theme.
- `content/en/` contains the English pages that publish at the root route (`/`).
- `content/tr/` mirrors the page tree for Turkish and publishes under `/tr/`.
- `content/zh/` mirrors the page tree for Simplified Chinese and publishes under
  `/zh/`.
- `content/public/` contains static deployment assets such as `robots.txt` and
  `sitemap.xml`.

The docs source root is `content/`. English files live in `content/en/`, and
VitePress rewrites those source paths back to root URLs so `/`, `/guide/*`,
`/examples/*`, and `/testing` remain unchanged. The `tr` and `zh` directories
mirror the same page tree so VitePress locale routing, sidebars, edit links,
search labels, and toolbar i18n stay aligned.

## Quick Start

```bash
bun install
bun run docs:dev
```

Build the static site before deployment:

```bash
bun run docs:build
```

Preview the production build locally:

```bash
bun run docs:preview
```

## Package Updates

Keep the docs dependency, installation snippets, toolbar i18n examples, and
runtime behavior aligned with the current package behavior.

When package behavior changes, update these files together:

- `package.json`
- `bun.lock`
- English, Turkish, and Chinese installation pages under `content/`
- `content/public/sitemap.xml` when the route tree changes

## Cleanup

If VitePress or Mermaid cache stale output, remove local build artifacts and
reinstall with Bun:

```bash
rm -rf node_modules .vitepress/cache dist
bun install
bun run docs:dev
```
