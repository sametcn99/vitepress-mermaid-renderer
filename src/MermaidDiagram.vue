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

const resolveIncomingToolbar = (
  toolbar?: MermaidToolbarOptions | ResolvedToolbarConfig,
): ResolvedToolbarConfig => {
  if (toolbar && isResolvedToolbarConfig(toolbar)) {
    return toolbar;
  }
  return resolveToolbarConfig(toolbar);
};

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

const controlsRef = ref<InstanceType<typeof MermaidControls> | null>(null);
const fullscreenWrapper = ref<HTMLElement | null>(null);

const instance = getCurrentInstance();
const diagramId = `mermaid-${instance?.uid ?? Math.random().toString(36).slice(2)}`;

const fullscreenBehavior = computed(() => resolvedToolbar.value.fullscreenMode);
const isDialogFullscreenActive = computed(
  () => isFullscreen.value && fullscreenBehavior.value === "dialog",
);

const handleToolbarUpdated = (event: Event) => {
  const customEvent = event as CustomEvent<
    MermaidToolbarOptions | ResolvedToolbarConfig | undefined
  >;
  resolvedToolbar.value = resolveIncomingToolbar(customEvent.detail);
};

const handleToggleFullscreen = () => {
  toggleFullscreen(fullscreenWrapper.value, fullscreenBehavior.value);
};

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

const handleMouseDown = (event: MouseEvent) => startPan(event);
const handleMouseMove = (event: MouseEvent) => pan(event);
const handleMouseUp = () => endPan();
const handleMouseLeave = () => endPan();
const handleWheelEvent = (event: WheelEvent) => handleWheel(event);
const handleTouchStartEvent = (event: TouchEvent) => handleTouchStart(event);
const handleTouchMoveEvent = (event: TouchEvent) => handleTouchMove(event);
const handleTouchEndEvent = () => handleTouchEnd();

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
