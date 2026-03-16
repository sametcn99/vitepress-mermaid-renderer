/**
 * @module index
 *
 * Public entry-point of the **vitepress-mermaid-renderer** library.
 *
 * Consumers import the {@link createMermaidRenderer} factory from this module
 * to set up Mermaid diagram rendering inside their VitePress `enhanceApp` hook.
 *
 * The module performs two side-effects at load time when running in a browser:
 * 1. Detects whether the current environment has `window` and `document`
 *    (i.e. not an SSR / Node.js context).
 * 2. Injects the library’s CSS stylesheet into the `<head>` via
 *    {@link ensureStylesInjected}.
 *
 * In a server-side rendering context, `createMermaidRenderer` returns a
 * lightweight no-op stub so that calling code does not need environment
 * guards.
 *
 * @example
 * ```ts
 * // .vitepress/theme/index.ts
 * import { createMermaidRenderer } from "vitepress-mermaid-renderer";
 *
 * export default {
 *   enhanceApp() {
 *     const renderer = createMermaidRenderer({ theme: "dark" });
 *     renderer.setToolbar({ desktop: { download: "enabled" } });
 *   },
 * };
 * ```
 *
 * @see {@link MermaidRenderer} for the singleton orchestrator.
 * @see {@link ensureStylesInjected} for the CSS injection logic.
 */
import { MermaidRenderer } from "./MermaidRenderer";
import { ensureStylesInjected } from "./styleManager";
import type { MermaidConfig } from "mermaid";

/**
 * `true` when the code is running in a browser context with access to
 * `window` and `document`. Used to guard DOM-dependent operations and
 * to decide whether the real renderer or the {@link noopRenderer} stub
 * should be returned.
 */
const isClientEnvironment =
  typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Lightweight stand-in for {@link MermaidRenderer} used when the library
 * is imported during SSR (server-side rendering). Every method is a no-op
 * so that consuming code can call `renderer.setToolbar(...)` without
 * error even on the server.
 */
const noopRenderer = {
  setToolbar: () => {},
};

if (isClientEnvironment) {
  ensureStylesInjected();
}

/**
 * Factory function that returns the shared {@link MermaidRenderer} singleton
 * in browser environments, or a no-op stub during SSR.
 *
 * On the **first** call in a browser context, the singleton is created and
 * the full rendering lifecycle (DOM observation, route listeners, retry
 * loop) is initialised.
 *
 * On **subsequent** calls the existing instance is returned, and any
 * provided `config` is merged into the active Mermaid settings via
 * {@link MermaidRenderer.getInstance}.
 *
 * @param config - Optional partial Mermaid configuration. Merged into the
 *   running config whenever the singleton already exists.
 * @returns The shared {@link MermaidRenderer} instance (browser) or a
 *   no-op stub (SSR).
 *
 * @example
 * ```ts
 * import { createMermaidRenderer } from "vitepress-mermaid-renderer";
 *
 * // Basic usage – defaults
 * const renderer = createMermaidRenderer();
 *
 * // With custom Mermaid config
 * const renderer = createMermaidRenderer({
 *   theme: "forest",
 *   securityLevel: "strict",
 * });
 * ```
 *
 * @see {@link MermaidRenderer.getInstance}
 */
const createMermaidRenderer = (config?: MermaidConfig) => {
  if (!isClientEnvironment) {
    return noopRenderer as unknown as MermaidRenderer;
  }
  return MermaidRenderer.getInstance(config);
};

export { createMermaidRenderer };
