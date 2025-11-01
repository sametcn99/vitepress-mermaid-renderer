<template>
  <div>
    <!-- Desktop Controls -->
    <div class="desktop-controls controls visible-controls" ref="controls">
      <button @click="$emit('zoomIn')" title="Zoom In">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="$emit('zoomOut')" title="Zoom Out">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      <button @click="$emit('resetView')" title="Reset View">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.9 3.2L21 8"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.9-3.2L3 16"></path>
        </svg>
      </button>
      <button @click="copyDiagramCode" title="Copy Code">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path
            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
          ></path>
        </svg>
        <span v-if="showCopied" class="copied-notification">Copied</span>
      </button>
      <button @click="$emit('toggleFullscreen')" title="Toggle Fullscreen">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
          ></path>
        </svg>
      </button>
    </div>

    <!-- Mobile Controls -->
    <div class="mobile-controls controls visible-controls" ref="mobileControls">
      <div class="mobile-utility-controls">
        <button @click="$emit('resetView')" title="Reset View">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.9 3.2L21 8"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.9-3.2L3 16"></path>
          </svg>
        </button>
        <button @click="copyDiagramCode" title="Copy Code">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            ></path>
          </svg>
          <span v-if="showCopied" class="copied-notification">Copied</span>
        </button>
        <button @click="$emit('toggleFullscreen')" title="Toggle Fullscreen">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  scale: number;
  code: string;
  isFullscreen: boolean;
}>();

// Define emits
const emit = defineEmits<{
  (event: "zoomIn"): void;
  (event: "zoomOut"): void;
  (event: "resetView"): void;
  (event: "toggleFullscreen"): void;
  (event: "panUp"): void;
  (event: "panDown"): void;
  (event: "panLeft"): void;
  (event: "panRight"): void;
}>();

const controls = ref<HTMLElement | null>(null);
const mobileControls = ref<HTMLElement | null>(null);
const showCopied = ref(false);

const copyDiagramCode = async () => {
  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard API not available in this browser.");
    }
    await navigator.clipboard.writeText(props.code);
    showCopied.value = true;
    setTimeout(() => {
      showCopied.value = false;
    }, 1000);
  } catch (err) {
    console.error("Failed to copy diagram code:", err);
    alert(
      "Failed to copy to clipboard. Your browser might not support this feature.",
    );
  }
};

const updateFullscreenControls = () => {
  try {
    if (props.isFullscreen) {
      if (controls.value) {
        controls.value.classList.add("force-show");
      }
      if (mobileControls.value) {
        mobileControls.value.classList.add("force-show");
      }
    } else {
      if (controls.value) {
        controls.value.classList.remove("force-show");
      }
      if (mobileControls.value) {
        mobileControls.value.classList.remove("force-show");
      }
    }
  } catch (err) {
    console.error("Error updating fullscreen controls:", err);
  }
};

onMounted(() => {
  // Set controls visible immediately
  if (controls.value) {
    controls.value.style.opacity = "1";
    controls.value.style.visibility = "visible";
  }

  if (mobileControls.value) {
    mobileControls.value.style.opacity = "1";
    mobileControls.value.style.visibility = "visible";
  }
});

// Expose methods that parent might need
defineExpose({
  updateFullscreenControls,
});
</script>
