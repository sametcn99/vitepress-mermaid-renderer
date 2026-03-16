/**
 * @module useMermaidRenderer
 *
 * Vue 3 composable that handles the **Mermaid rendering lifecycle** for
 * a single diagram: library initialisation, diagram rendering with
 * retry support, SVG sizing adjustments, error handling, and config
 * hot-reloading.
 *
 * Consumed by `MermaidDiagram.vue` which pairs this composable with
 * {@link useMermaidNavigation} to create a fully interactive diagram.
 *
 * **Rendering pipeline:**
 * A global promise chain (`renderPipeline`) serialises all `mermaid.run()`
 * calls across every diagram instance on the page to prevent concurrent
 * Mermaid renders that can corrupt the global state.
 *
 * @example
 * ```ts
 * import { useMermaidRenderer } from "./composables/useMermaidRenderer";
 *
 * const { mounted, isRendered, renderError, renderMermaidDiagram, detectDiagramType }
 *   = useMermaidRenderer({ config: { theme: "dark" } });
 * ```
 *
 * @see {@link useMermaidNavigation} for the navigation counterpart.
 * @see {@link MermaidDiagram}    for the consuming component.
 */
import { ref, onMounted, onUnmounted, nextTick, type Ref } from "vue";
import mermaid, { type MermaidConfig } from "mermaid";

/**
 * Global promise chain that serialises all `mermaid.run()` invocations
 * across every `useMermaidRenderer` instance on the page.
 *
 * Each call to {@link enqueueMermaidRender} appends a new task to this
 * chain. Because the chain always resolves (`.catch(() => {})` between
 * tasks), a failure in one diagram does not block subsequent ones.
 */
let renderPipeline: Promise<void> = Promise.resolve();

/**
 * Appends a rendering task to the global {@link renderPipeline} chain.
 *
 * This ensures that only one `mermaid.run()` call executes at any given
 * time, preventing the Mermaid library’s internal DOM ID counter from
 * producing duplicate ids when multiple diagrams initialise in parallel.
 *
 * @param task - An async function that performs a single diagram render.
 * @returns A promise that resolves (or rejects) when *this* task
 *   completes, regardless of earlier tasks’ outcomes.
 *
 * @example
 * ```ts
 * await enqueueMermaidRender(async () => {
 *   await mermaid.run({ nodes: [element] });
 * });
 * ```
 */
const enqueueMermaidRender = (task: () => Promise<void>): Promise<void> => {
  const nextTask = renderPipeline.catch(() => {}).then(() => task());
  renderPipeline = nextTask.catch(() => {});
  return nextTask;
};

/**
 * Reactive state exposed by the {@link useMermaidRenderer} composable.
 *
 * All values are Vue `Ref` objects that components can bind to in
 * templates for conditional rendering (e.g. showing a spinner while
 * `isRendered` is `false`, or displaying an error via `MermaidError`).
 */
export interface MermaidRendererState {
  /** `true` once the component is mounted in the DOM (client-side only). */
  mounted: Ref<boolean>;
  /** `true` after `mermaid.run()` completes — even if rendering failed. */
  isRendered: Ref<boolean>;
  /** `true` when the most recent render attempt threw an error. */
  renderError: Ref<boolean>;
  /** Human-readable error string from the last failed render. */
  renderErrorDetails: Ref<string>;
  /** Width / height of the rendered SVG before any user zoom is applied. */
  originalDiagramSize: Ref<{ width: number; height: number }>;
}

/**
 * Action callbacks exposed by the {@link useMermaidRenderer} composable.
 */
export interface MermaidRendererActions {
  /**
   * Renders a Mermaid diagram into the DOM element identified by `id`.
   *
   * @param id - The DOM id of the target container element.
   * @param code - Raw Mermaid source code to render.
   * @param retryCount - Current retry attempt (starts at 0).
   * @param maxRetries - Maximum retries before giving up.
   */
  renderMermaidDiagram: (
    id: string,
    code: string,
    retryCount?: number,
    maxRetries?: number,
  ) => Promise<void>;
  /**
   * Inspects the leading keyword of a Mermaid source string to determine
   * the diagram type (e.g. `"flowchart"`, `"sequence"`, `"gantt"`).
   *
   * @param code - Raw Mermaid source code.
   * @returns A lowercase diagram type identifier, or `"unknown"`.
   */
  detectDiagramType: (code: string) => string;
}

/**
 * Options accepted by the {@link useMermaidRenderer} composable.
 */
export interface MermaidRendererOptions {
  /** Optional Mermaid configuration merged into the defaults. */
  config?: MermaidConfig;
  /**
   * Callback invoked after each render attempt (success or failure).
   * Used by `MermaidDiagram.vue` to emit the `renderComplete` event.
   */
  onRenderComplete?: (payload: {
    id: string;
    success: boolean;
    error?: unknown;
  }) => void;
}

/**
 * Creates reactive state and action callbacks for rendering a single
 * Mermaid diagram.
 *
 * On mount, the composable initialises the Mermaid library with merged
 * defaults and registers a listener for the
 * `vitepress-mermaid:config-updated` custom event so that runtime
 * config changes (e.g. theme switch) automatically re-render the
 * diagram.
 *
 * @param options - Optional configuration and callbacks.
 * @returns A merged object of {@link MermaidRendererState} and
 *   {@link MermaidRendererActions}.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMermaidRenderer } from "./composables/useMermaidRenderer";
 *
 * const { mounted, isRendered, renderError, renderMermaidDiagram } =
 *   useMermaidRenderer({ config: { theme: "forest" } });
 * </script>
 * ```
 */
export function useMermaidRenderer(
  options: MermaidRendererOptions = {},
): MermaidRendererState & MermaidRendererActions {
  // State
  const mounted = ref(false);
  const isRendered = ref(false);
  const renderError = ref(false);
  const renderErrorDetails = ref("");
  const originalDiagramSize = ref({ width: 0, height: 0 });
  const lastRenderContext = ref<{ id: string; code: string } | null>(null);

  /**
   * Sensible default Mermaid configuration used as the base layer.
   *
   * Consumer-provided options (via `options.config`) are shallow-merged
   * on top of these defaults, and runtime config updates received
   * through the `vitepress-mermaid:config-updated` event are merged
   * last.
   *
   * Notable defaults:
   * - `startOnLoad: false` — rendering is controlled explicitly.
   * - `securityLevel: "loose"` — allows inline HTML in diagrams.
   * - `useMaxWidth: false` on most diagram types to enable natural
   *   sizing and user-controlled zooming.
   */
  const defaultConfig: MermaidConfig = {
    theme: "default",
    securityLevel: "loose",
    startOnLoad: false,
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      bottomMarginAdj: 1,
      useMaxWidth: false,
      rightAngles: false,
      showSequenceNumbers: false,
    },
    gantt: {
      useMaxWidth: false,
      topPadding: 50,
      leftPadding: 50,
      rightPadding: 50,
      gridLineStartPadding: 35,
      barHeight: 50,
      barGap: 40,
      displayMode: "compact",
      axisFormat: "%Y-%m-%d",
      topAxis: false,
      tickInterval: "day",
      useWidth: 2048,
    },
    class: {
      arrowMarkerAbsolute: false,
      useMaxWidth: false,
    },
    journey: {
      useMaxWidth: false,
    },
    pie: {},
    c4: {
      useMaxWidth: false,
      diagramMarginX: 20,
      diagramMarginY: 20,
    },
    gitGraph: {
      useMaxWidth: false,
      rotateCommitLabel: false,
      showBranches: true,
      showCommitLabel: true,
      mainBranchName: "main",
    },
  };

  /**
   * Initialises the Mermaid library by merging the default config,
   * the consumer-provided config, and any optional override into
   * a single configuration object passed to `mermaid.initialize()`.
   *
   * @param overrideConfig - Optional additional overrides, typically
   *   received from the `vitepress-mermaid:config-updated` event.
   */
  const initializeMermaid = (overrideConfig?: MermaidConfig) => {
    const mergedConfig = {
      ...defaultConfig,
      ...options.config,
      ...overrideConfig,
    };

    mermaid.initialize({
      ...mergedConfig,
    });
  };

  /**
   * Listener for the `vitepress-mermaid:config-updated` custom event.
   *
   * When the global Mermaid configuration is changed at runtime (e.g.
   * via `MermaidRenderer.setConfig()`), this handler re-initialises
   * the library and re-renders the current diagram so that the new
   * settings take effect immediately.
   *
   * @param event - The custom event carrying the updated config in `detail`.
   */
  const handleConfigUpdated = (event: Event) => {
    const customEvent = event as CustomEvent<MermaidConfig | undefined>;
    initializeMermaid(customEvent.detail);

    const context = lastRenderContext.value;
    if (!context) return;

    isRendered.value = false;

    nextTick(() => {
      void renderMermaidDiagram(context.id, context.code);
    });
  };

  /**
   * Inspects the leading keyword(s) of a Mermaid source string to
   * determine the diagram type.
   *
   * The detected type is used to apply diagram-specific CSS classes
   * and SVG sizing adjustments (e.g. C4 and GitGraph diagrams are
   * forced to `width: 100%`).
   *
   * @param code - Raw Mermaid source code.
   * @returns A lowercase identifier such as `"flowchart"`, `"sequence"`,
   *   `"gantt"`, `"c4"`, `"gitgraph"`, or `"unknown"`.
   *
   * @example
   * ```ts
   * detectDiagramType("flowchart LR\n  A --> B"); // "flowchart"
   * detectDiagramType("gantt\n  title A Gantt");   // "gantt"
   * detectDiagramType("pie title Pets");            // "unknown"
   * ```
   */
  const detectDiagramType = (code: string): string => {
    const trimmedCode = code.trim().toLowerCase();

    if (
      trimmedCode.startsWith("c4context") ||
      trimmedCode.startsWith("c4container") ||
      trimmedCode.startsWith("c4component") ||
      trimmedCode.startsWith("c4dynamic") ||
      trimmedCode.startsWith("c4deployment")
    ) {
      return "c4";
    }

    if (
      trimmedCode.startsWith("gitgraph") ||
      trimmedCode.includes("gitgraph:")
    ) {
      return "gitgraph";
    }

    if (
      trimmedCode.startsWith("flowchart") ||
      trimmedCode.startsWith("graph")
    ) {
      return "flowchart";
    }

    if (
      trimmedCode.startsWith("sequencediagram") ||
      trimmedCode.startsWith("sequenceDiagram")
    ) {
      return "sequence";
    }

    if (trimmedCode.startsWith("gantt")) {
      return "gantt";
    }

    return "unknown";
  };

  /**
   * Renders a Mermaid diagram into the DOM element identified by `id`.
   *
   * The function includes a retry mechanism with exponential backoff
   * to accommodate elements that may not be present in the DOM
   * immediately (e.g. during async component mounting or hydration).
   *
   * **Post-render adjustments** for C4 and GitGraph diagrams:
   * - SVG `width` / `height` attributes are removed.
   * - `viewBox` and `preserveAspectRatio` are added for responsive sizing.
   * - A reflow is forced to ensure correct layout.
   *
   * On failure, a production-environment retry is attempted once after
   * 1 second. The error state is stored in the reactive refs
   * (`renderError`, `renderErrorDetails`) and the
   * `onRenderComplete` callback is invoked.
   *
   * @param id - The DOM id of the container element.
   * @param code - Raw Mermaid source code.
   * @param retryCount - Current retry iteration (default `0`).
   * @param maxRetries - Maximum retries before giving up (default `3`).
   */
  const renderMermaidDiagram = async (
    id: string,
    code: string,
    retryCount = 0,
    maxRetries = 3,
  ): Promise<void> => {
    try {
      let element = document.getElementById(id);
      if (!element) {
        console.warn(
          `[Mermaid] Diagram container element not found, attempt ${retryCount + 1}/${maxRetries + 1}`,
        );
        if (retryCount < maxRetries) {
          // Add a progressive delay before retrying
          const delay = 100 * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return renderMermaidDiagram(id, code, retryCount + 1, maxRetries);
        }
        throw new Error("Failed to find diagram container element");
      }

      lastRenderContext.value = { id, code };

      element.textContent = code;
      element.removeAttribute("data-processed");
      renderError.value = false;
      renderErrorDetails.value = "";
      isRendered.value = false;

      // Add a class to indicate rendering is in progress
      element.classList.add("mermaid-rendering");

      await enqueueMermaidRender(async () => {
        const isProduction = typeof window !== "undefined";

        try {
          await mermaid.run({
            nodes: [element],
            suppressErrors: false,
          });

          // Add a longer delay for production environments
          await new Promise((resolve) =>
            setTimeout(resolve, isProduction ? 150 : 50),
          );

          // Store original diagram size and apply container size adjustments
          if (element.firstElementChild) {
            const svgElement = element.querySelector("svg");
            if (svgElement) {
              // Wait for SVG to be fully rendered, longer in production
              await new Promise((resolve) =>
                setTimeout(resolve, isProduction ? 150 : 50),
              );

              // Get the container dimensions
              const containerElement =
                element.parentElement?.querySelector(".diagram-wrapper");
              if (containerElement) {
                // Apply container-based sizing for C4 and GitGraph diagrams
                const diagramType = detectDiagramType(code);

                // Add diagram type class to the element for CSS targeting
                element.classList.add(`mermaid-${diagramType}`);

                if (diagramType === "c4" || diagramType === "gitgraph") {
                  // For C4 and GitGraph, ensure they use the full container width
                  svgElement.style.width = "100%";
                  svgElement.style.height = "auto";
                  svgElement.style.maxWidth = "100%";
                  svgElement.style.display = "block";

                  // Remove any fixed width/height attributes that might constrain the diagram
                  svgElement.removeAttribute("width");
                  svgElement.removeAttribute("height");

                  // Set viewBox to maintain aspect ratio if not already set
                  if (!svgElement.getAttribute("viewBox")) {
                    try {
                      const bbox = svgElement.getBBox();
                      if (bbox.width && bbox.height) {
                        svgElement.setAttribute(
                          "viewBox",
                          `0 0 ${bbox.width} ${bbox.height}`,
                        );
                        svgElement.setAttribute(
                          "preserveAspectRatio",
                          "xMidYMid meet",
                        );
                      }
                    } catch (error) {
                      console.warn("Could not set viewBox for diagram:", error);
                    }
                  }

                  // Force a reflow to ensure proper sizing
                  svgElement.style.display = "none";
                  (svgElement as any).offsetHeight; // Trigger reflow
                  svgElement.style.display = "block";
                }
              }

              originalDiagramSize.value = {
                width: svgElement.getBoundingClientRect().width,
                height: svgElement.getBoundingClientRect().height,
              };
            }
          }

          isRendered.value = true;
          renderError.value = false;

          // Emit an event when rendering is complete
          options.onRenderComplete?.({ id, success: true });
        } catch (error) {
          console.error("Failed to render mermaid diagram:", error);
          renderError.value = true;
          renderErrorDetails.value =
            error instanceof Error
              ? error.toString()
              : "Unknown error rendering diagram";

          // Still mark as rendered to display the error message
          isRendered.value = true;

          // Emit error event
          options.onRenderComplete?.({ id, success: false, error });

          if (isProduction && retryCount === 0) {
            setTimeout(() => {
              void renderMermaidDiagram(id, code, retryCount + 1, maxRetries);
            }, 1000);
          }
        } finally {
          element.classList.remove("mermaid-rendering");
        }
      });
    } catch (error) {
      console.error("Error in diagram initialization:", error);
      renderError.value = true;
      renderErrorDetails.value =
        error instanceof Error
          ? error.toString()
          : "Unknown error initializing component";

      // Emit error event
      options.onRenderComplete?.({ id, success: false, error });
    }
  };

  // Initialize mermaid with default or provided config
  onMounted(() => {
    // Set mounted to true only in client environment
    mounted.value = true;

    initializeMermaid();
    document.addEventListener(
      "vitepress-mermaid:config-updated",
      handleConfigUpdated,
    );
  });

  onUnmounted(() => {
    document.removeEventListener(
      "vitepress-mermaid:config-updated",
      handleConfigUpdated,
    );
  });

  return {
    // State
    mounted,
    isRendered,
    renderError,
    renderErrorDetails,
    originalDiagramSize,

    // Actions
    renderMermaidDiagram,
    detectDiagramType,
  };
}
