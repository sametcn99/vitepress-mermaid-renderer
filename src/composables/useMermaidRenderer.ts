import { ref, onMounted, onUnmounted, nextTick, type Ref } from "vue";
import mermaid, { type MermaidConfig } from "mermaid";

let renderPipeline: Promise<void> = Promise.resolve();

const enqueueMermaidRender = (task: () => Promise<void>): Promise<void> => {
  const nextTask = renderPipeline.catch(() => {}).then(() => task());
  renderPipeline = nextTask.catch(() => {});
  return nextTask;
};

export interface MermaidRendererState {
  mounted: Ref<boolean>;
  isRendered: Ref<boolean>;
  renderError: Ref<boolean>;
  renderErrorDetails: Ref<string>;
  originalDiagramSize: Ref<{ width: number; height: number }>;
}

export interface MermaidRendererActions {
  renderMermaidDiagram: (
    id: string,
    code: string,
    retryCount?: number,
    maxRetries?: number,
  ) => Promise<void>;
  detectDiagramType: (code: string) => string;
}

export interface MermaidRendererOptions {
  config?: MermaidConfig;
  onRenderComplete?: (payload: {
    id: string;
    success: boolean;
    error?: unknown;
  }) => void;
}

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

  // Helper function to detect diagram type
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
