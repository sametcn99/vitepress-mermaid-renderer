# Changelog

## 1.1.22

- feat(navigation): implement fullscreen state restoration and add tests for fullscreen behavior
- feat(toolbar): add VitePress locale-aware toolbar tooltips with per-locale fallback resolution and live updates for mounted diagrams
- test(toolbar): cover localized tooltip resolution, renderer dispatch behavior, component updates, and multilingual selectors
- docs(toolbar): document the new `i18n` toolbar option in the README and guide pages

## 1.1.20

use terser for aggressive minification and create a release profile that combines build and release processes into a single command. Streamline the build process by eliminating the separate build:release command and ensuring that the build command directly applies release optimizations.

## 1.1.19

### Added in 1.1.19

- **Improved API Documentation**: Added comprehensive JSDoc coverage for the main entrypoint, toolbar utilities, and style manager to improve editor hints and package discoverability.
- **Expanded CSS Module Typings**: Added inline CSS module declarations so TypeScript correctly understands `?inline` style imports used by the package.

### Changed in 1.1.19

- **Toolbar Type Safety**: Refined toolbar configuration typing with stronger type guards and resolved configuration types for a safer developer experience.
- **Renderer and Component Documentation**: Expanded internal documentation across renderer, composables, and Vue components to make the codebase easier to maintain.
- **Documentation Package References**: Updated README and documentation configuration links to use `npx.dev` package references.
- **Example Project Dependencies**: Refreshed the documentation and test project package versions to align with the `1.1.19` release.

## 1.1.14

### Added in 1.1.14

- **Configurable Fullscreen Behavior**: Added `fullscreenMode` to toolbar configuration with `"browser"` (default) and `"dialog"` options.
- **Manual Release Workflow**: Added a dedicated manual release flow using `workflow_dispatch` that reads version from `package.json`, creates/pushes `v<version>` tag, publishes to npm with provenance, and creates a GitHub release.
- **Release Badges**: Added npm version/download, release workflow, and provenance badges to `README.md`.

### Changed in 1.1.14

- **Dialog Fullscreen Layout**: Reworked dialog fullscreen layout to be centered and constrained for a cleaner modal-like experience on desktop and mobile.
- **Theme Alignment for Copy Feedback**: Updated the `Copied` notification to use VitePress theme variables (`var(--vp-c-bg)` and `var(--vp-c-text-1)`).
- **Fullscreen Backdrop Styling**: Updated fullscreen/dialog backdrop styling to better match VitePress theme colors.

### Fixed in 1.1.14

- **Dialog Background Experience**: Replaced the flat white/opaque backdrop feel with a translucent blurred backdrop using `backdrop-filter`, so underlying page content remains visible and softly blurred.

## 1.1.10

- **Updated Dependencies**: Updated dependencies to their latest versions.

## 1.1.9

- **Mobile Touch Interaction Improved**: On mobile screens, Mermaid diagrams now require a two-finger gesture for pinch-zoom and pan while not in fullscreen, allowing normal one-finger page scrolling.
- **Fullscreen Behavior Preserved**: In fullscreen mode, touch navigation continues to work normally so users can freely interact with the diagram.

## 1.1.8

- **Updated Dependencies**: Updated dependencies to their latest versions.
- **Added Documentation Project to Repo**: Added a dedicated documentation project within the repository to provide comprehensive guides and examples for users.

## 1.1.6

- **Updated Dependencies**: Updated dependencies to their latest versions.
- **Download Diagrams**: Users can now download diagrams directly from the toolbar.
- **New Toolbar Button**: Added a `download` button to the toolbar (disabled by default). Enable it via `setToolbar({ desktop: { buttons: { download: 'enabled' } } })`.
- **Export Formats**: Support for `svg`, `png`, and `jpg` formats. Configure the preferred format using the new `downloadFormat` option in `MermaidToolbarOptions` (default: `"svg"`).

## 1.1.5

### Basic in 1.1.5

- No more manual `import "vitepress-mermaid-renderer/dist/style.css"`; styles are injected automatically when the renderer boots.
- `setToolbar()` lets you toggle every button per mode, move the toolbar to any corner, decide whether the zoom percentage stays visible, and hide the built-in VitePress language badge when you prefer a cleaner frame.
- Mobile gained optional `zoomIn`/`zoomOut` buttons (disabled by default) so touch users can zoom without relying on gestures, and the toolbar now disappears entirely when all controls are off.
- Tooling has been refreshed (Vite, Vue, lockfiles, etc.) to match the latest VitePress ecosystem.

### Added in 1.1.5

- Introduced a dedicated `toolbar.ts` module that models all toolbar controls, resolves per-mode overrides, and adds the new `showLanguageLabel` flag plus opt-in mobile `zoomIn`/`zoomOut` buttons.
- Exposed `MermaidRenderer#setToolbar()` and plumbed toolbar data through `<MermaidDiagram>` and `<MermaidControls>`, enabling consumers to fully customize button states, placement, zoom readouts, and whether the original VitePress language badge should remain.
- Added a `styleManager` that injects the package CSS exactly once on the client and declared `*.css?inline` modules so TypeScript understands the new import pattern.

### Changed in 1.1.5

- `MermaidRenderer` now initializes itself on construction, listens for DOM readiness, and uses a scoped `MutationObserver` plus exponential backoff retries to re-render diagrams after VitePress navigations or late content loads. Manual `initialize()`/`renderMermaidDiagrams()` calls are no longer needed.
- Wrapper cleanup now strips VitePress’ default “mermaid” corner label when `showLanguageLabel` is disabled, preventing duplicate badges inside the rendered container.
- `<MermaidControls>` renders desktop/mobile toolbars conditionally, applies per-mode position classes, and respects the resolved button states (including the newly optional mobile zoom controls) so unused chrome never appears.
- `<MermaidDiagram>` centralizes all mouse/touch handlers, manages fullscreen against the outer container, and resolves incoming toolbar props before passing them down to the controls.
- Package entrypoint immediately injects styles, exports `createMermaidRenderer` (also as the default export), and drops the SSR no-op shim plus the previous component/composable re-exports so no unnecessary modules are importable from the package root anymore.
- Internal helpers that callers never needed (e.g., manual `initialize()` or `setConfig()` handles) are now private behind `createMermaidRenderer`, reducing the accidental public API surface.
- Core renderer and toolbar functions now carry JSDoc comments so TypeScript-aware editors surface clearer intellisense and usage hints.
- Documentation now highlights Bun installation, updates the quick-start snippet for the new API, and ships a concise toolbar option table so every toggleable control is discoverable at a glance.
- The example VitePress theme config configures the toolbar (including hiding the language label) and no longer calls `initialize()` manually; the bundled test project consumes the freshly packed `1.0.20` tarball.
- Updated CSS to support per-corner positioning classes, fullscreen transitions tied to the container, and better spacing for the zoom readout in mobile layouts.
- Bumped dev dependencies (e.g., `vite@7.2.1`, `vue@3.5.23`) and refreshed both lockfiles to pick up the latest patches.

### Fixed in 1.1.5

- Added guards that prevent re-render attempts from looping on already-processed nodes by ignoring existing `.mermaid-wrapper` roots and batching mutation callbacks.
- Ensured the mobile toolbar hides entirely when every control is disabled, eliminating empty floating containers.
