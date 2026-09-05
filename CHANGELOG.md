# Changelog

## 1.2.1

### Added in 1.2.1

- Added an opt-in collapsible toolbar. A new `toggleToolbar` button collapses
  and expands the remaining controls, and a new `collapsed` mode option sets the
  initial state. Both are configurable per display mode through `setToolbar()`.
- `toggleToolbar` defaults to `disabled` and `collapsed` defaults to `expanded`
  in every mode, so existing toolbars look and behave exactly as before until
  the button is explicitly enabled.
- Added `toggleToolbarExpand` and `toggleToolbarCollapse` to the toolbar i18n
  tooltip table, with English, Turkish, and Chinese documentation.
- Added CSS design tokens for toolbar button geometry and colour:
  `--mermaid-control-text-active`, `--mermaid-control-button-radius`,
  `--mermaid-control-button-padding`, `--mermaid-control-button-min-size`, and
  `--mermaid-control-icon-size`.

### Changed in 1.2.1

- Unified the mobile and desktop toolbars into a single set of CSS rules. Mobile
  no longer restyles the toolbar; it only raises `--mermaid-control-padding`,
  `--mermaid-control-gap`, `--mermaid-control-button-min-size`, and
  `--mermaid-control-icon-size` for touch. Overriding a token on
  `.mermaid-container` now changes both toolbars at once.
- Mobile toolbar buttons are borderless like their desktop counterparts, and
  their 44px touch target comes from `min-width` / `min-height` instead of a
  fixed 40x40 box. `--mermaid-control-border` now defaults to `transparent` and
  applies to both modes; set it to a visible colour for outlined buttons.
- Mobile toolbar icons follow `currentColor` instead of a hard-coded `stroke`,
  so `--mermaid-control-text` and the hover colour apply on mobile too.
- The toolbar now wraps instead of overflowing when a full button set is wider
  than the diagram container.
- Corrected the documented defaults for `--mermaid-control-gap`,
  `--mermaid-spinner-duration`, `--mermaid-error-bg`, `--mermaid-error-border`,
  and `--mermaid-error-text`, which had drifted from the stylesheet.

### Fixed in 1.2.1

- Fixed diagrams drifting off-center when the container was resized. The
  fit-to-container baseline is now recalculated on resize without resetting the
  user's zoom or pan, which also covers sidebar toggles and layout changes, not
  just window resizes.
- Fixed the mobile toolbar rendering below the error overlay. Its `z-index` was
  `8` while the error container sits at `10`; both toolbars now use `20`.
- Fixed the mobile zoom-level badge being reordered to the front of the toolbar
  and carrying an extra margin, so both modes read in the same order.
- Removed a `flex-direction: column` rule that silently overrode the mobile
  toolbar's intended row layout, along with the unused `.mobile-only` and
  hover-only visibility rules.

### Docs site in 1.2.1

These changes affect the documentation site only and are not part of the
published package.

- Published machine-readable agent discovery resources under `/.well-known/`: an
  AI catalog, an API catalog, agent skills, an OpenAPI description, OAuth and
  OpenID configuration documents, and a JWKS endpoint.
- Added `auth.md`, an MCP Server Card, an Agent Skills index with SHA-256
  digests, and an ARD capability manifest for automated discovery.
- Added a WebMCP script exposing documentation search and navigation as browser
  tools, plus a Markdown `agent-home.md` served from `/` for clients that
  request `text/markdown`.
- Added RFC 8288 Link headers for the API catalog, OpenAPI description,
  documentation, and discovery metadata.
- Added the Vercel rewrites and content-type/CORS headers backing those
  resources, and advertised the AI catalog and Content Signals from `robots.txt`
  and the page `<head>`.
- Added a DNS-AID zone reference with `_index._agents` and `_a2a._agents` SVCB
  records and DNSSEC deployment guidance for the authoritative DNS provider.

## 1.2.0

### Changed in 1.2.0

- Stabilized features introduced in previous releases for a more reliable
  interactive diagram experience.
- Interactive diagrams now always fit and center themselves after rendering,
  theme updates, and Reset View actions.
- Removed the `fitToContainer` option and its runtime update event; automatic
  fitting is now the standard interactive behavior.
- Updated the English, Turkish, and Chinese documentation to describe automatic
  fitting without a separate configuration option.

### Fixed in 1.2.0

- Restored the container-centered transform origin required by the fitting
  calculation, fixing diagrams that were incorrectly scaled or positioned in
  1.1.32.
- Fixed sluggish diagram dragging by accounting for the fitted base scale,
  removing mousemove frame throttling, and stopping zoom transitions when a drag
  begins.
