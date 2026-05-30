# Changelog

## 1.1.25

### Changed

- **Security: `securityLevel` default changed from `'loose'` to `'strict'`**.
  Inline HTML inside Mermaid diagrams is now disabled by default to prevent XSS
  when rendering user-controlled or external Markdown content. If you need
  inline HTML features (e.g. clickable links in flowchart nodes), opt in
  explicitly: `createMermaidRenderer({ securityLevel: 'loose' })`.
- **Simplified diagram discovery** — replaced the two-step
  `getElementsByClassName` + fallback `querySelectorAll('pre')` scan with a
  single `querySelectorAll('pre > code.mermaid, pre > code.language-mermaid')`
  selector, eliminating the full-page `<pre>` iteration and the custom
  `HTMLCollectionOf` shim.
- **Early retry termination** — `renderWithRetry()` now stops the
  exponential-backoff loop immediately when the `MutationObserver` is active,
  since it will pick up any late-arriving Mermaid blocks. Reduced
  `maxRenderAttempts` from 15 to 5 accordingly.
- **IntersectionObserver-based lazy rendering** — offscreen Mermaid diagrams are
  no longer rendered immediately; they are observed with an
  `IntersectionObserver` (200 px root margin) and enqueued only when they scroll
  near the viewport, significantly reducing initial page-load cost on long
  documents.
- **`requestAnimationFrame` instead of fixed delays** — replaced the
  `setTimeout(resolve, 200)` delay in `renderMermaidDiagram()` and the 150 ms /
  50 ms production/cap delays in `useMermaidRenderer` with
  `requestAnimationFrame`-based paint waits, ensuring the SVG is settled without
  arbitrary timing guesses.
- **`MutationObserver` scoped to `attributes: false`** — the DOM observer now
  explicitly opts out of attribute-change notifications, reducing unnecessary
  callback invocations for style/class mutations unrelated to Mermaid content.
- **Duplicate-render prevention** — discovered `<pre>` elements are immediately
  marked with `data-mermaid-processed` so that concurrent `MutationObserver`
  triggers and retry passes cannot re-queue the same element.
- **Shared Vue context for diagram rendering** — replaced per-diagram
  `createApp().mount()` with `render(h(MermaidDiagram), wrapper)`. Each diagram
  now mounts into a lightweight render call instead of creating a full Vue app
  instance, reducing memory pressure on pages with many diagrams.
- **Singleton fullscreen event manager** — extracted fullscreen-change listeners
  into `useFullscreenManager.ts`. Instead of each diagram registering 4 event
  listeners (`fullscreenchange` + vendor prefixes), a single shared manager
  attaches exactly 4 listeners regardless of how many diagrams are on the page.
- **CSS-only controls visibility** — removed the `onMounted` inline style hack
  that forced `.controls { opacity: 1; visibility: visible }` via JavaScript.
  Controls now default to `opacity: 1; visibility: visible` in CSS and are
  shown/hidden purely through CSS classes and transitions.
- **IntersectionObserver reuse** — `observeOffscreenElements()` now reuses the
  existing `lazyObserver` instead of disconnecting and recreating it on every
  call, eliminating unnecessary observer churn during route transitions.
- **SVG download sanitization** — `useMermaidDownload` now strips `<script>`,
  `<iframe>`, `<object>`, `<embed>`, stylesheet `<link>` elements, and all `on*`
  event-handler attributes from the cloned SVG before serialisation, preventing
  malicious content from being exported even when `securityLevel: 'loose'` is
  used.
- **requestAnimationFrame throttle for high-frequency events** — `wheel` and
  `mousemove` handlers now coalesce rapid events via `requestAnimationFrame`,
  limiting reactive style updates to the browser's frame rate instead of firing
  on every event (60+ per second).
- **Config deep merge** — `MermaidRenderer.setConfig()` now deep-merges nested
  objects instead of shallow-spread, so `flowchart: { useMaxWidth: true }`
  merges with defaults instead of replacing the entire `flowchart` section.
- **CSS custom properties (design tokens)** — introduced `--mermaid-control-bg`,
  `--mermaid-control-text`, `--mermaid-control-border`,
  `--mermaid-control-shadow`, `--mermaid-control-radius`,
  `--mermaid-control-padding`, `--mermaid-control-gap`,
  `--mermaid-spinner-duration`, `--mermaid-notification-duration`,
  `--mermaid-error-bg`, `--mermaid-error-border`, and `--mermaid-error-text`.
  All hardcoded colour, spacing, and timing values in `style.css` now use these
  variables with fallbacks to the VitePress `--vp-c-*` tokens, allowing theme
  customisation without overriding the entire stylesheet.
- **Dialog backdrop progressive enhancement** — `.mermaid-dialog-backdrop` now
  uses `rgba(0,0,0,0.5)` as a solid fallback; `backdrop-filter: blur(4px)` is
  applied only in browsers that support it via `@supports`, fixing the invisible
  backdrop in Firefox and older browsers.
- **Configurable zoom limits** — `MIN_SCALE` (0.2), `MAX_SCALE` (10), and
  `ZOOM_STEP` (1.2) are now configurable via the `MermaidNavigationOptions`
  parameter of `useMermaidNavigation()`, enabling accessibility and
  diagram-specific customisation.

### Added

- **Security section in README** — documents the `securityLevel` setting, its
  impact on inline HTML, and when to use `'loose'` vs `'strict'`.
- **`MermaidRenderer.resetInstance()` + `destroy()`** — static `resetInstance()`
  method and private `destroy()` for proper cleanup of observers, timers, DOM
  references, and event listeners (including `popstate` and
  `vitepress:routeChanged`). Useful in test teardown and SPA route transitions.
- **`useMermaidDownload` composable** — extracted the download logic (SVG / PNG
  / JPEG export) from `MermaidDiagram.vue` into a dedicated composable for
  better testability and separation of concerns.
- **Accessibility improvements**:
  - `role="img"` and `aria-label` on the diagram wrapper so screen readers
    announce the diagram purpose.
  - Keyboard navigation: `+`/`-` for zoom, `0` for reset, arrow keys for pan,
    `f` for fullscreen — all when the diagram wrapper has focus
    (`tabindex="0"`).
  - `role="status"` + `aria-live="polite"` on a visually-hidden element that
    announces "Loading diagram…" and "Diagram loaded" states.
  - `role="alert"` on the error container (`MermaidError.vue`) so screen readers
    immediately announce rendering failures.
  - `.sr-only` utility class in `style.css` for visually-hidden but
    screen-reader-accessible content.
- **`_resetFullscreenManager()`** — internal test helper for resetting the
  singleton fullscreen manager state between test runs.
- **`resetRenderPipeline()`** — exported from `useMermaidRenderer` so that
  `MermaidRenderer.handleRouteChange()` can reset the global promise chain,
  preventing stale promise accumulation across SPA route changes.
- **`prefers-reduced-motion` support** — animations and transitions are disabled
  via `@media (prefers-reduced-motion: reduce)` for users who have requested
  reduced motion in their OS settings.
- **Error message i18n** — `MermaidError.vue` now accepts `errorText`,
  `showDetailsText`, and `hideDetailsText` props that flow from the toolbar i18n
  system (`resolvedToolbar.i18n.tooltips`), enabling localised error messages
  and toggle button text.
- **CSS design tokens** — see "Changed" section above for the full list of new
  custom properties.

### Fixed

- **Memory leak: event listeners not cleaned up** — `popstate` and
  `vitepress:routeChanged` listeners added in `MermaidRenderer.initialize()` are
  now properly removed in `destroy()`.
- **Memory leak: retry setTimeout not cleared on unmount** — the 1-second retry
  timeout in `useMermaidRenderer` is now tracked and cleared in `onUnmounted`,
  preventing callbacks on unmounted components.
- **`NodeJS.Timeout` type in browser code** — replaced with
  `ReturnType<typeof setTimeout>` so the correct `number` type is used in
  browser bundles (previously masked by `skipLibCheck`).

### Removed

- Unused `createApp` import from `MermaidRenderer.ts`.
- Unused `DownloadFormat` type import from `MermaidDiagram.vue`.

## 1.1.24

- fix: remove line numbers from Mermaid code blocks when VitePress
  `markdown.lineNumbers` is enabled

## 1.1.23

- feat(i18n): add localized success message for copy action in toolbar

## 1.1.22

- feat(navigation): implement fullscreen state restoration and add tests for
  fullscreen behavior
- feat(toolbar): add VitePress locale-aware toolbar tooltips with per-locale
  fallback resolution and live updates for mounted diagrams
- test(toolbar): cover localized tooltip resolution, renderer dispatch behavior,
  component updates, and multilingual selectors
- docs(toolbar): document the new `i18n` toolbar option in the README and guide
  pages

## 1.1.20

use terser for aggressive minification and create a release profile that
combines build and release processes into a single command. Streamline the build
process by eliminating the separate build:release command and ensuring that the
build command directly applies release optimizations.

## 1.1.19

### Added in 1.1.19

- **Improved API Documentation**: Added comprehensive JSDoc coverage for the
  main entrypoint, toolbar utilities, and style manager to improve editor hints
  and package discoverability.
- **Expanded CSS Module Typings**: Added inline CSS module declarations so
  TypeScript correctly understands `?inline` style imports used by the package.

### Changed in 1.1.19

- **Toolbar Type Safety**: Refined toolbar configuration typing with stronger
  type guards and resolved configuration types for a safer developer experience.
- **Renderer and Component Documentation**: Expanded internal documentation
  across renderer, composables, and Vue components to make the codebase easier
  to maintain.
- **Documentation Package References**: Updated README and documentation
  configuration links to use `npx.dev` package references.
- **Example Project Dependencies**: Refreshed the documentation and test project
  package versions to align with the `1.1.19` release.

## 1.1.14

### Added in 1.1.14

- **Configurable Fullscreen Behavior**: Added `fullscreenMode` to toolbar
  configuration with `"browser"` (default) and `"dialog"` options.
- **Manual Release Workflow**: Added a dedicated manual release flow using
  `workflow_dispatch` that reads version from `package.json`, creates/pushes
  `v<version>` tag, publishes to npm with provenance, and creates a GitHub
  release.
- **Release Badges**: Added npm version/download, release workflow, and
  provenance badges to `README.md`.

### Changed in 1.1.14

- **Dialog Fullscreen Layout**: Reworked dialog fullscreen layout to be centered
  and constrained for a cleaner modal-like experience on desktop and mobile.
- **Theme Alignment for Copy Feedback**: Updated the `Copied` notification to
  use VitePress theme variables (`var(--vp-c-bg)` and `var(--vp-c-text-1)`).
- **Fullscreen Backdrop Styling**: Updated fullscreen/dialog backdrop styling to
  better match VitePress theme colors.

### Fixed in 1.1.14

- **Dialog Background Experience**: Replaced the flat white/opaque backdrop feel
  with a translucent blurred backdrop using `backdrop-filter`, so underlying
  page content remains visible and softly blurred.

## 1.1.10

- **Updated Dependencies**: Updated dependencies to their latest versions.

## 1.1.9

- **Mobile Touch Interaction Improved**: On mobile screens, Mermaid diagrams now
  require a two-finger gesture for pinch-zoom and pan while not in fullscreen,
  allowing normal one-finger page scrolling.
- **Fullscreen Behavior Preserved**: In fullscreen mode, touch navigation
  continues to work normally so users can freely interact with the diagram.

## 1.1.8

- **Updated Dependencies**: Updated dependencies to their latest versions.
- **Added Documentation Project to Repo**: Added a dedicated documentation
  project within the repository to provide comprehensive guides and examples for
  users.

## 1.1.6

- **Updated Dependencies**: Updated dependencies to their latest versions.
- **Download Diagrams**: Users can now download diagrams directly from the
  toolbar.
- **New Toolbar Button**: Added a `download` button to the toolbar (disabled by
  default). Enable it via
  `setToolbar({ desktop: { buttons: { download: 'enabled' } } })`.
- **Export Formats**: Support for `svg`, `png`, and `jpg` formats. Configure the
  preferred format using the new `downloadFormat` option in
  `MermaidToolbarOptions` (default: `"svg"`).

## 1.1.5

### Basic in 1.1.5

- No more manual `import "vitepress-mermaid-renderer/dist/style.css"`; styles
  are injected automatically when the renderer boots.
- `setToolbar()` lets you toggle every button per mode, move the toolbar to any
  corner, decide whether the zoom percentage stays visible, and hide the
  built-in VitePress language badge when you prefer a cleaner frame.
- Mobile gained optional `zoomIn`/`zoomOut` buttons (disabled by default) so
  touch users can zoom without relying on gestures, and the toolbar now
  disappears entirely when all controls are off.
- Tooling has been refreshed (Vite, Vue, lockfiles, etc.) to match the latest
  VitePress ecosystem.

### Added in 1.1.5

- Introduced a dedicated `toolbar.ts` module that models all toolbar controls,
  resolves per-mode overrides, and adds the new `showLanguageLabel` flag plus
  opt-in mobile `zoomIn`/`zoomOut` buttons.
- Exposed `MermaidRenderer#setToolbar()` and plumbed toolbar data through
  `<MermaidDiagram>` and `<MermaidControls>`, enabling consumers to fully
  customize button states, placement, zoom readouts, and whether the original
  VitePress language badge should remain.
- Added a `styleManager` that injects the package CSS exactly once on the client
  and declared `*.css?inline` modules so TypeScript understands the new import
  pattern.

### Changed in 1.1.5

- `MermaidRenderer` now initializes itself on construction, listens for DOM
  readiness, and uses a scoped `MutationObserver` plus exponential backoff
  retries to re-render diagrams after VitePress navigations or late content
  loads. Manual `initialize()`/`renderMermaidDiagrams()` calls are no longer
  needed.
- Wrapper cleanup now strips VitePress’ default “mermaid” corner label when
  `showLanguageLabel` is disabled, preventing duplicate badges inside the
  rendered container.
- `<MermaidControls>` renders desktop/mobile toolbars conditionally, applies
  per-mode position classes, and respects the resolved button states (including
  the newly optional mobile zoom controls) so unused chrome never appears.
- `<MermaidDiagram>` centralizes all mouse/touch handlers, manages fullscreen
  against the outer container, and resolves incoming toolbar props before
  passing them down to the controls.
- Package entrypoint immediately injects styles, exports `createMermaidRenderer`
  (also as the default export), and drops the SSR no-op shim plus the previous
  component/composable re-exports so no unnecessary modules are importable from
  the package root anymore.
- Internal helpers that callers never needed (e.g., manual `initialize()` or
  `setConfig()` handles) are now private behind `createMermaidRenderer`,
  reducing the accidental public API surface.
- Core renderer and toolbar functions now carry JSDoc comments so
  TypeScript-aware editors surface clearer intellisense and usage hints.
- Documentation now highlights Bun installation, updates the quick-start snippet
  for the new API, and ships a concise toolbar option table so every toggleable
  control is discoverable at a glance.
- The example VitePress theme config configures the toolbar (including hiding
  the language label) and no longer calls `initialize()` manually; the bundled
  test project consumes the freshly packed `1.0.20` tarball.
- Updated CSS to support per-corner positioning classes, fullscreen transitions
  tied to the container, and better spacing for the zoom readout in mobile
  layouts.
- Bumped dev dependencies (e.g., `vite@7.2.1`, `vue@3.5.23`) and refreshed both
  lockfiles to pick up the latest patches.

### Fixed in 1.1.5

- Added guards that prevent re-render attempts from looping on already-processed
  nodes by ignoring existing `.mermaid-wrapper` roots and batching mutation
  callbacks.
- Ensured the mobile toolbar hides entirely when every control is disabled,
  eliminating empty floating containers.
