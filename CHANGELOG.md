# Changelog

## 1.1.4

### Basic

- No more manual `import "vitepress-mermaid-renderer/dist/style.css"`; styles are injected automatically when the renderer boots.
- `setToolbar()` lets you toggle every button per mode, move the toolbar to any corner, decide whether the zoom percentage stays visible, and hide the built-in VitePress language badge when you prefer a cleaner frame.
- Mobile gained optional `zoomIn`/`zoomOut` buttons (disabled by default) so touch users can zoom without relying on gestures, and the toolbar now disappears entirely when all controls are off.
- Tooling has been refreshed (Vite, Vue, lockfiles, etc.) to match the latest VitePress ecosystem.

### Added

- Introduced a dedicated `toolbar.ts` module that models all toolbar controls, resolves per-mode overrides, and adds the new `showLanguageLabel` flag plus opt-in mobile `zoomIn`/`zoomOut` buttons.
- Exposed `MermaidRenderer#setToolbar()` and plumbed toolbar data through `<MermaidDiagram>` and `<MermaidControls>`, enabling consumers to fully customize button states, placement, zoom readouts, and whether the original VitePress language badge should remain.
- Added a `styleManager` that injects the package CSS exactly once on the client and declared `*.css?inline` modules so TypeScript understands the new import pattern.

### Changed

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

### Fixed

- Added guards that prevent re-render attempts from looping on already-processed nodes by ignoring existing `.mermaid-wrapper` roots and batching mutation callbacks.
- Ensured the mobile toolbar hides entirely when every control is disabled, eliminating empty floating containers.
