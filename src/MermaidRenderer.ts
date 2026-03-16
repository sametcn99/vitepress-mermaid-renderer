/**
 * @module MermaidRenderer
 *
 * Contains the singleton {@link MermaidRenderer} class that serves as the
 * **entry-point orchestrator** for rendering Mermaid diagrams inside a
 * VitePress site. It discovers fenced `mermaid` code blocks in the DOM,
 * replaces them with Vue-powered interactive diagram components, and
 * handles edge-cases like client-side navigation, delayed hydration, and
 * dynamically injected content.
 *
 * Typical lifecycle:
 * 1. `createMermaidRenderer()` (in `src/index.ts`) calls
 *    `MermaidRenderer.getInstance()` which creates the singleton.
 * 2. The constructor registers DOM readiness hooks, VitePress route-change
 *    listeners, and a `MutationObserver` for dynamic content.
 * 3. On each render pass, Mermaid code blocks are discovered, queued, and
 *    sequentially mounted as `<MermaidDiagram>` Vue components.
 * 4. If no blocks are found, an exponential-backoff retry loop re-scans
 *    the DOM up to {@link MermaidRenderer.maxRenderAttempts} times.
 *
 * @example
 * ```ts
 * import { MermaidRenderer } from "./MermaidRenderer";
 *
 * // Obtain (or create) the singleton
 * const renderer = MermaidRenderer.getInstance({ theme: "dark" });
 *
 * // Optionally override toolbar settings
 * renderer.setToolbar({ desktop: { download: "enabled" } });
 * ```
 */
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
 *
 * **Singleton pattern:** Only one instance exists per application. Use
 * {@link MermaidRenderer.getInstance} to obtain (or create) it.
 *
 * **Rendering pipeline:**
 * - Code blocks are discovered via `renderMermaidDiagrams()` and pushed
 *   onto an internal queue (`renderQueue`).
 * - `renderNextDiagram()` processes the queue sequentially — one diagram
 *   at a time — to prevent heavy CPU spikes and race conditions.
 * - Each diagram is mounted as a standalone Vue application wrapping
 *   the `<MermaidDiagram>` component.
 *
 * **Retry mechanism:**
 * In production VitePress sites, HTML may be server-rendered and hydrated
 * asynchronously. The renderer uses an exponential-backoff retry loop
 * controlled by `renderAttempts` / `maxRenderAttempts` to handle delayed
 * content availability.
 *
 * @example
 * ```ts
 * // In a VitePress enhanceApp hook:
 * import { MermaidRenderer } from "vitepress-mermaid-renderer";
 *
 * export default {
 *   enhanceApp() {
 *     MermaidRenderer.getInstance({ theme: "forest" });
 *   },
 * };
 * ```
 */
export class MermaidRenderer {
  /** Singleton instance reference. */
  private static instance: MermaidRenderer;

  /** Active Mermaid library configuration merged from defaults and user overrides. */
  private config: MermaidConfig;

  /** Fully-resolved toolbar configuration passed to every diagram mount. */
  private toolbarConfig: ResolvedToolbarConfig;

  /** Guards against re-running the {@link initialize} lifecycle. */
  private initialized = false;

  /** Counter tracking how many retry iterations have been attempted in the current render pass. */
  private renderAttempts = 0;

  /**
   * Maximum number of exponential-backoff retry iterations before the
   * renderer gives up looking for Mermaid blocks. Set to `15` to
   * accommodate slow production builds and CDN latency.
   */
  private maxRenderAttempts = 15;

  /** Handle returned by `setTimeout` for the active retry timer, used for cancellation on route changes. */
  private retryTimeout: NodeJS.Timeout | null = null;

  /** FIFO queue of `<pre>` elements waiting to be replaced by diagram components. */
  private renderQueue: HTMLPreElement[] = [];

  /** Mutex flag preventing concurrent queue processing. */
  private isRendering = false;

  /** Becomes `true` after every element in the initial render queue has been processed. */
  private initialPageRenderComplete = false;

  /** Becomes `true` once VitePress client-side hydration is considered complete. */
  private hydrationComplete = false;

  /** DOM observer that watches for dynamically-added Mermaid code blocks. */
  private mutationObserver: MutationObserver | null = null;

  /**
   * Private constructor enforcing the singleton pattern.
   *
   * Initialises the Mermaid configuration, resolves the default toolbar
   * settings, and kicks off the {@link initialize} lifecycle that wires
   * DOM readiness hooks and navigation listeners.
   *
   * @param config - Optional initial Mermaid configuration object.
   *   When provided, its values are shallow-merged into the defaults.
   */
  private constructor(config?: MermaidConfig) {
    this.config = config ? { ...config } : {};
    this.toolbarConfig = resolveToolbarConfig();
    this.initialize();
  }

  /**
   * Returns the singleton renderer instance, creating it on first call.
   *
   * If the instance already exists and a `config` object is supplied, the
   * new settings are shallow-merged into the active configuration via
   * {@link setConfig}, and a `vitepress-mermaid:config-updated` event is
   * dispatched so that already-mounted diagrams can re-render.
   *
   * @param config - Optional partial Mermaid configuration. Merged into
   *   the running config on every call (not just the first).
   * @returns The shared {@link MermaidRenderer} instance.
   *
   * @example
   * ```ts
   * // First call creates the singleton
   * const renderer = MermaidRenderer.getInstance({ theme: "dark" });
   *
   * // Subsequent calls return the same instance but can update config
   * MermaidRenderer.getInstance({ securityLevel: "strict" });
   * ```
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
   * Shallow-merges the provided Mermaid options into the runtime config
   * and dispatches a `vitepress-mermaid:config-updated` custom event so
   * that already-mounted `<MermaidDiagram>` components can re-initialise
   * `mermaid.initialize()` and re-render with the new settings.
   *
   * @param config - Partial Mermaid configuration object to merge.
   */
  private setConfig(config: MermaidConfig): void {
    this.config = { ...this.config, ...config };
    this.dispatchConfigUpdate();
  }

  /**
   * Resolves and stores the toolbar options that will be passed to every
   * diagram component mounted after this call.
   *
   * If called without arguments, the toolbar reverts to the canonical
   * defaults defined in {@link DEFAULT_TOOLBAR_CONFIG}.
   *
   * Already-mounted diagrams are **not** affected retroactively. To
   * update them, dispatch a `vitepress-mermaid:toolbar-updated` custom
   * event that `MermaidDiagram.vue` listens for.
   *
   * @param toolbar - Optional consumer-provided toolbar overrides.
   *
   * @example
   * ```ts
   * const renderer = MermaidRenderer.getInstance();
   * renderer.setToolbar({
   *   downloadFormat: "png",
   *   desktop: { download: "enabled" },
   * });
   * ```
   */
  public setToolbar(toolbar?: MermaidToolbarOptions): void {
    this.toolbarConfig = resolveToolbarConfig(toolbar);
  }

  /**
   * Dispatches a `vitepress-mermaid:config-updated` custom event on the
   * document, carrying the current Mermaid configuration as the event
   * `detail`.
   *
   * This event is consumed by the `useMermaidRenderer` composable which
   * re-initialises the Mermaid library and re-renders the active diagram
   * whenever the configuration changes at runtime.
   *
   * Errors during dispatch are caught and logged to prevent unhandled
   * exceptions from breaking the rendering pipeline.
   *
   * @fires vitepress-mermaid:config-updated
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
   * Removes unnecessary UI elements from a Mermaid code-block wrapper
   * that VitePress renders by default (e.g. the "copy" button and the
   * `"mermaid"` language label badge).
   *
   * The language label is only removed when
   * `toolbarConfig.showLanguageLabel` is `false`.
   *
   * Called once per wrapper before the `<pre>` element is queued for
   * rendering.
   *
   * @param wrapper - The `.language-mermaid` DOM element containing the
   *   original fenced code block.
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
   * Creates a Virtual DOM node for the `<MermaidDiagram>` component using
   * Vue's `h()` function, together with a fresh wrapper `<div>` that will
   * replace the original `<pre>` element in the DOM.
   *
   * The wrapper receives a unique, random id (e.g.
   * `mermaid-wrapper-x7k3f2`) and the CSS class `"mermaid-wrapper"`,
   * which is used by the `MutationObserver` to skip already-processed
   * blocks.
   *
   * @param code - The raw Mermaid source code string extracted from the
   *   code block's `textContent`.
   * @returns An object with `wrapper` (the DOM node) and `component`
   *   (the Vue VNode), or `null` if creation fails.
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
   * Processes the next `<pre>` element in the FIFO {@link renderQueue}.
   *
   * Diagrams are rendered **sequentially** (one at a time) to avoid
   * parallel `mermaid.run()` calls that can cause race conditions or
   * heavy CPU spikes on lower-end devices.
   *
   * When the queue is drained after the first batch, the method sets
   * `initialPageRenderComplete` and `hydrationComplete` to `true`,
   * signalling that the initial page load is done.
   *
   * @returns A promise that resolves when the current element (and any
   *   remaining elements triggered recursively) has been processed.
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
   * Renders a single Mermaid diagram by replacing its original `<pre>`
   * element with a freshly-mounted Vue application containing the
   * `<MermaidDiagram>` component.
   *
   * Steps:
   * 1. Extract the raw Mermaid source from the element's `textContent`.
   * 2. Create a wrapper `<div>` and a Vue VNode via
   *    {@link createMermaidComponent}.
   * 3. Replace the `<pre>` node in the DOM with the wrapper.
   * 4. Mount a new Vue app onto the wrapper. A 200 ms delay is added
   *    after mounting to allow the SVG to be fully painted in production
   *    environments.
   *
   * @param element - The `<pre>` element containing the Mermaid source code.
   * @returns A promise that resolves once the component is mounted and
   *   the rendering delay has elapsed.
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
   * Initialises the renderer lifecycle **exactly once**.
   *
   * Depending on `document.readyState`, the method either waits for
   * `DOMContentLoaded` or runs immediately. It:
   * - Sets up a `MutationObserver` via {@link setupDomMutationObserver}.
   * - Calls {@link initializeRenderer} to start the first render pass.
   * - Registers `popstate` and `vitepress:routeChanged` listeners to
   *   re-render after client-side navigation.
   * - Listens for the one-shot `vitepress:ready` event.
   * - Schedules a fallback `renderWithRetry()` after 500 ms for
   *   deployment scenarios where VitePress events may not fire.
   *
   * If initialisation fails, the error is re-thrown so the caller can
   * handle it, and the `initialized` flag remains `false` to allow a
   * future retry.
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
   * Sets up a `MutationObserver` on the VitePress application root
   * (falling back to `document.body`) to detect when new Mermaid code
   * blocks are dynamically added to the DOM.
   *
   * This is essential for two scenarios:
   * 1. **Client-side navigation** — VitePress swaps page content without
   *    a full reload, so new `language-mermaid` blocks appear via DOM
   *    mutations rather than a fresh `DOMContentLoaded`.
   * 2. **Lazy / async content** — Content loaded after initial hydration
   *    (e.g. via JavaScript) is picked up automatically.
   *
   * The observer uses `requestAnimationFrame` debouncing to batch rapid
   * successive mutations into a single render pass.
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
   * Checks whether any of the given DOM mutations contain newly-added
   * Mermaid code blocks by delegating to {@link nodeContainsMermaidCode}.
   *
   * Used by the `MutationObserver` callback to avoid triggering a
   * re-render pass when the mutations are unrelated to Mermaid content
   * (e.g. VitePress updating the sidebar or search index).
   *
   * @param mutations - The list of `MutationRecord` objects received
   *   from the observer.
   * @returns `true` if at least one added node is or contains a Mermaid
   *   code element; `false` otherwise.
   */
  private hasNewMermaidNodes(mutations: MutationRecord[]): boolean {
    return mutations.some((mutation) =>
      Array.from(mutation.addedNodes).some((node) =>
        this.nodeContainsMermaidCode(node),
      ),
    );
  }

  /**
   * Recursively checks whether a DOM node (or any of its descendants)
   * represents an un-processed Mermaid code block.
   *
   * A node is considered a Mermaid block when it matches one of:
   * - `.language-mermaid` class
   * - `code.mermaid` selector
   * - Contains a descendant matching the above selectors
   *
   * Nodes inside `.mermaid-wrapper` are skipped because they have
   * already been processed by a previous render pass.
   *
   * @param node - The DOM node to inspect (may be `null`).
   * @returns `true` if the node is or contains an unprocessed Mermaid
   *   code element; `false` otherwise.
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
   * Resets rendering state counters and kicks off the render-with-retry
   * loop via {@link renderWithRetry}.
   *
   * Called during the initial page load (from {@link initialize}) and
   * is the starting point of every render pass.
   */
  private initializeRenderer(): void {
    this.renderAttempts = 0;
    this.initialPageRenderComplete = false;
    this.renderWithRetry();
  }

  /**
   * Handles route changes in the VitePress SPA router.
   *
   * Clears any active retry timeout, resets the attempt counter, and
   * starts a fresh render pass to process Mermaid blocks on the new
   * page. Called by the `popstate` and `vitepress:routeChanged` event
   * listeners registered in {@link initialize}.
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
   * Attempts to discover and render all Mermaid diagrams on the current
   * page. If no diagrams are found and the retry budget has not been
   * exhausted, schedules another attempt using exponential backoff.
   *
   * **Backoff formula:**
   * `delay = min(300 × 1.4^attempt, 10 000)` milliseconds.
   *
   * This ensures quick first retries (300 ms, 420 ms, 588 ms, …) while
   * capping at 10 seconds for later attempts, accommodating slow CDN
   * networks and heavy SSR hydration.
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
   * Searches the current document for un-processed Mermaid code blocks,
   * cleans their VitePress wrappers (removing copy buttons and optional
   * language labels), and pushes the underlying `<pre>` elements onto
   * the {@link renderQueue} for sequential processing.
   *
   * Two discovery strategies are used:
   * 1. **Primary** — `getElementsByClassName("language-mermaid")`.
   * 2. **Fallback** — Iterates all `<pre>` elements and checks for a
   *    child `<code>` with a `mermaid` or `language-mermaid` class.
   *    This handles edge-cases in certain SSR output formats.
   *
   * @returns `true` if at least one `<pre>` element was discovered and
   *   queued; `false` otherwise.
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
