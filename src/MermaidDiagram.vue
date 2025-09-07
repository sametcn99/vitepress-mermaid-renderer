<template>
  <div class="mermaid-container" v-if="mounted">
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
    />

    <!-- Error Component -->
    <MermaidError
      :render-error="renderError"
      :render-error-details="renderErrorDetails"
    />

    <div
      class="diagram-wrapper"
      ref="diagramWrapper"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @wheel.prevent="handleWheel"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div
        :id="id"
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
import { onMounted, ref, onUnmounted, nextTick } from "vue";
import type { MermaidConfig } from "mermaid";
import "./style.css";
import MermaidControls from "./components/MermaidControls.vue";
import MermaidError from "./components/MermaidError.vue";
import { useMermaidNavigation } from "./composables/useMermaidNavigation";
import { useMermaidRenderer } from "./composables/useMermaidRenderer";

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
}>();

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
const diagramWrapper = ref<HTMLElement | null>(null);

// Generate unique ID for the diagram
const id = `mermaid-${Math.random().toString(36).slice(2)}`;

// Handle fullscreen toggle with wrapper reference
const handleToggleFullscreen = () => {
  toggleFullscreen(diagramWrapper.value);
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
    await renderMermaidDiagram(id, props.code);

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
