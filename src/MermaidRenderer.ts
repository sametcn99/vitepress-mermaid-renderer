import { h } from "vue";
import { createApp } from "vue";
import MermaidDiagram from "./MermaidDiagram.vue";
import { MermaidConfig } from "mermaid";

// Enhanced browser detection
const isBrowser =
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof document.createElement === "function";

// Custom type for HTMLCollection-like objects
interface HTMLCollectionLike<T extends Element> {
  length: number;
  item(index: number): T;
  [index: number]: T;
  [Symbol.iterator](): IterableIterator<T>;
}

export class MermaidRenderer {
  private static instance: MermaidRenderer;
  private config: MermaidConfig;
  private observer: MutationObserver | null = null;
  private initialized = false;
  private renderAttempts = 0;
  private maxRenderAttempts = 15; // Increased to handle slower production environments
  private retryTimeout: NodeJS.Timeout | null = null;
  private isClient: boolean;
  private renderQueue: HTMLPreElement[] = [];
  private isRendering = false;
  private initialPageRenderComplete = false;
  private hydrationComplete = false;
  private domContentLoaded = false;
  private windowLoaded = false;

  private constructor(config?: MermaidConfig) {
    this.config = config || {};
    this.isClient = isBrowser;

    if (this.isClient) {
      this.setupMutationObserver();
      this.setupHydrationListeners();
    }
  }

  public static getInstance(config?: MermaidConfig): MermaidRenderer {
    if (!MermaidRenderer.instance) {
      MermaidRenderer.instance = new MermaidRenderer(config);
    } else if (config) {
      MermaidRenderer.instance.setConfig(config);
    }
    return MermaidRenderer.instance;
  }

  public setConfig(config: MermaidConfig): void {
    this.config = { ...this.config, ...config };
    this.dispatchConfigUpdate();
  }

  private dispatchConfigUpdate(): void {
    if (!this.isClient) return;

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

  private setupHydrationListeners(): void {
    if (!this.isClient) return;

    // Listen for DOMContentLoaded event
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          this.domContentLoaded = true;
          this.tryRender("DOMContentLoaded");
        },
        { once: true },
      );
    } else {
      this.domContentLoaded = true;
    }

    // Listen for window load event
    window.addEventListener(
      "load",
      () => {
        this.windowLoaded = true;
        this.tryRender("window.load");
      },
      { once: true },
    );

    // Additional safety - if all else fails, try rendering after a delay
    setTimeout(() => {
      if (!this.initialPageRenderComplete) {
        this.tryRender("safety-timeout");
      }
    }, 2000);
  }

  private tryRender(source: string): void {
    if (this.initialPageRenderComplete) return;

    this.renderWithRetry();
  }

  private setupMutationObserver(): void {
    if (!this.isClient) return;

    try {
      // Create a mutation observer to detect when content is added to the page
      this.observer = new MutationObserver((mutations) => {
        // Check if any mutations include additions to the DOM that might contain mermaid code blocks
        const shouldRender = mutations.some(
          (mutation) =>
            mutation.type === "childList" &&
            Array.from(mutation.addedNodes).some(
              (node) =>
                node.nodeType === Node.ELEMENT_NODE &&
                ((node as Element).querySelector?.(".language-mermaid") !==
                  null ||
                  (node as Element).classList?.contains("language-mermaid")),
            ),
        );

        if (shouldRender) {
          this.renderMermaidDiagrams();
        }
      });

      // Start observing the document with the configured parameters
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } catch (error) {
      console.error("Failed to setup MutationObserver:", error);
    }
  }

  private cleanupMermaidWrapper(wrapper: Element): void {
    if (!this.isClient) return;
    const button = wrapper.getElementsByClassName("copy");
    Array.from(button).forEach((element) => element.remove());
  }

  private createMermaidComponent(code: string) {
    if (!this.isClient) return null;

    try {
      const wrapper = document.createElement("div");
      wrapper.id = `mermaid-wrapper-${Math.random().toString(36).slice(2)}`;
      wrapper.className = "mermaid-wrapper";
      return {
        wrapper,
        component: h(MermaidDiagram, { code, config: this.config }),
      };
    } catch (error) {
      console.error("Failed to create mermaid component:", error);
      return null;
    }
  }

  private async renderNextDiagram(): Promise<void> {
    if (!this.isClient || this.renderQueue.length === 0 || this.isRendering) {
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

  private async renderMermaidDiagram(element: HTMLPreElement): Promise<void> {
    if (!this.isClient) return;

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

  public initialize(): void {
    if (this.initialized || !this.isClient) return;

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

  private initializeRenderer(): void {
    this.renderAttempts = 0;
    this.initialPageRenderComplete = false;
    this.renderWithRetry();
  }

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

  public renderMermaidDiagrams(): boolean {
    if (!this.isClient) return false;
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
