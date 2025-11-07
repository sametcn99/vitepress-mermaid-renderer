import { MermaidRenderer } from "./MermaidRenderer";
import { ensureStylesInjected } from "./styleManager";
import type { MermaidConfig } from "mermaid";

ensureStylesInjected();

/**
 * Creates a reusable `MermaidRenderer` singleton that can be shared across
 * Vue components, ensuring Mermaid gets initialized only once per app.
 *
 * @param config Optional Mermaid configuration object that will be merged
 *               into the underlying instance on first creation.
 * @returns The shared `MermaidRenderer` instance ready to render diagrams.
 */
const createMermaidRenderer = (config?: MermaidConfig) => {
  return MermaidRenderer.getInstance(config);
};

export { createMermaidRenderer };
