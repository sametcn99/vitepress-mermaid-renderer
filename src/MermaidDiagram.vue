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
    />

    <div
      class="diagram-wrapper"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @wheel="handleWheelEvent"
      @touchstart="handleTouchStartEvent"
      @touchmove="handleTouchMoveEvent"
      @touchend="handleTouchEndEvent"
    >
      <div
        :id="diagramId"
        class="mermaid"
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
} from "vue";
import type { MermaidConfig } from "mermaid";
import "./style.css";
import MermaidControls from "./components/MermaidControls.vue";
import MermaidError from "./components/MermaidError.vue";
import { useMermaidNavigation } from "./composables/useMermaidNavigation";
import { useMermaidRenderer } from "./composables/useMermaidRenderer";
import {
  isResolvedToolbarConfig,
  resolveToolbarConfig,
  type DownloadFormat,
  type MermaidToolbarOptions,
  type ResolvedToolbarConfig,
} from "./toolbar";

const emit = defineEmits<{
  (
    event: "renderComplete",
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
  onRenderComplete: (payload) => emit("renderComplete", payload),
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
  () => isFullscreen.value && fullscreenBehavior.value === "dialog",
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

/**
 * Downloads the rendered SVG diagram in the requested format.
 *
 * **SVG** — Serialises the SVG element and triggers a direct blob
 * download.
 *
 * **PNG / JPEG** — Loads the serialised SVG into an `Image`, draws it
 * onto a `<canvas>`, and converts the canvas to a data URL for
 * download. A white background is composited for raster formats.
 *
 * @param format - The target download format (`"svg"`, `"png"`, or `"jpeg"`).
 */
const handleDownload = async (format: DownloadFormat) => {
  const container = document.getElementById(diagramId);
  const svgElement = container?.querySelector("svg");

  if (!svgElement) {
    console.error("SVG element not found for download");
    return;
  }

  const svgClone = svgElement.cloneNode(true) as SVGElement;
  if (format !== "svg") {
    svgClone.style.backgroundColor = "white";
  }

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.download = `diagram.${format}`;

  if (format === "svg") {
    downloadLink.href = url;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    return;
  }

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const bbox = svgElement.viewBox.baseVal;
    let width = bbox?.width;
    let height = bbox?.height;

    if (!width || !height) {
      const rect = svgElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);

      const imageType = format === "png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(imageType);
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    URL.revokeObjectURL(url);
  };

  img.onerror = (error) => {
    console.error("Failed to load SVG for conversion", error);
    URL.revokeObjectURL(url);
  };

  img.src = url;
};

/** @internal Thin wrappers forwarding DOM events to composable actions. */
const handleMouseDown = (event: MouseEvent) => startPan(event);
const handleMouseMove = (event: MouseEvent) => pan(event);
const handleMouseUp = () => endPan();
const handleMouseLeave = () => endPan();
const handleWheelEvent = (event: WheelEvent) => handleWheel(event);
const handleTouchStartEvent = (event: TouchEvent) => handleTouchStart(event);
const handleTouchMoveEvent = (event: TouchEvent) => handleTouchMove(event);
const handleTouchEndEvent = () => handleTouchEnd();

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

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener(
      "vitepress-mermaid:toolbar-updated",
      handleToolbarUpdated,
    );
  } catch (error) {
    console.error("Error in component initialization:", error);
  }
});

watch(isDialogFullscreenActive, (active) => {
  if (typeof document === "undefined") {
    return;
  }
  document.body.classList.toggle("mermaid-dialog-open", active);
});

onUnmounted(() => {
  if (typeof document !== "undefined") {
    document.body.classList.remove("mermaid-dialog-open");
  }
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener(
    "webkitfullscreenchange",
    handleFullscreenChange,
  );
  document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
  document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
  document.removeEventListener(
    "vitepress-mermaid:toolbar-updated",
    handleToolbarUpdated,
  );
});
</script>
