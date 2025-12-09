import { createApp, h } from "vue";
import MermaidDiagram from "./MermaidDiagram.vue";
import { MermaidConfig } from "mermaid";
import {
  resolveToolbarConfig,
  type MermaidToolbarOptions,
  type ResolvedToolbarConfig,
} from "./toolbar";

/**
 * Central orchestrator that discovers Mermaid code blocks inside VitePress pages,
 * mounts Vue-powered renderers for them, and retries rendering across hydration
 * boundaries, navigation events, and slower environments.
 */
export class MermaidRenderer {
  private static instance: MermaidRenderer;
  private config: MermaidConfig;
  private toolbarConfig: ResolvedToolbarConfig;
  private initialized = false;
  private renderAttempts = 0;
  private maxRenderAttempts = 15; // Increased to handle slower production environments
  private retryTimeout: NodeJS.Timeout | null = null;
  private renderQueue: HTMLPreElement[] = [];
  private isRendering = false;
  private initialPageRenderComplete = false;
  private hydrationComplete = false;
  private domContentLoaded = false;
  private windowLoaded = false;
  private mutationObserver: MutationObserver | null = null;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes the configuration and sets up the renderer environment.
   *
   * @param config - Optional initial Mermaid configuration.
   */
  private constructor(config?: MermaidConfig) {
    this.config = config ? { ...config } : {};
    this.toolbarConfig = resolveToolbarConfig();
    this.initialize();
  }

  /**
   * Returns the singleton renderer instance, creating it on first call and merging any
   * optional configuration overrides into the active Mermaid settings.
   * @param config Optional partial Mermaid configuration supplied by the caller.
   */
  public static getInstance(config?: MermaidConfig): MermaidRenderer {
    if (!MermaidRenderer.instance) {
      MermaidRenderer.instance = new MermaidRenderer(config);
    } else if (config) {
      MermaidRenderer.instance.setConfig(config);
    }
    return MermaidRenderer.instance;
  }

  /**
   * Merges the provided Mermaid options into the runtime config and notifies listeners so
   * already-mounted diagrams can react to the new settings.
   * @param config Partial Mermaid configuration object to merge.
   */
  private setConfig(config: MermaidConfig): void {
    this.config = { ...this.config, ...config };
    this.dispatchConfigUpdate();
  }

  /**
   * Resolves and stores toolbar options used by upcoming diagram mounts, falling back to
   * defaults when no explicit configuration is supplied.
   * @param toolbar Toolbar customization options, optional.
   */
  public setToolbar(toolbar?: MermaidToolbarOptions): void {
    this.toolbarConfig = resolveToolbarConfig(toolbar);
  }

  /**
   * Dispatches a custom event to notify other parts of the application
   * that the Mermaid configuration has been updated.
   *
   * @event vitepress-mermaid:config-updated
   */
  private dispatchConfigUpdate(): void {
    try {
      document.dispatchEvent(
        new CustomEvent<MermaidConfig>("vitepress-mermaid:config-updated", {
          detail: { ...this.config },
        }),
      );
    } catch (error) {
      console.error("Failed to dispatch Mermaid config update:", error);
    }
  }

  /**
   * Removes unnecessary UI elements (like copy buttons and language labels)
   * from the Mermaid wrapper element to prepare it for rendering.
   *
   * @param wrapper - The DOM element containing the Mermaid code block.
   */
  private cleanupMermaidWrapper(wrapper: Element): void {
    const button = wrapper.getElementsByClassName("copy");
    Array.from(button).forEach((element) => element.remove());

    if (!this.toolbarConfig.showLanguageLabel) {
      const languageLabels = wrapper.getElementsByClassName("lang");
      Array.from(languageLabels).forEach((element) => element.remove());
    }
  }

  /**
   * Creates a Virtual DOM node for the Mermaid diagram using Vue's `h` function.
   * Encapsulates the logic for creating the wrapper div and determining the component props.
   *
   * @param code - The Mermaid source code string to be rendered.
   * @returns An object containing the wrapper DOM element and the Vue component VNode, or null if creation fails.
   */
  private createMermaidComponent(code: string) {
    try {
      const wrapper = document.createElement("div");
      wrapper.id = `mermaid-wrapper-${Math.random().toString(36).slice(2)}`;
      wrapper.className = "mermaid-wrapper";
      return {
        wrapper,
        component: h(MermaidDiagram, {
          code,
          config: this.config,
          toolbar: this.toolbarConfig,
        }),
      };
    } catch (error) {
      console.error("Failed to create mermaid component:", error);
      return null;
    }
  }

  /**
   * Processes the next diagram in the rendering queue.
   * This method ensures diagrams are rendered sequentially to avoid race conditions
   * or heavy load spikes, and handles the completion of the initial page render.
   *
   * @returns A promise that resolves when the next diagram has been processed.
   */
  private async renderNextDiagram(): Promise<void> {
    if (this.renderQueue.length === 0 || this.isRendering) {
      return;
    }

    this.isRendering = true;
    const element = this.renderQueue.shift();

    if (element) {
      try {
        await this.renderMermaidDiagram(element);
      } catch (error) {
        console.error("Failed to render diagram:", error);
      }
    }

    this.isRendering = false;
    // Continue with next diagram if any
    if (this.renderQueue.length > 0) {
      await this.renderNextDiagram();
    } else if (!this.initialPageRenderComplete) {
      // Mark initial page rendering as complete
      this.initialPageRenderComplete = true;
      this.hydrationComplete = true;
    }
  }

  /**
   * Renders a single Mermaid diagram by replacing the original `<pre>` element
   * with a Vue-mounted component.
   *
   * @param element - The HTMLPreElement containing the Mermaid code.
   * @returns A promise that resolves when the diagram is successfully mounted and rendered.
   */
  private async renderMermaidDiagram(element: HTMLPreElement): Promise<void> {
    try {
      if (!element || !element.parentNode) return;
      const code = element.textContent?.trim() || "";
      const result = this.createMermaidComponent(code);
      if (!result) return;
      const { wrapper, component } = result;

      // Replace pre element with component
      element.parentNode.replaceChild(wrapper, element);

      // Mount the component and wait for it to render
      return new Promise<void>((resolve) => {
        createApp({
          render: () => component,
        }).mount(wrapper);

        // Give more time for the diagram to render in production environments
        setTimeout(resolve, 200);
      });
    } catch (error) {
      console.error("Failed to render mermaid diagram:", error);
    }
  }

  /**
   * Initializes the renderer lifecycle exactly once by wiring DOM readiness hooks,
   * VitePress navigation listeners, and the initial render/retry loop.
   */
  private initialize(): void {
    if (this.initialized) return;

    try {
      const initOnReady = (): void => {
        if (!document || !document.body) {
          console.warn(
            "MermaidRenderer initialization failed: document or body not available",
          );
          return;
        }

        // Ensure initialization runs after microtasks and DOM updates
        Promise.resolve().then(() => {
          // Use requestAnimationFrame for better timing with the browser's rendering cycle
          requestAnimationFrame(() => {
            try {
              this.setupDomMutationObserver();
              this.initializeRenderer();
            } catch (error) {
              console.error(
                "Failed to initialize MermaidRenderer:",
                error instanceof Error ? error.message : "Unknown error",
              );
            }
          });
        });
      };

      // Handle different document ready states
      switch (document.readyState) {
        case "loading":
          document.addEventListener("DOMContentLoaded", initOnReady, {
            once: true,
          });
          break;
        case "interactive":
        case "complete":
          initOnReady();
          break;
        default:
          console.warn(
            `MermaidRenderer: Unexpected document.readyState: ${document.readyState}`,
          );
          initOnReady();
      }

      // Set up route change listeners with error handling
      const handleRouteChangeWithErrorBoundary = () => {
        try {
          this.handleRouteChange();
        } catch (error) {
          console.error(
            "Error handling route change:",
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      };

      window.addEventListener("popstate", handleRouteChangeWithErrorBoundary);
      document.addEventListener(
        "vitepress:routeChanged",
        handleRouteChangeWithErrorBoundary,
      );

      // Listen for VitePress theme ready event
      document.addEventListener(
        "vitepress:ready",
        () => {
          this.renderWithRetry();
        },
        { once: true },
      );

      // Special handling for deployment
      if (typeof window !== "undefined") {
        setTimeout(() => {
          this.renderWithRetry();
        }, 500);
      }

      this.initialized = true;
    } catch (error) {
      console.error(
        "Critical error during MermaidRenderer initialization:",
        error instanceof Error ? error.message : "Unknown error",
      );
      // Avoid setting initialized flag if initialization fails
      throw error; // Re-throw to allow upstream error handling
    }
  }

  /**
   * Sets up a MutationObserver to detect dynamic changes in the DOM.
   * This is crucial for determining when new Mermaid blocks are added to the page,
   * for instance during client-side navigation or asynchronous content loading.
   */
  private setupDomMutationObserver(): void {
    if (
      typeof window === "undefined" ||
      typeof MutationObserver === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const target =
      document.getElementById("app") ||
      document.querySelector(".Layout") ||
      document.body;

    if (!target) return;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    let rerenderScheduled = false;
    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.hasNewMermaidNodes(mutations)) {
        return;
      }

      if (rerenderScheduled) {
        return;
      }

      rerenderScheduled = true;
      requestAnimationFrame(() => {
        rerenderScheduled = false;
        this.handleRouteChange();
      });
    });

    try {
      this.mutationObserver.observe(target, {
        childList: true,
        subtree: true,
      });
    } catch (error) {
      console.error("Failed to observe DOM mutations for Mermaid:", error);
    }
  }

  /**
   * Checks if any of the mutated nodes contain Mermaid code blocks.
   *
   * @param mutations - The list of MutationRecords from the MutationObserver.
   * @returns `true` if a relevant Mermaid node was added, `false` otherwise.
   */
  private hasNewMermaidNodes(mutations: MutationRecord[]): boolean {
    return mutations.some((mutation) =>
      Array.from(mutation.addedNodes).some((node) =>
        this.nodeContainsMermaidCode(node),
      ),
    );
  }

  /**
   * Recursively checks if a DOM node or its children contain a Mermaid code block.
   *
   * @param node - The DOM node to inspect.
   * @returns `true` if the node is or contains a Mermaid code element, `false` otherwise.
   */
  private nodeContainsMermaidCode(node: Node | null): boolean {
    if (!node) return false;

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      if (element.closest(".mermaid-wrapper")) {
        return false;
      }

      if (
        element.classList.contains("language-mermaid") ||
        element.matches?.("code.mermaid")
      ) {
        return true;
      }

      if (
        element.querySelector(
          ".language-mermaid, pre.language-mermaid, code.language-mermaid, code.mermaid",
        )
      ) {
        return true;
      }
    }

    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && node.hasChildNodes()) {
      return Array.from(node.childNodes).some((child) =>
        this.nodeContainsMermaidCode(child),
      );
    }

    return false;
  }

  /**
   * Resets the rendering state and initiates the render-retry loop.
   * Typically called on page load or after a significant DOM change.
   */
  private initializeRenderer(): void {
    this.renderAttempts = 0;
    this.initialPageRenderComplete = false;
    this.renderWithRetry();
  }

  /**
   * Handles route changes in the VitePress application.
   * Clears existing timeouts and resets the renderer to process diagrams on the new page.
   */
  private handleRouteChange(): void {
    // Reset attempts and start fresh on route change
    this.renderAttempts = 0;
    this.initialPageRenderComplete = false;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.renderWithRetry();
  }

  /**
   * Attempts to discover and render Mermaid diagrams.
   * If no diagrams are found initially, it uses an exponential backoff strategy
   * to retry, accommodating slower environments or delayed hydration.
   */
  private renderWithRetry(): void {
    // First attempt to render
    const diagramsFound = this.renderMermaidDiagrams();

    // If no diagrams found and we haven't exceeded max attempts, retry with exponential backoff
    if (!diagramsFound && this.renderAttempts < this.maxRenderAttempts) {
      // More aggressive retry strategy, starting with shorter intervals
      const backoffTime = Math.min(
        300 * Math.pow(1.4, this.renderAttempts),
        10000,
      ); // Max 10 seconds

      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }

      this.retryTimeout = setTimeout(() => {
        this.renderAttempts++;
        this.renderWithRetry();
      }, backoffTime);
    }
  }
  /**
   * Searches the document for Mermaid code blocks, cleans their wrappers, and pushes them
   * onto the rendering queue handled by the Vue-driven renderer.
   * @returns True if at least one diagram is discovered, otherwise false.
   */
  private renderMermaidDiagrams(): boolean {
    try {
      // First try to find diagrams using the standard class
      let mermaidWrappers = document.getElementsByClassName("language-mermaid");

      // If no diagrams found, try an alternative selector that might work in SSR context
      if (mermaidWrappers.length === 0) {
        const preElements = document.querySelectorAll("pre");
        const filteredElements = Array.from(preElements).filter((el) => {
          // Check if this pre element contains mermaid code
          const codeElement = el.querySelector("code");
          if (
            codeElement &&
            (codeElement.className.includes("mermaid") ||
              codeElement.className.includes("language-mermaid"))
          ) {
            return true;
          }
          return false;
        });

        if (filteredElements.length > 0) {
          // Create a proper array-like object that TypeScript can understand
          const customCollection: HTMLCollectionOf<Element> = {
            length: filteredElements.length,
            item(i: number) {
              return i >= 0 && i < filteredElements.length
                ? filteredElements[i]
                : null;
            },
            namedItem(name: string) {
              return null; // We don't support named items in our custom collection
            },
            // Implement Symbol.iterator using the array iterator to satisfy disposal typing
            [Symbol.iterator](): ArrayIterator<Element> {
              return filteredElements[Symbol.iterator]();
            },
            // Add indexed access
            ...filteredElements.reduce(
              (acc, el, i) => ({ ...acc, [i]: el }),
              {},
            ),
          };

          mermaidWrappers = customCollection;
        }
      }

      if (mermaidWrappers.length === 0) return false;

      // Cleanup wrappers
      Array.from(mermaidWrappers).forEach((wrapper) =>
        this.cleanupMermaidWrapper(wrapper),
      );

      // Get all diagram elements
      const mermaidElements = Array.from(mermaidWrappers)
        .map((wrapper) => {
          // Try to find pre element directly
          let preElement = wrapper.querySelector("pre");

          // If not found and the wrapper itself is a pre element, use it
          if (!preElement && wrapper.tagName.toLowerCase() === "pre") {
            preElement = wrapper as HTMLPreElement;
          }

          return preElement;
        })
        .filter(
          (element): element is HTMLPreElement =>
            element instanceof HTMLPreElement,
        );

      // Add diagrams to render queue
      if (mermaidElements.length > 0) {
        this.renderQueue.push(...mermaidElements);

        // Start rendering if not already in progress
        if (!this.isRendering) {
          this.renderNextDiagram();
        }
      }

      return mermaidElements.length > 0;
    } catch (error) {
      console.error("Error rendering Mermaid diagrams:", error);
      return false;
    }
  }
}
