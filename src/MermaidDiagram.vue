<template>
  <div
    v-if="mounted"
    ref="fullscreenWrapper"
    class="mermaid-container"
    data-fullscreen-wrapper
  >
    <!-- Controls Component -->
    <MermaidControls
      ref="controlsRef"
      :scale="scale"
      :code="code"
      :is-fullscreen="isFullscreen"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-view="resetView"
      @toggle-fullscreen="handleToggleFullscreen"
      @pan-up="panUp"
      @pan-down="panDown"
      @pan-left="panLeft"
      @pan-right="panRight"
      @download="handleDownload"
      :toolbar="resolvedToolbar"
    />

    <!-- Error Component -->
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
  onMounted,
  ref,
  onUnmounted,
  nextTick,
} from "vue";
import type { MermaidConfig } from "mermaid";
import "./style.css";
import MermaidControls from "./components/MermaidControls.vue";
import MermaidError from "./components/MermaidError.vue";
import { useMermaidNavigation } from "./composables/useMermaidNavigation";
import { useMermaidRenderer } from "./composables/useMermaidRenderer";
import {
  resolveToolbarConfig,
  type MermaidToolbarOptions,
  type ResolvedToolbarConfig,
  isResolvedToolbarConfig,
  type DownloadFormat,
} from "./toolbar";

// Define emits
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

const resolvedToolbar = computed<ResolvedToolbarConfig>(() => {
  if (props.toolbar && isResolvedToolbarConfig(props.toolbar)) {
    return props.toolbar;
  }
  return resolveToolbarConfig(props.toolbar);
});

// Use composables
const navigation = useMermaidNavigation();
const renderer = useMermaidRenderer({
  config: props.config,
  onRenderComplete: (payload) => emit("renderComplete", payload),
});

// Extract state and actions from composables
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

// Component refs
const controlsRef = ref<InstanceType<typeof MermaidControls> | null>(null);
const fullscreenWrapper = ref<HTMLElement | null>(null);

// Generate deterministic ID for SSR/client consistency using component uid
const instance = getCurrentInstance();
const diagramId = `mermaid-${instance?.uid ?? Math.random().toString(36).slice(2)}`;

// Handle fullscreen toggle with wrapper reference
const handleToggleFullscreen = () => {
  toggleFullscreen(fullscreenWrapper.value);
};

const handleDownload = async (format: DownloadFormat) => {
  const container = document.getElementById(diagramId);
  const svgElement = container?.querySelector("svg");

  if (!svgElement) {
    console.error("SVG element not found for download");
    return;
  }

  // Clone to avoid modifying the displayed diagram
  const svgClone = svgElement.cloneNode(true) as SVGElement;

  // Add white background for non-transparent export (important for PNG/JPG)
  if (format !== "svg") {
    svgClone.style.backgroundColor = "white";
  }

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  // Simple sanitizer for filename
  const filename = "diagram";
  downloadLink.download = `${filename}.${format}`;

  if (format === "svg") {
    downloadLink.href = url;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  } else {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Use bounding box or viewBox for size
      const bbox = svgElement.viewBox.baseVal;
      // Fallback to width/height attributes if viewBox is missing, or getBoundingClientRect
      let width = bbox?.width;
      let height = bbox?.height;

      if (!width || !height) {
        const rect = svgElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      }

      // Handle scaling for better quality?
      // Current implementation uses 1:1 of the viewBox/size.

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Fill white background again for canvas
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
    img.onerror = (e) => {
      console.error("Failed to load SVG for conversion", e);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
};

const handleMouseDown = (event: MouseEvent) => {
  startPan(event);
};

const handleMouseMove = (event: MouseEvent) => {
  pan(event);
};

const handleMouseUp = () => {
  endPan();
};

const handleMouseLeave = () => {
  endPan();
};

const handleWheelEvent = (event: WheelEvent) => {
  handleWheel(event);
};

const handleTouchStartEvent = (event: TouchEvent) => {
  handleTouchStart(event);
};

const handleTouchMoveEvent = (event: TouchEvent) => {
  handleTouchMove(event);
};

const handleTouchEndEvent = () => {
  handleTouchEnd();
};

// Track fullscreen changes to update controls visibility
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
    // Use nextTick to ensure the DOM is updated
    await nextTick();

    // Start the rendering process with retry capabilities
    await renderMermaidDiagram(diagramId, props.code);

    // Add fullscreen change event listeners with cross-browser support
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
  } catch (error) {
    console.error("Error in component initialization:", error);
  }
});

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener(
    "webkitfullscreenchange",
    handleFullscreenChange,
  );
  document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
  document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
});
</script>
