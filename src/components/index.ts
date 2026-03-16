/**
 * @module components
 *
 * Barrel export file that provides a single import path for all public
 * components, composables, and type interfaces of the
 * **vitepress-mermaid-renderer** library.
 *
 * Consumers who need direct access to the inner modules (e.g. for custom
 * layouts or headless rendering) can import from here instead of the
 * top-level `createMermaidRenderer` factory.
 *
 * @example
 * ```ts
 * import {
 *   MermaidDiagram,
 *   MermaidControls,
 *   useMermaidNavigation,
 *   useMermaidRenderer,
 *   type MermaidNavigationState,
 * } from "vitepress-mermaid-renderer/components";
 * ```
 *
 * @see {@link MermaidDiagram}  — Main diagram component.
 * @see {@link MermaidControls} — Interactive toolbar UI.
 * @see {@link MermaidError}    — Error display component.
 */

// Main component
export { default as MermaidDiagram } from "../MermaidDiagram.vue";

// Sub-components
export { default as MermaidControls } from "./MermaidControls.vue";
export { default as MermaidError } from "./MermaidError.vue";

// Composables
export { useMermaidNavigation } from "../composables/useMermaidNavigation";
export { useMermaidRenderer } from "../composables/useMermaidRenderer";

// Types
export type {
  MermaidNavigationState,
  MermaidNavigationActions,
} from "../composables/useMermaidNavigation";

export type {
  MermaidRendererState,
  MermaidRendererActions,
  MermaidRendererOptions,
} from "../composables/useMermaidRenderer";
