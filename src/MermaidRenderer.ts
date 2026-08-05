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
import { h, render } from 'vue';
import MermaidDiagram from './MermaidDiagram.vue';
import { MermaidConfig } from 'mermaid';
import { resetRenderPipeline } from './composables/useMermaidRenderer';
import {
  resolveToolbarConfig,
  type MermaidToolbarOptions,
  type ResolvedToolbarConfig,
} from './toolbar';

/**
 * Renderer options accepted by {@link MermaidRenderer.getInstance} and
 * {@link createMermaidRenderer}.
 */
export type MermaidRendererOptions = MermaidConfig & {
  /** Render diagrams as non-interactive SVGs while preserving theme updates. */
  static?: boolean;
};

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

  /** Whether mounted diagrams omit every interactive control and gesture. */
  private staticMode: boolean;

  /** Fully-resolved toolbar configuration passed to every diagram mount. */
  private toolbarConfig: ResolvedToolbarConfig;

  /** Guards against re-running the {@link initialize} lifecycle. */
  private initialized = false;

  /** Counter tracking how many retry iterations have been attempted in the current render pass. */
  private renderAttempts = 0;

  /**
   * Maximum number of exponential-backoff retry iterations before the
   * renderer gives up looking for Mermaid blocks.
   *
   * Reduced from 15 to 5 because the `MutationObserver` already watches
   * for dynamically-added content, making aggressive retries unnecessary.
   */
  private maxRenderAttempts = 5;

  /** Handle returned by `setTimeout` for the active retry timer, used for cancellation on route changes. */
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

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
   * `IntersectionObserver` used to defer rendering of offscreen diagrams
   * until they scroll into the viewport. Only created when there are
   * elements below the fold; diagrams already visible are rendered
   * immediately.
   */
  private lazyObserver: IntersectionObserver | null = null;

  /**
   * Private constructor enforcing the singleton pattern.
   *
   * Initialises the Mermaid configuration, resolves the default toolbar
   * settings, and kicks off the {@link initialize} lifecycle that wires
   * DOM readiness hooks and navigation listeners.
   *
   * @param config - Optional initial Mermaid configuration object.
   *   When provided, its values are deep-merged into the defaults.
   */
  private constructor(options?: MermaidRendererOptions) {
    const { static: staticMode = false, ...config } = options ?? {};
    this.config = this.deepMerge({}, config);
    this.staticMode = staticMode;
    this.toolbarConfig = resolveToolbarConfig();
    this.initialize();
  }

  /**
   * Returns the singleton renderer instance, creating it on first call.
   *
   * If the instance already exists and a `config` object is supplied, the
   * new settings are deep-merged into the active configuration via
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
  public static getInstance(options?: MermaidRendererOptions): MermaidRenderer {
    if (!MermaidRenderer.instance) {
      MermaidRenderer.instance = new MermaidRenderer(options);
    } else if (options) {
      MermaidRenderer.instance.setOptions(options);
    }
    return MermaidRenderer.instance;
  }

  /**
   * Destroys the singleton instance, cleaning up all DOM observers,
   * event listeners, and timers.
   *
   * This is primarily useful for test environments where multiple
   * test suites need isolated renderer instances without leaking
   * state from previous tests. In production, the singleton lives
   * for the lifetime of the page and does not need to be destroyed.
   *
   * After calling this method, the next call to
   * {@link MermaidRenderer.getInstance} will create a fresh instance.
   */
  public static resetInstance(): void {
    if (!MermaidRenderer.instance) return;
    MermaidRenderer.instance.destroy();
    MermaidRenderer.instance = undefined as unknown as MermaidRenderer;
  }

  /**
   * Route-change handler bound once in {@link initialize} so it can be
   * removed in {@link destroy}.
   */
  private boundRouteChangeHandler: (() => void) | null = null;

  /** Cleans up all DOM observers, event listeners, and pending timers
   * held by this instance. Called automatically by
   * {@link MermaidRenderer.resetInstance}.
   */
  private destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
      this.lazyObserver = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.boundRouteChangeHandler) {
      window.removeEventListener('popstate', this.boundRouteChangeHandler);
      document.removeEventListener(
        'vitepress:routeChanged',
        this.boundRouteChangeHandler,
      );
      this.boundRouteChangeHandler = null;
    }
  }

  /**
   * Recursively merges `source` into `target` so that nested objects are
   * combined rather than replaced. Arrays and primitives are overwritten
   * directly.
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      const sourceVal = source[key];
      const targetVal = target[key];
      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        result[key] = this.deepMerge(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }
    return result;
  }

  /**
   * Deep-merges the provided Mermaid options into the runtime config
   * and dispatches a `vitepress-mermaid:config-updated` custom event so
   * that already-mounted `<MermaidDiagram>` components can re-initialise
   * `mermaid.initialize()` and re-render with the new settings.
   *
   * @param config - Partial Mermaid configuration object to merge.
   */
  private setConfig(config: MermaidConfig): void {
    this.config = this.deepMerge(this.config, config);
    this.dispatchConfigUpdate();
  }

  /** Updates Mermaid configuration and, when supplied, static SVG mode. */
  private setOptions(options: MermaidRendererOptions): void {
    const { static: staticMode, ...config } = options;
    if (staticMode !== undefined && staticMode !== this.staticMode) {
      this.staticMode = staticMode;
      this.dispatchStaticModeUpdate();
    }
    if (Object.keys(config).length > 0) {
      this.setConfig(config);
    }
  }

  /**
   * Resolves and stores the toolbar options that will be passed to every
   * diagram component mounted after this call.
   *
   * If called without arguments, the toolbar reverts to the canonical
   * defaults defined in {@link DEFAULT_TOOLBAR_CONFIG}.
   *
   * Already-mounted diagrams are updated as well: this method dispatches
   * a `vitepress-mermaid:toolbar-updated` custom event whose `detail` is
   * the freshly-resolved toolbar config. `MermaidDiagram.vue` listens
   * for this event and re-applies the new config (including localized
   * tooltip text) without remounting.
   *
   * @param toolbar - Optional consumer-provided toolbar overrides.
   *
   * @fires vitepress-mermaid:toolbar-updated
   *
   * @example
   * ```ts
   * const renderer = MermaidRenderer.getInstance();
   * renderer.setToolbar({
   *   downloadFormat: "png",
   *   desktop: { download: "enabled" },
   *   i18n: {
   *     localeIndex: "tr",
   *     locales: { tr: { tooltips: { zoomIn: "Yakınlaştır" } } },
   *   },
   * });
   * ```
   */
  public setToolbar(toolbar?: MermaidToolbarOptions): void {
    this.toolbarConfig = resolveToolbarConfig(toolbar);
    this.dispatchToolbarUpdate();
  }

  /**
   * Dispatches a `vitepress-mermaid:toolbar-updated` custom event on
   * the document carrying the current resolved toolbar config as the
   * event `detail`. Listeners in `MermaidDiagram.vue` use it to refresh
   * already-mounted diagrams without remounting.
   *
   * Errors during dispatch are caught and logged so a single failure
   * never breaks the rendering pipeline.
   *
   * @fires vitepress-mermaid:toolbar-updated
   */
  private dispatchToolbarUpdate(): void {
    try {
      if (typeof document === 'undefined') return;
      document.dispatchEvent(
        new CustomEvent<ResolvedToolbarConfig>(
          'vitepress-mermaid:toolbar-updated',
          { detail: this.toolbarConfig },
        ),
      );
    } catch (error) {
      console.error('Failed to dispatch Mermaid toolbar update:', error);
    }
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
        new CustomEvent<MermaidConfig>('vitepress-mermaid:config-updated', {
          detail: { ...this.config },
        }),
      );
    } catch (error) {
      console.error('Failed to dispatch Mermaid config update:', error);
    }
  }

  /** Notifies mounted diagrams that their interactive rendering mode changed. */
  private dispatchStaticModeUpdate(): void {
    try {
      document.dispatchEvent(
        new CustomEvent<boolean>('vitepress-mermaid:static-mode-updated', {
          detail: this.staticMode,
        }),
      );
    } catch (error) {
      console.error('Failed to dispatch Mermaid static mode update:', error);
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
    const button = wrapper.getElementsByClassName('copy');
    Array.from(button).forEach((element) => element.remove());

    if (!this.toolbarConfig.showLanguageLabel) {
      const languageLabels = wrapper.getElementsByClassName('lang');
      Array.from(languageLabels).forEach((element) => element.remove());
    }

    const lineNumbersWrapper = wrapper.getElementsByClassName(
      'line-numbers-wrapper',
    );
    Array.from(lineNumbersWrapper).forEach((element) => element.remove());

    const lineNumbers = wrapper.getElementsByClassName('line-number');
    Array.from(lineNumbers).forEach((element) => element.remove());

    wrapper.classList.remove('line-numbers-mode');
    wrapper.classList.remove('has-line-numbers');

    const lineNumbersMode = wrapper.getElementsByClassName('line-numbers-mode');
    Array.from(lineNumbersMode).forEach((element) => {
      element.classList.remove('line-numbers-mode');
    });
  }

  /**
   * Creates a wrapper `<div>` element that will replace the original
   * `<pre>` element in the DOM.
   *
   * The wrapper receives a unique, random id (e.g.
   * `mermaid-wrapper-x7k3f2`) and the CSS class `"mermaid-wrapper"`,
   * which is used by the `MutationObserver` to skip already-processed
   * blocks.
   *
   * @param _code - The raw Mermaid source code (retained for API
   *   compatibility; the actual rendering is done by `render()`).
   * @returns The wrapper DOM element, or `null` if creation fails.
   */
  private createMermaidWrapper(_code: string): HTMLDivElement | null {
    try {
      const wrapper = document.createElement('div');
      wrapper.id = `mermaid-wrapper-${Math.random().toString(36).slice(2)}`;
      wrapper.className = 'mermaid-wrapper';
      return wrapper;
    } catch (error) {
      console.error('Failed to create mermaid wrapper:', error);
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
        console.error('Failed to render diagram:', error);
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
   * element with a Vue-powered `<MermaidDiagram>` component.
   *
   * Steps:
   * 1. Extract the raw Mermaid source from the element's `textContent`.
   * 2. Create a wrapper `<div>` and a Vue VNode via
   *    {@link createMermaidComponent}.
   * 3. Replace the `<pre>` node in the DOM with the wrapper.
   * 4. Render the component into the wrapper using Vue's `render()`
   *    function. Unlike `createApp().mount()`, `render()` does not
   *    create a full Vue application context per diagram, reducing
   *    memory and CPU overhead when many diagrams are present.
   *
   * @param element - The `<pre>` element containing the Mermaid source code.
   * @returns A promise that resolves once the component is mounted and
   *   the browser has had a chance to paint.
   */
  private async renderMermaidDiagram(element: HTMLPreElement): Promise<void> {
    try {
      if (!element || !element.parentNode) return;
      const code = element.textContent?.trim() || '';
      const wrapper = this.createMermaidWrapper(code);
      if (!wrapper) return;

      // Replace pre element with component wrapper
      element.parentNode.replaceChild(wrapper, element);

      // Render the component into the wrapper using Vue's lightweight
      // render() API. This avoids creating a full Vue application context
      // per diagram, significantly reducing overhead on pages with many
      // diagrams.
      render(
        h(MermaidDiagram, {
          code,
          config: this.config,
          toolbar: this.toolbarConfig,
          static: this.staticMode,
        }),
        wrapper,
      );

      // Wait for the browser's next repaint cycle so the SVG is
      // visually settled. Two consecutive animation frames give
      // the renderer a reliable signal that paint has occurred.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    } catch (error) {
      console.error('Failed to render mermaid diagram:', error);
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
            'MermaidRenderer initialization failed: document or body not available',
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
                'Failed to initialize MermaidRenderer:',
                error instanceof Error ? error.message : 'Unknown error',
              );
            }
          });
        });
      };

      // Handle different document ready states
      switch (document.readyState) {
        case 'loading':
          document.addEventListener('DOMContentLoaded', initOnReady, {
            once: true,
          });
          break;
        case 'interactive':
        case 'complete':
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
            'Error handling route change:',
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      };

      // Store the handler so we can remove it in destroy()
      this.boundRouteChangeHandler = handleRouteChangeWithErrorBoundary;

      window.addEventListener('popstate', handleRouteChangeWithErrorBoundary);
      document.addEventListener(
        'vitepress:routeChanged',
        handleRouteChangeWithErrorBoundary,
      );

      // Listen for VitePress theme ready event
      document.addEventListener(
        'vitepress:ready',
        () => {
          this.renderWithRetry();
        },
        { once: true },
      );

      // Special handling for deployment
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          this.renderWithRetry();
        }, 500);
      }

      this.initialized = true;
    } catch (error) {
      console.error(
        'Critical error during MermaidRenderer initialization:',
        error instanceof Error ? error.message : 'Unknown error',
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
   * successive mutations into a single render pass. Only mutations that
   * add nodes containing Mermaid code elements (checked via
   * {@link hasNewMermaidNodes}) trigger a re-render, avoiding unnecessary
   * work for unrelated DOM changes (e.g. sidebar updates, search index).
   *
   * The observer is configured with `attributes: false` so style and
   * class changes on existing elements do **not** fire the callback.
   */
  private setupDomMutationObserver(): void {
    if (
      typeof window === 'undefined' ||
      typeof MutationObserver === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return;
    }

    const target =
      document.getElementById('app') ||
      document.querySelector('.Layout') ||
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
        attributes: false,
      });
    } catch (error) {
      console.error('Failed to observe DOM mutations for Mermaid:', error);
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

      if (element.closest('.mermaid-wrapper')) {
        return false;
      }

      if (
        element.classList.contains('language-mermaid') ||
        element.matches?.('code.mermaid')
      ) {
        return true;
      }

      if (
        element.querySelector(
          '.language-mermaid, pre.language-mermaid, code.language-mermaid, code.mermaid',
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
   * Clears any active retry timeout, tears down the `IntersectionObserver`
   * from the previous page, resets the attempt counter, and starts a
   * fresh render pass to process Mermaid blocks on the new page.
   *
   * Called by the `popstate` and `vitepress:routeChanged` event
   * listeners registered in {@link initialize}.
   */
  private handleRouteChange(): void {
    // Reset attempts and start fresh on route change
    this.renderAttempts = 0;
    this.initialPageRenderComplete = false;

    // Reset the global render pipeline to prevent stale promise
    // chains from previous pages from accumulating.
    resetRenderPipeline();

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    // Tear down the lazy observer; a new one will be created if needed
    // by renderMermaidDiagrams() for the new page content.
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
      this.lazyObserver = null;
    }
    this.renderWithRetry();
  }

  /**
   * Attempts to discover and render all Mermaid diagrams on the current
   * page. If no diagrams are found and the retry budget has not been
   * exhausted, schedules another attempt using exponential backoff.
   *
   * **Early exit:** When the `MutationObserver` is active, it will
   * trigger {@link handleRouteChange} whenever new Mermaid blocks are
   * injected into the DOM. Therefore, once the observer is running we
   * can safely stop retrying — the observer will pick up any late content.
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

    if (diagramsFound) return; // Diagrams found and queued — no retry needed.

    // If the MutationObserver is already active, it will pick up any
    // late-arriving mermaid blocks, so further retries are unnecessary.
    if (this.mutationObserver) return;

    if (this.renderAttempts < this.maxRenderAttempts) {
      const backoffTime = Math.min(
        300 * Math.pow(1.4, this.renderAttempts),
        10000,
      );

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
   * Uses a single `querySelectorAll('pre > code.mermaid, pre > code.language-mermaid')`
   * selector that matches both commonly-produced VitePress class patterns in
   * one pass, avoiding the need to scan all `<pre>` elements on the page.
   *
   * Elements that have already been processed (carrying a
   * `data-mermaid-processed` attribute) are skipped to prevent duplicate
   * rendering.
   *
   * @returns `true` if at least one `<pre>` element was discovered and
   *   queued; `false` otherwise.
   */
  private renderMermaidDiagrams(): boolean {
    try {
      // Collect mermaid <pre> elements from two structural patterns:
      // 1. VitePress standard: <div class="language-mermaid">... <pre><code class="language-mermaid">
      // 2. Direct code block:  <pre><code class="mermaid"> or <pre><code class="language-mermaid">
      // 3. SSR fallback:       <div class="language-mermaid">... <pre>text</pre> (no <code>)
      const preElements: HTMLPreElement[] = [];
      const seen = new Set<HTMLPreElement>();

      // Pattern 1 & 2: find <code> elements with mermaid classes and map to parent <pre>
      const codeElements = document.querySelectorAll(
        'pre > code.mermaid, pre > code.language-mermaid',
      );
      codeElements.forEach((codeEl) => {
        const pre = codeEl.parentElement;
        if (
          pre &&
          pre instanceof HTMLPreElement &&
          !seen.has(pre) &&
          !pre.hasAttribute('data-mermaid-processed')
        ) {
          seen.add(pre);
          preElements.push(pre);
          pre.setAttribute('data-mermaid-processed', '');
        }
      });

      // Pattern 3: find .language-mermaid wrappers that contain a <pre> without
      // a <code> child (SSR edge-case). Already-seen elements are skipped.
      const wrappers = document.getElementsByClassName('language-mermaid');
      Array.from(wrappers).forEach((wrapper) => {
        // Skip wrappers that are <code> elements themselves (already caught above)
        if (wrapper.tagName.toLowerCase() === 'code') return;

        const pre = wrapper.querySelector('pre');
        if (
          pre &&
          pre instanceof HTMLPreElement &&
          !seen.has(pre) &&
          !pre.hasAttribute('data-mermaid-processed')
        ) {
          seen.add(pre);
          preElements.push(pre);
          pre.setAttribute('data-mermaid-processed', '');
        }

        // Also handle the case where the wrapper itself is a <pre>
        if (
          wrapper instanceof HTMLPreElement &&
          !seen.has(wrapper) &&
          !wrapper.hasAttribute('data-mermaid-processed')
        ) {
          seen.add(wrapper);
          preElements.push(wrapper);
          wrapper.setAttribute('data-mermaid-processed', '');
        }
      });

      if (preElements.length === 0) return false;

      // Clean up VitePress wrappers on the elements we found.
      preElements.forEach((pre) => {
        const wrapper = pre.closest('.language-mermaid');
        if (wrapper) {
          this.cleanupMermaidWrapper(wrapper);
        }
      });

      // Partition elements into those already in the viewport (render
      // immediately) and those below the fold (defer via IntersectionObserver
      // when available).
      const visibleElements: HTMLPreElement[] = [];
      const offscreenElements: HTMLPreElement[] = [];

      const hasIntersectionObserver =
        typeof IntersectionObserver !== 'undefined';

      for (const pre of preElements) {
        // An element that already has a `.mermaid-wrapper` ancestor has been
        // processed by a previous render pass — skip it entirely.
        if (pre.closest('.mermaid-wrapper')) continue;

        if (!hasIntersectionObserver) {
          // No IntersectionObserver (SSR / Node) — render everything eagerly.
          visibleElements.push(pre);
          continue;
        }

        const rect = pre.getBoundingClientRect();

        // When the viewport dimensions are zero (happens in jsdom / happy-dom
        // test environments or during SSR), fall back to eager rendering.
        if (window.innerWidth === 0 || window.innerHeight === 0) {
          visibleElements.push(pre);
          continue;
        }

        // An element with zero dimensions (common in test environments
        // and before layout) should be rendered eagerly since we cannot
        // reliably determine if it is in the viewport.
        const hasZeroDimensions = rect.width === 0 && rect.height === 0;

        const isInViewport =
          hasZeroDimensions ||
          (rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0);

        if (isInViewport) {
          visibleElements.push(pre);
        } else {
          offscreenElements.push(pre);
        }
      }

      // Render visible diagrams immediately.
      if (visibleElements.length > 0) {
        this.renderQueue.push(...visibleElements);
        if (!this.isRendering) {
          this.renderNextDiagram();
        }
      }

      // Defer offscreen diagrams with IntersectionObserver (only when available).
      if (offscreenElements.length > 0) {
        this.observeOffscreenElements(offscreenElements);
      }

      return visibleElements.length > 0 || offscreenElements.length > 0;
    } catch (error) {
      console.error('Error rendering Mermaid diagrams:', error);
      return false;
    }
  }

  /**
   * Ensures offscreen `<pre>` elements are observed by an
   * `IntersectionObserver` and enqueued for rendering as soon as
   * they scroll into the viewport.
   *
   * Reuses the existing observer when possible — only creating a new
   * one when it does not yet exist. On route changes
   * ({@link handleRouteChange}), the observer is disconnected and
   * re-created for the new page content.
   *
   * @param elements - `<pre>` elements that are currently below the fold.
   */
  private observeOffscreenElements(elements: HTMLPreElement[]): void {
    // Create the observer only if it does not already exist.
    // Reusing the observer across multiple calls avoids unnecessary
    // teardown/recreate cycles when dynamic content is injected
    // without a route change.
    if (!this.lazyObserver) {
      this.lazyObserver = new IntersectionObserver(
        (entries) => {
          const newlyVisible: HTMLPreElement[] = [];

          for (const entry of entries) {
            if (entry.isIntersecting) {
              const pre = entry.target as HTMLPreElement;
              this.lazyObserver!.unobserve(pre);
              newlyVisible.push(pre);
            }
          }

          if (newlyVisible.length > 0) {
            this.renderQueue.push(...newlyVisible);
            if (!this.isRendering) {
              this.renderNextDiagram();
            }
          }
        },
        {
          // Start loading slightly before the element enters the viewport
          // so the diagram is ready when the user scrolls to it.
          rootMargin: '200px 0px',
          threshold: 0,
        },
      );
    }

    for (const pre of elements) {
      this.lazyObserver.observe(pre);
    }
  }
}
