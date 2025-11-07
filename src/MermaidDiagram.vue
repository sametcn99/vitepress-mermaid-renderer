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
