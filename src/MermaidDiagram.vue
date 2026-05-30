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
    v-if="mounted && isDialogFullscreenActive"
    class="mermaid-dialog-backdrop"
    @click="handleToggleFullscreen"
    aria-hidden="true"
  ></div>
  <div
    v-if="mounted"
    ref="fullscreenWrapper"
    class="mermaid-container"
    :class="{ 'dialog-fullscreen-active': isDialogFullscreenActive }"
    data-fullscreen-wrapper
  >
    <MermaidControls
      ref="controlsRef"
      :scale="scale"
      :code="code"
      :is-fullscreen="isFullscreen"
      :toolbar="resolvedToolbar"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-view="resetView"
      @toggle-fullscreen="handleToggleFullscreen"
      @pan-up="panUp"
      @pan-down="panDown"
      @pan-left="panLeft"
      @pan-right="panRight"
      @download="handleDownload"
    />

    <MermaidError
      :render-error="renderError"
      :render-error-details="renderErrorDetails"
      :error-text="resolvedToolbar.i18n.tooltips.renderErrorText"
      :show-details-text="resolvedToolbar.i18n.tooltips.toggleErrorDetailsText"
      :hide-details-text="
        resolvedToolbar.i18n.tooltips.toggleErrorDetailsHideText
      "
    />

    <div
      class="diagram-wrapper"
      tabindex="0"
      role="img"
      :aria-label="
        renderError ? 'Diagram rendering failed' : 'Interactive Mermaid diagram'
      "
      @keydown="handleKeyDown"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @wheel="handleWheelEvent"
      @touchstart="handleTouchStartEvent"
      @touchmove="handleTouchMoveEvent"
      @touchend="handleTouchEndEvent"
    >
      <!-- Screen-reader announcement for loading / rendered state -->
      <span role="status" aria-live="polite" class="sr-only">
        {{ isRendered ? 'Diagram loaded' : 'Loading diagram…' }}
      </span>
      <div
        :id="diagramId"
        class="mermaid"
        :aria-label="`Mermaid diagram: ${code.slice(0, 80)}`"
        :style="{
          opacity: isRendered ? 1 : 0,
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          cursor: isPanning ? 'grabbing' : 'grab',
        }"
      >
        {{ code }}
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
import { useMermaidNavigation } from './composables/useMermaidNavigation';
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
}>();

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

const navigation = useMermaidNavigation();
const renderer = useMermaidRenderer({
  config: props.config,
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
        handleWheel(wheelEvent);
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
      zoomIn();
      event.preventDefault();
      break;
    case '-':
      zoomOut();
      event.preventDefault();
      break;
    case '0':
      resetView();
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

onMounted(async () => {
  try {
    await nextTick();
    await renderMermaidDiagram(diagramId, props.code);

    onFullscreenChange(handleFullscreenChange);
    document.addEventListener(
      'vitepress-mermaid:toolbar-updated',
      handleToolbarUpdated,
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

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('mermaid-dialog-open');
  }
  offFullscreenChange(handleFullscreenChange);
  document.removeEventListener(
    'vitepress-mermaid:toolbar-updated',
    handleToolbarUpdated,
  );
});
</script>
