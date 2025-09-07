import { MermaidRenderer } from "./MermaidRenderer";
import type { MermaidConfig } from "mermaid";

// Check if we're in a browser environment
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

// Create a safe export that won't run on the server
const createMermaidRenderer = (config?: MermaidConfig) => {
  if (!isBrowser) {
    return {
      initialize: () => {},
      renderMermaidDiagrams: () => false,
      getInstance: () => ({
        initialize: () => {},
        renderMermaidDiagrams: () => false,
      }),
    };
  }

  return MermaidRenderer.getInstance(config);
};

export { MermaidRenderer, createMermaidRenderer };

// Export modular components and composables
export {
  MermaidDiagram,
  MermaidControls,
  MermaidError,
  useMermaidNavigation,
  useMermaidRenderer,
} from "./components";

export type {
  MermaidNavigationState,
  MermaidNavigationActions,
  MermaidRendererState,
  MermaidRendererActions,
  MermaidRendererOptions,
} from "./components";

export default createMermaidRenderer;
