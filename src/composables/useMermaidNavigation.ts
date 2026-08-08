/**
 * @module useMermaidNavigation
 *
 * Vue 3 composable that encapsulates all **interactive navigation**
 * behaviour for a Mermaid diagram: zoom, pan, fullscreen, mouse-wheel,
 * touch gestures, and keyboard-driven directional panning.
 *
 * The composable is consumed by `MermaidDiagram.vue` which wires the
 * returned reactive state and action callbacks to the DOM event handlers
 * on the diagram wrapper element.
 *
 * @example
 * ```ts
 * import { useMermaidNavigation } from "./composables/useMermaidNavigation";
 *
 * const {
 *   scale, translateX, translateY, isPanning, isFullscreen,
 *   zoomIn, zoomOut, resetView, toggleFullscreen,
 *   startPan, pan, endPan,
 *   handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd,
 *   panUp, panDown, panLeft, panRight,
 *   updateFullscreenControls,
 * } = useMermaidNavigation();
 * ```
 *
 * @see {@link MermaidDiagram} for the component that uses this composable.
 * @see {@link useMermaidRenderer} for the rendering counterpart.
 */
import { ref, watch, type Ref } from 'vue';

/**
 * Determines how the diagram enters fullscreen mode.
 *
 * - `"browser"` — Uses the native Fullscreen API
 *   (`Element.requestFullscreen()`). The diagram occupies the entire
 *   screen and the browser chrome is hidden.
 * - `"dialog"` — Uses a CSS-based dialog overlay that fills the
 *   viewport **without** hiding browser chrome. Useful in environments
 *   where the Fullscreen API is blocked (e.g. cross-origin iframes).
 *
 * Configured via {@link ResolvedToolbarConfig.fullscreenMode} and
 * consumed by `MermaidDiagram.vue` when calling
 * {@link MermaidNavigationActions.toggleFullscreen}.
 *
 * @example
 * ```ts
 * const behavior: FullscreenBehavior = "dialog";
 * toggleFullscreen(wrapperEl, behavior);
 * ```
 */
export type FullscreenBehavior = 'browser' | 'dialog';

/** Details of a zoom change initiated by a pointer or pinch gesture. */
export interface MermaidZoomChange {
  /** User zoom before the interaction. */
  previousScale: number;
  /** User zoom after the interaction. */
  scale: number;
  /** Viewport-relative horizontal gesture coordinate. */
  clientX: number;
  /** Viewport-relative vertical gesture coordinate. */
  clientY: number;
}

/**
 * Optional configuration for zoom and pan limits in
 * {@link useMermaidNavigation}.
 */
export interface MermaidNavigationOptions {
  /** Minimum zoom scale. Defaults to `0.2`. */
  minScale?: number;
  /** Maximum zoom scale. Defaults to `10`. */
  maxScale?: number;
  /** Zoom factor applied on each zoom-in / zoom-out step. Defaults to `1.2`. */
  zoomStep?: number;
  /** Receives pointer coordinates whenever wheel or pinch zoom changes scale. */
  onGestureZoom?: (change: MermaidZoomChange) => void;
  /** Returns the fitted base scale applied before the user zoom. */
  getBaseScale?: () => number;
}

/**
 * Reactive state exposed by the {@link useMermaidNavigation} composable.
 *
 * All values are Vue `Ref` objects and are two-way bound to the diagram
 * wrapper’s `style.transform` in `MermaidDiagram.vue`.
 *
 * @example
 * ```ts
 * const { scale, translateX, translateY } = useMermaidNavigation();
 * console.log(scale.value); // 1  (default zoom level)
 * ```
 */
export interface MermaidNavigationState {
  /** Current zoom scale factor. `1` = 100 %, `2` = 200 %, etc. */
  scale: Ref<number>;
  /** Horizontal translation in CSS pixels (before scale is applied). */
  translateX: Ref<number>;
  /** Vertical translation in CSS pixels (before scale is applied). */
  translateY: Ref<number>;
  /** `true` while the user is actively dragging (mouse-down + move). */
  isPanning: Ref<boolean>;
  /** `true` when the diagram is in fullscreen (browser or dialog). */
  isFullscreen: Ref<boolean>;
}

/**
 * Action callbacks exposed by the {@link useMermaidNavigation} composable.
 *
 * Each function mutates the reactive {@link MermaidNavigationState} in
 * response to user interactions. They are wired to event handlers in
 * `MermaidDiagram.vue` and, indirectly, to toolbar buttons in
 * `MermaidControls.vue`.
 */
export interface MermaidNavigationActions {
  /** Multiplies `scale` by `1.2` (20 % zoom-in step). */
  zoomIn: () => void;
  /** Divides `scale` by `1.2`, clamped to a minimum of `0.2`. */
  zoomOut: () => void;
  /** Resets `scale`, `translateX`, and `translateY` to their defaults. */
  resetView: () => void;
  /** Fits the untransformed diagram inside its container and centers it. */
  fitDiagramToContainer: (
    container: HTMLElement | null,
    diagram: HTMLElement | null,
  ) => void;
  /**
   * Toggles fullscreen on the given wrapper element.
   * @param diagramWrapper - The DOM element to make fullscreen.
   * @param behavior - `"browser"` (default) or `"dialog"`.
   */
  toggleFullscreen: (
    diagramWrapper: HTMLElement | null,
    behavior?: FullscreenBehavior,
  ) => void;
  /** Begins a mouse-driven pan operation from the given event. */
  startPan: (e: MouseEvent) => void;
  /** Continues a mouse-driven pan, updating translate offsets. */
  pan: (e: MouseEvent) => void;
  /** Ends a mouse-driven pan operation. */
  endPan: () => void;
  /**
   * Handles mouse-wheel events. Zooms when `Ctrl` is held or the
   * diagram is fullscreen; otherwise the event is not consumed so the
   * page can scroll normally.
   */
  handleWheel: (e: WheelEvent) => void;
  /** Initiates touch interactions (single-finger pan or two-finger pinch). */
  handleTouchStart: (e: TouchEvent) => void;
  /** Processes ongoing touch gestures (pan or pinch-zoom). */
  handleTouchMove: (e: TouchEvent) => void;
  /** Cleans up touch interaction state. */
  handleTouchEnd: () => void;
  /** Pans the diagram upward by {@link PAN_STEP} pixels. */
  panUp: () => void;
  /** Pans the diagram downward by {@link PAN_STEP} pixels. */
  panDown: () => void;
  /** Pans the diagram to the left by {@link PAN_STEP} pixels. */
  panLeft: () => void;
  /** Pans the diagram to the right by {@link PAN_STEP} pixels. */
  panRight: () => void;
  /**
   * Synchronises the `isFullscreen` state and CSS `force-show` class
   * on the controls containers with the current Fullscreen API state.
   */
  updateFullscreenControls: (controlsRefs: {
    controls: HTMLElement | null;
    mobileControls: HTMLElement | null;
  }) => void;
}

/**
 * Creates and returns a complete set of reactive navigation state and
 * action callbacks for controlling a Mermaid diagram.
 *
 * **State:** `scale`, `translateX`, `translateY`, `isPanning`,
 * `isFullscreen` (all Vue `Ref` objects).
 *
 * **Actions:** zoom, pan (mouse, touch, keyboard), fullscreen toggle,
 * and fullscreen-controls synchronisation.
 *
 * **Touch behaviour on mobile (non-fullscreen):**
 * - One finger → page scroll (default browser behaviour).
 * - Two fingers → pinch-zoom + pan the diagram.
 *
 * In fullscreen (and on desktop), single-finger/single-click drag pans
 * the diagram, and mouse-wheel / pinch zooms.
 *
 * @param options - Optional zoom limit overrides.
 * @returns A merged object of {@link MermaidNavigationState} and
 *   {@link MermaidNavigationActions}.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMermaidNavigation } from "./composables/useMermaidNavigation";
 * const { scale, zoomIn, zoomOut, startPan, pan, endPan } = useMermaidNavigation();
 * </script>
 * ```
 */
export function useMermaidNavigation(
  options: MermaidNavigationOptions = {},
): MermaidNavigationState & MermaidNavigationActions {
  const MIN_SCALE = options.minScale ?? 0.2;
  const MAX_SCALE = options.maxScale ?? 10;
  const ZOOM_STEP = options.zoomStep ?? 1.2;

  // State
  const scale = ref(1);
  const translateX = ref(0);
  const translateY = ref(0);
  const isPanning = ref(false);
  const isFullscreen = ref(false);

  // Internal state for pan operations
  const lastX = ref(0);
  const lastY = ref(0);

  // Touch event variables
  const initialTouchDistance = ref(0);
  const touchPanning = ref(false);
  const lastTouchX = ref(0);
  const lastTouchY = ref(0);
  const fullscreenViewState = ref<{
    scale: number;
    translateX: number;
    translateY: number;
  } | null>(null);

  /**
   * Returns `true` when the viewport width is ≤ 768 px **and** the diagram
   * is not currently in fullscreen mode.
   *
   * On mobile non-fullscreen viewports, a single-finger touch should
   * scroll the page rather than pan the diagram. Two-finger gestures
   * (pinch) control the diagram instead.
   *
   * @returns Whether the device is mobile-sized and not fullscreen.
   */
  const isMobileNonFullscreen = (): boolean => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(max-width: 768px)').matches && !isFullscreen.value
    );
  };

  /**
   * Number of CSS pixels the diagram is translated per directional-pan
   * button press (up / down / left / right). The value is divided by the
   * current `scale` at invocation time so that perceived movement stays
   * consistent regardless of zoom level.
   */
  const PAN_STEP = 50;

  /** Returns the total visual scale applied to translation distances. */
  const getTotalScale = () =>
    Math.max(Number.EPSILON, (options.getBaseScale?.() ?? 1) * scale.value);

  /** Applies a gesture scale change and reports the gesture focal point. */
  const applyGestureZoom = (
    newScale: number,
    clientX: number,
    clientY: number,
  ) => {
    if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

    const previousScale = scale.value;
    scale.value = newScale;
    options.onGestureZoom?.({
      previousScale,
      scale: newScale,
      clientX,
      clientY,
    });
  };

  /** Increases the zoom level by {@link ZOOM_STEP}. */
  const zoomIn = () => {
    scale.value = scale.value * ZOOM_STEP;
  };

  /**
   * Decreases the zoom level by {@link ZOOM_STEP}. The minimum zoom
   * scale is clamped at {@link MIN_SCALE} to prevent the diagram from
   * becoming invisible.
   */
  const zoomOut = () => {
    if (scale.value > MIN_SCALE) {
      // Prevent extreme zooming out
      scale.value = scale.value / ZOOM_STEP;
    }
  };

  /** Resets zoom and pan to the initial state (`scale = 1`, translate `0,0`). */
  const resetView = () => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  };

  /**
   * Scales a diagram to the largest size that fits inside its container and
   * translates it so both centers align. The translation is divided by the
   * scale because the component applies `scale(...) translate(...)`.
   *
   * @param container - The viewport that constrains the diagram.
   * @param diagram - The Mermaid element whose rendered bounds are measured.
   */
  const fitDiagramToContainer = (
    container: HTMLElement | null,
    diagram: HTMLElement | null,
  ) => {
    if (!container || !diagram) return;

    const containerBounds = container.getBoundingClientRect();
    const diagramBounds = diagram.getBoundingClientRect();
    if (
      containerBounds.width <= 0 ||
      containerBounds.height <= 0 ||
      diagramBounds.width <= 0 ||
      diagramBounds.height <= 0
    ) {
      return;
    }

    const fittedScale = Math.min(
      containerBounds.width / diagramBounds.width,
      containerBounds.height / diagramBounds.height,
    );

    if (!Number.isFinite(fittedScale) || fittedScale <= 0) return;

    scale.value = fittedScale;
    const viewportBounds = diagram.parentElement?.getBoundingClientRect();
    if (
      viewportBounds &&
      viewportBounds.width > 0 &&
      viewportBounds.height > 0
    ) {
      translateX.value =
        (containerBounds.left +
          containerBounds.width / 2 -
          (viewportBounds.left + viewportBounds.width / 2)) /
        fittedScale;
      translateY.value =
        (containerBounds.top +
          containerBounds.height / 2 -
          (viewportBounds.top + viewportBounds.height / 2)) /
        fittedScale;
      return;
    }

    translateX.value = (containerBounds.width - diagramBounds.width) / 2;
    translateY.value = (containerBounds.height - diagramBounds.height) / 2;
  };

  /** Restores the non-fullscreen view after a fullscreen session ends. */
  const restoreFullscreenView = () => {
    if (!fullscreenViewState.value) {
      return;
    }

    scale.value = fullscreenViewState.value.scale;
    translateX.value = fullscreenViewState.value.translateX;
    translateY.value = fullscreenViewState.value.translateY;
    isPanning.value = false;
    touchPanning.value = false;
    initialTouchDistance.value = 0;
    fullscreenViewState.value = null;
  };

  watch(
    isFullscreen,
    (active) => {
      if (active) {
        fullscreenViewState.value = {
          scale: scale.value,
          translateX: translateX.value,
          translateY: translateY.value,
        };
        return;
      }

      restoreFullscreenView();
    },
    { flush: 'sync' },
  );

  /**
   * Toggles the diagram in and out of fullscreen.
   *
   * When `behavior` is `"dialog"`, the function simply flips the
   * `isFullscreen` ref. CSS in `MermaidDiagram.vue` reacts by
   * displaying the diagram in a viewport-covering overlay.
   *
   * When `behavior` is `"browser"` (default), the native Fullscreen API
   * is invoked with vendor-prefix fallbacks for
   * WebKit / Moz / MS browsers.
   *
   * @param diagramWrapper - The DOM element to make fullscreen.
   * @param behavior - `"browser"` (default) or `"dialog"`.
   */
  const toggleFullscreen = (
    diagramWrapper: HTMLElement | null,
    behavior: FullscreenBehavior = 'browser',
  ) => {
    try {
      if (behavior === 'dialog') {
        isFullscreen.value = !isFullscreen.value;
        return;
      }

      if (!document.fullscreenElement) {
        if (diagramWrapper?.requestFullscreen) {
          diagramWrapper.requestFullscreen();
        } else if ((diagramWrapper as any)?.webkitRequestFullscreen) {
          (diagramWrapper as any).webkitRequestFullscreen();
        } else if ((diagramWrapper as any)?.mozRequestFullScreen) {
          (diagramWrapper as any).mozRequestFullScreen();
        } else if ((diagramWrapper as any)?.msRequestFullscreen) {
          (diagramWrapper as any).msRequestFullscreen();
        } else {
          throw new Error('Fullscreen API not available');
        }
        isFullscreen.value = true;
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        isFullscreen.value = false;
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      alert('Fullscreen mode is not supported in this browser.');
    }
  };

  /**
   * Records the start position of a mouse-driven pan operation.
   * Sets `isPanning` to `true` and stores `clientX` / `clientY`.
   *
   * @param e - The initiating `mousedown` event.
   */
  const startPan = (e: MouseEvent) => {
    isPanning.value = true;
    lastX.value = e.clientX;
    lastY.value = e.clientY;
  };

  /**
   * Continues a pan operation by computing the delta from the last
   * recorded cursor position and applying it to `translateX` /
   * `translateY`. The delta is divided by `scale` so that visual
   * movement matches cursor movement at any zoom level.
   *
   * No-op when `isPanning` is `false`.
   *
   * @param e - The `mousemove` event.
   */
  const pan = (e: MouseEvent) => {
    if (!isPanning.value) return;

    const deltaX = e.clientX - lastX.value;
    const deltaY = e.clientY - lastY.value;

    const totalScale = getTotalScale();
    translateX.value += deltaX / totalScale;
    translateY.value += deltaY / totalScale;

    lastX.value = e.clientX;
    lastY.value = e.clientY;
  };

  /** Ends the current mouse-driven pan by setting `isPanning` to `false`. */
  const endPan = () => {
    isPanning.value = false;
  };

  /**
   * Handles mouse-wheel events on the diagram wrapper.
   *
   * Zooming is only active when `Ctrl` is held or the diagram is in
   * fullscreen mode. Outside these conditions, the event propagates
   * normally so the page can scroll.
   *
   * The zoom factor is `±10 %` per wheel tick, clamped between
   * {@link MIN_SCALE} and {@link MAX_SCALE}.
   *
   * @param e - The `wheel` event on the diagram wrapper.
   */
  const handleWheel = (e: WheelEvent) => {
    const shouldHandleEvent = e.ctrlKey || isFullscreen.value;
    if (!shouldHandleEvent) {
      return;
    }

    e.preventDefault();

    // Always treat the wheel as zoom when fullscreen so mouse wheel behaves intuitively
    const delta = -Math.sign(e.deltaY) * 0.1;
    const newScale = scale.value * (1 + delta);

    // Apply bounds to prevent extreme zooming
    applyGestureZoom(newScale, e.clientX, e.clientY);
  };

  /**
   * Handles the start of a touch interaction.
   *
   * **Mobile non-fullscreen:**
   * - 1 finger → ignored (browser scrolls the page).
   * - 2 fingers → records the initial pinch distance and midpoint.
   *
   * **Desktop / fullscreen:**
   * - 1 finger → starts a panning operation.
   * - 2 fingers → starts a pinch-zoom operation.
   *
   * @param e - The `touchstart` event.
   */
  const handleTouchStart = (e: TouchEvent) => {
    if (isMobileNonFullscreen()) {
      if (e.touches.length === 2) {
        // Two fingers on mobile (non-fullscreen): track for pinch zoom + pan.
        // Prevent browser native viewport zoom for this gesture.
        e.preventDefault();
        touchPanning.value = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialTouchDistance.value = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        // Track midpoint so we can pan while pinching
        lastTouchX.value = (touch1.clientX + touch2.clientX) / 2;
        lastTouchY.value = (touch1.clientY + touch2.clientY) / 2;
      }
      // Single touch on mobile: do not intercept — let the page scroll.
      return;
    }

    if (e.touches.length === 1) {
      // Single touch - pan
      touchPanning.value = true;
      lastTouchX.value = e.touches[0].clientX;
      lastTouchY.value = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      touchPanning.value = false;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchDistance.value = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );
    }
  };

  /**
   * Handles ongoing touch movement.
   *
   * **Mobile non-fullscreen:**
   * - 1 finger → no-op (browser scroll).
   * - 2 fingers → simultaneous pinch-zoom and two-finger pan.
   *
   * **Desktop / fullscreen:**
   * - 1 finger → panning (delta applied to translate).
   * - 2 fingers → pinch-zoom with 20 % dampening factor.
   *
   * The zoom scale is clamped to `[0.2, 10]`.
   *
   * @param e - The `touchmove` event.
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (isMobileNonFullscreen()) {
      if (e.touches.length === 1) {
        // Single touch on mobile (non-fullscreen): do not intercept.
        // The browser will scroll the page naturally.
        return;
      }

      if (e.touches.length === 2) {
        // Two fingers on mobile (non-fullscreen): handle pinch zoom + pan.
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;

        // Pinch zoom
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        if (initialTouchDistance.value > 0) {
          const zoomRatio = currentDistance / initialTouchDistance.value;
          const newScale = scale.value * (1 + (zoomRatio - 1) * 0.2);
          applyGestureZoom(newScale, midX, midY);
          initialTouchDistance.value = currentDistance;
        }

        // Two-finger pan (midpoint tracking)
        const totalScale = getTotalScale();
        translateX.value += (midX - lastTouchX.value) / totalScale;
        translateY.value += (midY - lastTouchY.value) / totalScale;
        lastTouchX.value = midX;
        lastTouchY.value = midY;
      }
      return;
    }

    e.preventDefault(); // Prevent scrolling while interacting with diagram

    if (touchPanning.value && e.touches.length === 1) {
      // Handle panning
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchX.value;
      const deltaY = touch.clientY - lastTouchY.value;

      const totalScale = getTotalScale();
      translateX.value += deltaX / totalScale;
      translateY.value += deltaY / totalScale;

      lastTouchX.value = touch.clientX;
      lastTouchY.value = touch.clientY;
    } else if (e.touches.length === 2) {
      // Handle pinch zooming
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      if (initialTouchDistance.value > 0) {
        const zoomRatio = currentDistance / initialTouchDistance.value;

        // Apply a dampening factor to make zooming less sensitive
        const newScale = scale.value * (1 + (zoomRatio - 1) * 0.2);

        // Limit scale to reasonable bounds
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        applyGestureZoom(newScale, midX, midY);

        initialTouchDistance.value = currentDistance;
      }
    }
  };

  /** Resets touch-interaction state when all fingers are lifted. */
  const handleTouchEnd = () => {
    touchPanning.value = false;
    initialTouchDistance.value = 0;
  };

  /** Pans the diagram upward by `PAN_STEP / scale` pixels. */
  const panUp = () => {
    translateY.value -= PAN_STEP / getTotalScale();
  };

  /** Pans the diagram downward by `PAN_STEP / scale` pixels. */
  const panDown = () => {
    translateY.value += PAN_STEP / getTotalScale();
  };

  /** Pans the diagram to the left by `PAN_STEP / scale` pixels. */
  const panLeft = () => {
    translateX.value -= PAN_STEP / getTotalScale();
  };

  /** Pans the diagram to the right by `PAN_STEP / scale` pixels. */
  const panRight = () => {
    translateX.value += PAN_STEP / getTotalScale();
  };

  /**
   * Synchronises the `isFullscreen` reactive ref and the CSS
   * `force-show` class on the desktop and mobile toolbar containers
   * with the current state of the browser’s Fullscreen API.
   *
   * Called by the `fullscreenchange` event handler in
   * `MermaidDiagram.vue`.
   *
   * @param controlsRefs - Object holding nullable references to the
   *   desktop (`controls`) and mobile (`mobileControls`) toolbar
   *   container elements.
   */
  const updateFullscreenControls = (controlsRefs: {
    controls: HTMLElement | null;
    mobileControls: HTMLElement | null;
  }) => {
    try {
      if (document.fullscreenElement) {
        isFullscreen.value = true;
        if (controlsRefs.controls) {
          controlsRefs.controls.classList.add('force-show');
        }
        if (controlsRefs.mobileControls) {
          controlsRefs.mobileControls.classList.add('force-show');
        }
      } else {
        isFullscreen.value = false;
        if (controlsRefs.controls) {
          controlsRefs.controls.classList.remove('force-show');
        }
        if (controlsRefs.mobileControls) {
          controlsRefs.mobileControls.classList.remove('force-show');
        }
      }
    } catch (err) {
      console.error('Error updating fullscreen controls:', err);
    }
  };

  return {
    // State
    scale,
    translateX,
    translateY,
    isPanning,
    isFullscreen,

    // Actions
    zoomIn,
    zoomOut,
    resetView,
    fitDiagramToContainer,
    toggleFullscreen,
    startPan,
    pan,
    endPan,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    panUp,
    panDown,
    panLeft,
    panRight,
    updateFullscreenControls,
  };
}
