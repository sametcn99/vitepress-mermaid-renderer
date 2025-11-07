import { MermaidRenderer } from "./MermaidRenderer";
import { ensureStylesInjected } from "./styleManager";
import type { MermaidConfig } from "mermaid";

const isClientEnvironment =
  typeof window !== "undefined" && typeof document !== "undefined";
const noopRenderer = {
  setToolbar: () => {},
};

if (isClientEnvironment) {
  ensureStylesInjected();
}

/**
 * Creates a reusable `MermaidRenderer` singleton that can be shared across
 * Vue components, ensuring Mermaid gets initialized only once per app.
 *
 * @param config Optional Mermaid configuration object that will be merged
 *               into the underlying instance on first creation.
 * @returns The shared `MermaidRenderer` instance ready to render diagrams.
 */
const createMermaidRenderer = (config?: MermaidConfig) => {
  if (!isClientEnvironment) {
    return noopRenderer as unknown as MermaidRenderer;
  }
  return MermaidRenderer.getInstance(config);
};

export { createMermaidRenderer };
