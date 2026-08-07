<!--
  @module MermaidDiagram

  Primary Vue component for rendering a single interactive Mermaid diagram.

  Orchestrates two composables:
  - `useMermaidNavigation` — zoom, pan, fullscreen, touch gestures.
  - `useMermaidRenderer`  — Mermaid library init, SVG rendering, error handling.

  And two child components:
  - `MermaidControls` — desktop and mobile toolbar buttons.
  - `MermaidError`    — error message display with expandable details.

  **Props:**
  - `code`    — Raw Mermaid source string (required).
  - `config`  — Optional Mermaid configuration override.
  - `toolbar` — Optional toolbar customisation (raw or pre-resolved).

  **Events:**
  - `renderComplete` — Emitted after each render attempt.

  Mounted by `MermaidRenderer.ts` for every discovered Mermaid code block,
  or usable standalone in custom VitePress layouts.
-->
<template>
  <div
    v-if="mounted && !isStatic && isDialogFullscreenActive"
    class="mermaid-dialog-backdrop"
    @click="handleToggleFullscreen"
    aria-hidden="true"
  ></div>
  <div
    v-if="mounted"
    ref="fullscreenWrapper"
    class="mermaid-container"
    :class="{
      'dialog-fullscreen-active': isDialogFullscreenActive,
      'static-mermaid-container': isStatic,
    }"
    data-fullscreen-wrapper
  >
    <MermaidControls
      v-if="!isStatic"
      ref="controlsRef"
      :scale="scale"
      :code="code"
      :is-fullscreen="isFullscreen"
      :toolbar="resolvedToolbar"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-view="handleResetView"
      @toggle-fullscreen="handleToggleFullscreen"
      @pan-up="panUp"
      @pan-down="panDown"
      @pan-left="panLeft"
      @pan-right="panRight"
      @download="handleDownload"
    />

    <MermaidError
      v-if="!isStatic"
      :render-error="renderError"
      :render-error-details="renderErrorDetails"
      :error-text="resolvedToolbar.i18n.tooltips.renderErrorText"
      :show-details-text="resolvedToolbar.i18n.tooltips.toggleErrorDetailsText"
      :hide-details-text="
        resolvedToolbar.i18n.tooltips.toggleErrorDetailsHideText
      "
    />

    <div
      ref="diagramWrapper"
      class="diagram-wrapper"
      :tabindex="isStatic ? undefined : 0"
      :role="isStatic ? undefined : 'img'"
      :aria-label="
        isStatic
          ? undefined
          : renderError
            ? 'Diagram rendering failed'
            : 'Interactive Mermaid diagram'
      "
      @keydown="!isStatic && handleKeyDown($event)"
      @mousedown="!isStatic && handleMouseDown($event)"
      @mousemove="!isStatic && handleMouseMove($event)"
      @mouseup="!isStatic && handleMouseUp()"
      @mouseleave="!isStatic && handleMouseLeave()"
      @wheel="!isStatic && handleWheelEvent($event)"
      @touchstart="!isStatic && handleTouchStartEvent($event)"
      @touchmove="!isStatic && handleTouchMoveEvent($event)"
      @touchend="!isStatic && handleTouchEndEvent()"
    >
      <span v-if="!isStatic" role="status" aria-live="polite" class="sr-only">
        {{ isRendered ? 'Diagram loaded' : 'Loading diagram…' }}
      </span>
      <div
        class="mermaid-viewport"
        :class="{ 'mermaid-zooming': isZoomTransitionActive }"
        :style="{
          transformOrigin,
          transform: isStatic
            ? undefined
            : `scale(${fitScale * scale}) translate(${fitTranslateX + translateX}px, ${fitTranslateY + translateY}px)`,
          cursor: isStatic ? undefined : isPanning ? 'grabbing' : 'grab',
        }"
      >
        <div
          :id="diagramId"
          class="mermaid"
          :aria-label="`Mermaid diagram: ${code.slice(0, 80)}`"
          :style="{ opacity: isRendered ? 1 : 0 }"
        >
          {{ code }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" clientOnly>
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import type { MermaidConfig } from 'mermaid';
import MermaidControls from './components/MermaidControls.vue';
import MermaidError from './components/MermaidError.vue';
import {
  useMermaidNavigation,
  type MermaidZoomChange,
} from './composables/useMermaidNavigation';
import { useMermaidRenderer } from './composables/useMermaidRenderer';
import {
  onFullscreenChange,
  offFullscreenChange,
} from './composables/useFullscreenManager';
import { useMermaidDownload } from './composables/useMermaidDownload';
import {
  isResolvedToolbarConfig,
  resolveToolbarConfig,
  type MermaidToolbarOptions,
  type ResolvedToolbarConfig,
} from './toolbar';

const emit = defineEmits<{
  (
    event: 'renderComplete',
    payload: { id: string; success: boolean; error?: unknown },
  ): void;
}>();

const props = defineProps<{
  code: string;
  config?: MermaidConfig;
  toolbar?: MermaidToolbarOptions | ResolvedToolbarConfig;
  static?: boolean;
  fitToContainer?: boolean;
}>();

/** Whether this instance renders a plain, non-interactive SVG. */
const isStatic = ref(props.static ?? false);

/** Whether this instance fits and centers its interactive diagram after rendering. */
const fitToContainer = ref(props.fitToContainer ?? false);

/**
 * Normalises the incoming `toolbar` prop, which may be either raw
 * consumer options ({@link MermaidToolbarOptions}) or an already-resolved
 * configuration ({@link ResolvedToolbarConfig}).
 *
 * When undefined or raw options are passed, they are resolved through
 * {@link resolveToolbarConfig}. If the value is already resolved (checked
 * by {@link isResolvedToolbarConfig}), it is returned as-is.
 *
 * @param toolbar - The toolbar prop value from the parent.
 * @returns A fully-resolved toolbar configuration object.
 */
const resolveIncomingToolbar = (
  toolbar?: MermaidToolbarOptions | ResolvedToolbarConfig,
): ResolvedToolbarConfig => {
  if (toolbar && isResolvedToolbarConfig(toolbar)) {
    return toolbar;
  }
  return resolveToolbarConfig(toolbar);
};

/**
 * Reactive, fully-resolved toolbar configuration used by `MermaidControls`.
 * Updated at mount time and whenever the `vitepress-mermaid:toolbar-updated`
 * custom event is received.
 */
const resolvedToolbar = ref<ResolvedToolbarConfig>(
  resolveIncomingToolbar(props.toolbar),
);

type DiagramView = {
  scale: number;
  translateX: number;
  translateY: number;
};

const navigation = useMermaidNavigation({
  onGestureZoom: handleGestureZoom,
});
const renderer = useMermaidRenderer({
  config: props.config,
  onBeforeRender: () => {
    if (!viewToRestoreAfterThemeRender) return;

    deactivateZoomTransition();
    resetView();
    fitScale.value = 1;
    fitTranslateX.value = 0;
    fitTranslateY.value = 0;
    return nextTick();
  },
  onRenderComplete: (payload) => emit('renderComplete', payload),
});

const {
  scale,
  translateX,
  translateY,
  isPanning,
  isFullscreen,
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
} = navigation;

const {
  mounted,
  isRendered,
  renderError,
  renderErrorDetails,
  renderMermaidDiagram,
} = renderer;

/** Reference to the `MermaidControls` child component instance for accessing its exposed methods. */
const controlsRef = ref<InstanceType<typeof MermaidControls> | null>(null);

/** Reference to the fullscreen wrapper `<div>` used as the Fullscreen API target. */
const fullscreenWrapper = ref<HTMLElement | null>(null);

/** Reference to the viewport that constrains the interactive diagram. */
const diagramWrapper = ref<HTMLElement | null>(null);

/** Transform origin expressed relative to the diagram viewport. */
const transformOrigin = ref('center center');
/** Base transform that fits the diagram without changing the user's zoom level. */
const fitScale = ref(1);
const fitTranslateX = ref(0);
const fitTranslateY = ref(0);
/** Enables the short zoom transition without affecting drag interactions. */
const isZoomTransitionActive = ref(false);
let zoomTransitionTimeout: ReturnType<typeof setTimeout> | null = null;
let diagramResizeObserver: ResizeObserver | null = null;
let viewToRestoreAfterThemeRender: DiagramView | null = null;

/**
 * Component-instance UID used to generate a globally unique `id`
 * attribute for the Mermaid container `<div>`. Falls back to a random
 * string when the UID is unavailable.
 */
const instance = getCurrentInstance();
/**
 * Unique DOM id assigned to the inner `.mermaid` container element.
 * Used by `useMermaidRenderer.renderMermaidDiagram()` to locate the
 * target element via `document.getElementById()`.
 */
const diagramId = `mermaid-${instance?.uid ?? Math.random().toString(36).slice(2)}`;

/** Download handler extracted into a composable for testability and separation of concerns. */
const { handleDownload } = useMermaidDownload({ diagramId });

/**
 * Computed fullscreen behaviour derived from the resolved toolbar config.
 * Either `"browser"` (native Fullscreen API) or `"dialog"` (CSS overlay).
 */
const fullscreenBehavior = computed(() => resolvedToolbar.value.fullscreenMode);

/**
 * `true` when the dialog-style fullscreen overlay is currently active.
 * Drives the `.dialog-fullscreen-active` CSS class and the backdrop
 * visibility.
 */
const isDialogFullscreenActive = computed(
  () => isFullscreen.value && fullscreenBehavior.value === 'dialog',
);

/**
 * Listener for the `vitepress-mermaid:toolbar-updated` custom event.
 * Re-resolves the toolbar configuration so that already-mounted diagrams
 * react to global toolbar changes dispatched by `MermaidRenderer`.
 *
 * @param event - The custom event carrying updated toolbar options.
 */
const handleToolbarUpdated = (event: Event) => {
  const customEvent = event as CustomEvent<
    MermaidToolbarOptions | ResolvedToolbarConfig | undefined
  >;
  resolvedToolbar.value = resolveIncomingToolbar(customEvent.detail);
};

/** Applies a global static-mode change from the shared renderer. */
const handleStaticModeUpdated = (event: Event) => {
  isStatic.value = (event as CustomEvent<boolean>).detail;
};

/** Applies the configured fit mode after Vue has committed the rendered SVG. */
const applyFitToContainer = async (viewToRestore?: DiagramView) => {
  if (!fitToContainer.value || isStatic.value) return;

  resetView();
  fitScale.value = 1;
  fitTranslateX.value = 0;
  fitTranslateY.value = 0;
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  if (!fitToContainer.value || isStatic.value) return;
  fitDiagramToContainer(
    diagramWrapper.value,
    document.getElementById(diagramId),
  );
  fitScale.value = scale.value;
  fitTranslateX.value = translateX.value;
  fitTranslateY.value = translateY.value;

  if (viewToRestore) {
    scale.value = viewToRestore.scale;
    translateX.value = viewToRestore.translateX;
    translateY.value = viewToRestore.translateY;
    return;
  }

  resetView();
};

/** Recalculates the fit base after a theme-driven Mermaid rerender. */
const handleConfigUpdated = () => {
  viewToRestoreAfterThemeRender = {
    scale: scale.value,
    translateX: translateX.value,
    translateY: translateY.value,
  };
};

/** Updates the fitting mode for already-mounted diagrams. */
const handleFitToContainerUpdated = (event: Event) => {
  fitToContainer.value = (event as CustomEvent<boolean>).detail;
};

/** Resets to the fitted view when automatic fitting is enabled. */
const handleResetView = () => {
  deactivateZoomTransition();
  if (fitToContainer.value && !isStatic.value) {
    void applyFitToContainer();
    return;
  }

  resetView();
};

/** Enables the zoom transition briefly for discrete zoom actions. */
const activateZoomTransition = () => {
  isZoomTransitionActive.value = true;
  if (zoomTransitionTimeout) clearTimeout(zoomTransitionTimeout);
  zoomTransitionTimeout = setTimeout(() => {
    isZoomTransitionActive.value = false;
    zoomTransitionTimeout = null;
  }, 300);
};

/** Stops an active zoom transition before a view is measured or reset. */
const deactivateZoomTransition = () => {
  isZoomTransitionActive.value = false;
  if (zoomTransitionTimeout) {
    clearTimeout(zoomTransitionTimeout);
    zoomTransitionTimeout = null;
  }
};

/** Keeps a fullscreen gesture's focal point stationary while zooming. */
function handleGestureZoom(change: MermaidZoomChange) {
  preserveFullscreenZoomAnchor(
    change.previousScale,
    change.scale,
    change.clientX,
    change.clientY,
  );
}

/** Preserves a client-space point while the total fit and user scale changes. */
function preserveFullscreenZoomAnchor(
  previousUserScale: number,
  nextUserScale: number,
  clientX: number,
  clientY: number,
) {
  if (
    !isFullscreen.value ||
    !diagramWrapper.value ||
    previousUserScale === nextUserScale
  ) {
    return;
  }

  const wrapperBounds = diagramWrapper.value.getBoundingClientRect();
  const previousScale = fitScale.value * previousUserScale;
  const nextScale = fitScale.value * nextUserScale;
  if (previousScale <= 0 || nextScale <= 0) return;

  const focalX = clientX - wrapperBounds.left;
  const focalY = clientY - wrapperBounds.top;
  const originX = wrapperBounds.width / 2;
  const originY = wrapperBounds.height / 2;

  translateX.value += (focalX - originX) * (1 / nextScale - 1 / previousScale);
  translateY.value += (focalY - originY) * (1 / nextScale - 1 / previousScale);
}

/** Gets the current screen-space center of the rendered SVG. */
function getSvgCenter() {
  const svg = document.getElementById(diagramId)?.querySelector('svg');
  if (!svg) return null;

  const bounds = svg.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  return {
    clientX: bounds.left + bounds.width / 2,
    clientY: bounds.top + bounds.height / 2,
  };
}

/** Zooms in with a short transition. */
const handleZoomIn = () => {
  const svgCenter = getSvgCenter();
  const previousScale = scale.value;
  activateZoomTransition();
  zoomIn();
  if (svgCenter) {
    preserveFullscreenZoomAnchor(
      previousScale,
      scale.value,
      svgCenter.clientX,
      svgCenter.clientY,
    );
  }
};

/** Zooms out with a short transition. */
const handleZoomOut = () => {
  const svgCenter = getSvgCenter();
  const previousScale = scale.value;
  activateZoomTransition();
  zoomOut();
  if (svgCenter) {
    preserveFullscreenZoomAnchor(
      previousScale,
      scale.value,
      svgCenter.clientX,
      svgCenter.clientY,
    );
  }
};

/** Keeps zooming centered on the visible diagram container. */
const updateTransformOrigin = () => {
  if (isStatic.value || !diagramWrapper.value) return;
  const bounds = diagramWrapper.value.getBoundingClientRect();
  if (bounds.width > 0 && bounds.height > 0) {
    transformOrigin.value = `${bounds.width / 2}px ${bounds.height / 2}px`;
  }
};

/**
 * Toggles fullscreen using the configured behaviour (`"browser"` or
 * `"dialog"`) on the fullscreen wrapper element.
 */
const handleToggleFullscreen = () => {
  toggleFullscreen(fullscreenWrapper.value, fullscreenBehavior.value);
};

/** @internal Thin wrappers forwarding DOM events to composable actions. */
const handleMouseDown = (event: MouseEvent) => startPan(event);
const handleMouseUp = () => endPan();
const handleMouseLeave = () => endPan();
const handleTouchStartEvent = (event: TouchEvent) => handleTouchStart(event);
const handleTouchEndEvent = () => handleTouchEnd();

/**
 * requestAnimationFrame throttle state for high-frequency events.
 * Prevents reactive style updates from firing more than once per frame.
 */
let wheelRafPending = false;
let moveRafPending = false;
let wheelEvent: WheelEvent | null = null;
let moveEvent: MouseEvent | null = null;

/** @internal rAF-throttled wheel handler — coalesces rapid wheel events. */
const handleWheelEvent = (event: WheelEvent) => {
  wheelEvent = event;
  if (!wheelRafPending) {
    wheelRafPending = true;
    requestAnimationFrame(() => {
      wheelRafPending = false;
      if (wheelEvent) {
        const previousScale = scale.value;
        handleWheel(wheelEvent);
        if (scale.value !== previousScale) activateZoomTransition();
        wheelEvent = null;
      }
    });
  }
};

/** @internal rAF-throttled mousemove handler — coalesces rapid mouse moves during pan. */
const handleMouseMove = (event: MouseEvent) => {
  if (!isPanning.value) return;
  moveEvent = event;
  if (!moveRafPending) {
    moveRafPending = true;
    requestAnimationFrame(() => {
      moveRafPending = false;
      if (moveEvent) {
        pan(moveEvent);
        moveEvent = null;
      }
    });
  }
};

/** @internal rAF-throttled touchmove handler — keeps composable's logic but coalesces frames. */
const handleTouchMoveEvent = (event: TouchEvent) => handleTouchMove(event);

/**
 * Keyboard navigation handler — allows zoom / pan / reset / fullscreen
 * without a mouse.
 */
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case '+':
    case '=':
      handleZoomIn();
      event.preventDefault();
      break;
    case '-':
      handleZoomOut();
      event.preventDefault();
      break;
    case '0':
      handleResetView();
      event.preventDefault();
      break;
    case 'ArrowUp':
      panUp();
      event.preventDefault();
      break;
    case 'ArrowDown':
      panDown();
      event.preventDefault();
      break;
    case 'ArrowLeft':
      panLeft();
      event.preventDefault();
      break;
    case 'ArrowRight':
      panRight();
      event.preventDefault();
      break;
    case 'f':
      handleToggleFullscreen();
      event.preventDefault();
      break;
  }
};

/**
 * Synchronises the toolbar `force-show` class and `isFullscreen` ref
 * whenever the browser's fullscreen state changes. Delegates to
 * {@link useMermaidNavigation.updateFullscreenControls}.
 */
const handleFullscreenChange = () => {
  const controlsElements = {
    controls: controlsRef.value?.$refs.controls as HTMLElement | null,
    mobileControls: controlsRef.value?.$refs
      .mobileControls as HTMLElement | null,
  };
  updateFullscreenControls(controlsElements);
};

let fullscreenChangeListenerRegistered = false;

/** Registers fullscreen state updates only while interactive controls are active. */
const registerFullscreenChangeListener = () => {
  if (!fullscreenChangeListenerRegistered) {
    onFullscreenChange(handleFullscreenChange);
    fullscreenChangeListenerRegistered = true;
  }
};

/** Removes fullscreen state updates while static SVG mode is active. */
const unregisterFullscreenChangeListener = () => {
  if (fullscreenChangeListenerRegistered) {
    offFullscreenChange(handleFullscreenChange);
    fullscreenChangeListenerRegistered = false;
  }
};

onMounted(async () => {
  try {
    await nextTick();
    await renderMermaidDiagram(diagramId, props.code);
    updateTransformOrigin();
    await applyFitToContainer();
    if (typeof ResizeObserver !== 'undefined' && diagramWrapper.value) {
      diagramResizeObserver = new ResizeObserver(updateTransformOrigin);
      diagramResizeObserver.observe(diagramWrapper.value);
    }

    if (!isStatic.value) {
      registerFullscreenChangeListener();
    }
    document.addEventListener(
      'vitepress-mermaid:toolbar-updated',
      handleToolbarUpdated,
    );
    document.addEventListener(
      'vitepress-mermaid:static-mode-updated',
      handleStaticModeUpdated,
    );
    document.addEventListener(
      'vitepress-mermaid:fit-to-container-updated',
      handleFitToContainerUpdated,
    );
    document.addEventListener(
      'vitepress-mermaid:config-updated',
      handleConfigUpdated,
    );
  } catch (error) {
    console.error('Error in component initialization:', error);
  }
});

watch(isDialogFullscreenActive, (active) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.toggle('mermaid-dialog-open', active);
});

watch(isStatic, (staticMode) => {
  if (staticMode) {
    unregisterFullscreenChangeListener();
  } else {
    registerFullscreenChangeListener();
  }
});

watch(isRendered, (rendered) => {
  if (rendered && viewToRestoreAfterThemeRender) {
    const viewToRestore = viewToRestoreAfterThemeRender;
    viewToRestoreAfterThemeRender = null;
    if (fitToContainer.value && !isStatic.value) {
      void applyFitToContainer(viewToRestore);
      return;
    }

    scale.value = viewToRestore.scale;
    translateX.value = viewToRestore.translateX;
    translateY.value = viewToRestore.translateY;
  }
});

watch(
  [fitToContainer, isStatic],
  ([enabled, staticMode], [previousEnabled, previousStaticMode]) => {
    if (
      enabled &&
      !staticMode &&
      (enabled !== previousEnabled || staticMode !== previousStaticMode)
    ) {
      updateTransformOrigin();
      void applyFitToContainer();
    }
  },
);

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('mermaid-dialog-open');
  }
  unregisterFullscreenChangeListener();
  if (zoomTransitionTimeout) clearTimeout(zoomTransitionTimeout);
  diagramResizeObserver?.disconnect();
  document.removeEventListener(
    'vitepress-mermaid:toolbar-updated',
    handleToolbarUpdated,
  );
  document.removeEventListener(
    'vitepress-mermaid:static-mode-updated',
    handleStaticModeUpdated,
  );
  document.removeEventListener(
    'vitepress-mermaid:fit-to-container-updated',
    handleFitToContainerUpdated,
  );
  document.removeEventListener(
    'vitepress-mermaid:config-updated',
    handleConfigUpdated,
  );
});
</script>
