<!--
  @module MermaidControls

  Toolbar component that renders desktop and mobile control bars for
  interacting with a Mermaid diagram. Buttons include zoom in / out,
  reset view, copy code, download, and toggle fullscreen.

  Visibility and layout are driven by the resolved toolbar configuration
  passed via the `toolbar` prop. In fullscreen mode, the fullscreen
  overrides take precedence.

  **Props:**
  - `scale`        — Current zoom scale (displayed as percentage).
  - `code`         — Raw Mermaid source (used by copy-to-clipboard).
  - `isFullscreen` — Whether the diagram is currently fullscreen.
  - `toolbar`      — Resolved toolbar configuration.

  **Emits:**
  `zoomIn`, `zoomOut`, `resetView`, `toggleFullscreen`, `panUp`,
  `panDown`, `panLeft`, `panRight`, `download`.

  **Exposes:**
  `updateFullscreenControls()` — called by the parent to sync CSS
  classes with the Fullscreen API state.
-->
<template>
  <div>
    <!-- Desktop Controls -->
    <div
      v-if="shouldRenderDesktopContainer"
      class="desktop-controls controls visible-controls"
      :class="desktopPositionClasses"
      ref="controls"
    >
      <button
        v-if="isDesktopEnabled('zoomIn')"
        @click="$emit('zoomIn')"
        :title="tooltipText('zoomIn')"
        :aria-label="tooltipText('zoomIn')"
        data-mermaid-control="zoomIn"
      >
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
      <span v-if="shouldShowDesktopZoomLevel" class="zoom-level">
        {{ Math.round(scale * 100) }}%
      </span>
      <button
        v-if="isDesktopEnabled('zoomOut')"
        @click="$emit('zoomOut')"
        :title="tooltipText('zoomOut')"
        :aria-label="tooltipText('zoomOut')"
        data-mermaid-control="zoomOut"
      >
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
      <button
        v-if="isDesktopEnabled('resetView')"
        @click="$emit('resetView')"
        :title="tooltipText('resetView')"
        :aria-label="tooltipText('resetView')"
        data-mermaid-control="resetView"
      >
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
      <button
        v-if="isDesktopEnabled('copyCode')"
        @click="copyDiagramCode"
        :title="tooltipText('copyCode')"
        :aria-label="tooltipText('copyCode')"
        data-mermaid-control="copyCode"
      >
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
      <button
        v-if="isDesktopEnabled('download')"
        @click="emitDownload"
        :title="tooltipText('download')"
        :aria-label="tooltipText('download')"
        data-mermaid-control="download"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
      <button
        v-if="isDesktopEnabled('toggleFullscreen')"
        @click="$emit('toggleFullscreen')"
        :title="tooltipText('toggleFullscreen')"
        :aria-label="tooltipText('toggleFullscreen')"
        data-mermaid-control="toggleFullscreen"
      >
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
    <div
      v-if="shouldRenderMobileContainer"
      class="mobile-controls controls visible-controls"
      :class="mobilePositionClasses"
      ref="mobileControls"
    >
      <div class="mobile-utility-controls">
        <button
          v-if="isMobileEnabled('zoomIn')"
          @click="$emit('zoomIn')"
          :title="tooltipText('zoomIn')"
          :aria-label="tooltipText('zoomIn')"
          data-mermaid-control="zoomIn"
        >
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
        <span
          v-if="shouldShowMobileZoomLevel"
          class="zoom-level mobile-zoom-level"
        >
          {{ Math.round(scale * 100) }}%
        </span>
        <button
          v-if="isMobileEnabled('zoomOut')"
          @click="$emit('zoomOut')"
          :title="tooltipText('zoomOut')"
          :aria-label="tooltipText('zoomOut')"
          data-mermaid-control="zoomOut"
        >
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
        <button
          v-if="isMobileEnabled('resetView')"
          @click="$emit('resetView')"
          :title="tooltipText('resetView')"
          :aria-label="tooltipText('resetView')"
          data-mermaid-control="resetView"
        >
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
        <button
          v-if="isMobileEnabled('copyCode')"
          @click="copyDiagramCode"
          :title="tooltipText('copyCode')"
          :aria-label="tooltipText('copyCode')"
          data-mermaid-control="copyCode"
        >
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
        <button
          v-if="isMobileEnabled('download')"
          @click="emitDownload"
          :title="tooltipText('download')"
          :aria-label="tooltipText('download')"
          data-mermaid-control="download"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <button
          v-if="isMobileEnabled('toggleFullscreen')"
          @click="$emit('toggleFullscreen')"
          :title="tooltipText('toggleFullscreen')"
          :aria-label="tooltipText('toggleFullscreen')"
          data-mermaid-control="toggleFullscreen"
        >
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
import { computed, onMounted, ref } from "vue";
import type {
  DesktopToolbarButton,
  MobileToolbarButton,
  ResolvedToolbarConfig,
  ToolbarPosition,
  ToolbarButtonState,
  ToolbarTooltipKey,
  DownloadFormat,
} from "../toolbar";

const props = defineProps<{
  scale: number;
  code: string;
  isFullscreen: boolean;
  toolbar: ResolvedToolbarConfig;
}>();

/**
 * Returns the toolbar mode configuration for the desktop toolbar.
 * When the diagram is in fullscreen, fullscreen overrides are used;
 * otherwise the desktop-specific settings apply.
 *
 * @returns The active {@link ToolbarModeConfig} for desktop display.
 */
const getDesktopSource = () =>
  props.isFullscreen ? props.toolbar.fullscreen : props.toolbar.desktop;

/**
 * Returns the toolbar mode configuration for the mobile toolbar.
 * When the diagram is in fullscreen, fullscreen overrides are used;
 * otherwise the mobile-specific settings apply.
 *
 * @returns The active {@link ToolbarModeConfig} for mobile display.
 */
const getMobileSource = () =>
  props.isFullscreen ? props.toolbar.fullscreen : props.toolbar.mobile;

/**
 * Checks whether a specific desktop toolbar button is enabled.
 *
 * @param button - The button identifier to check (e.g. `"zoomIn"`,
 *   `"download"`).
 * @returns `true` if the button state is `"enabled"` in the active
 *   desktop toolbar source.
 */
const isDesktopEnabled = (button: DesktopToolbarButton) => {
  return getDesktopSource().buttons[button] === "enabled";
};

/**
 * Checks whether a specific mobile toolbar button is enabled.
 *
 * @param button - The button identifier to check.
 * @returns `true` if the button state is `"enabled"` in the active
 *   mobile toolbar source.
 */
const isMobileEnabled = (button: MobileToolbarButton) => {
  const source = getMobileSource();
  return source.buttons[button] === "enabled";
};

/**
 * Returns the resolved tooltip text for a given button key.
 *
 * Reads from `props.toolbar.i18n.tooltips`, which is always fully
 * populated by `resolveToolbarConfig()`. Used as the value of both the
 * native `title` attribute and `aria-label` so the visual tooltip and
 * accessible name stay in sync across locales.
 *
 * @param key - The canonical tooltip key (matches the button id).
 * @returns The localized tooltip string for the active locale.
 */
const tooltipText = (key: ToolbarTooltipKey): string =>
  props.toolbar.i18n.tooltips[key];

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
  (event: "download", format: DownloadFormat): void;
}>();

/** Template ref for the desktop controls container. */
const controls = ref<HTMLElement | null>(null);
/** Template ref for the mobile controls container. */
const mobileControls = ref<HTMLElement | null>(null);
/** Briefly `true` after a successful copy-to-clipboard operation. */
const showCopied = ref(false);

/**
 * Converts a {@link ToolbarPosition} object into an array of CSS class
 * names used for absolute positioning of the toolbar containers.
 *
 * @param position - The vertical and horizontal position settings.
 * @returns An array of two CSS class strings, e.g.
 *   `["toolbar-vertical-top", "toolbar-horizontal-right"]`.
 */
const createPositionClasses = (position: ToolbarPosition) => {
  return [
    `toolbar-vertical-${position.vertical}`,
    `toolbar-horizontal-${position.horizontal}`,
  ];
};

/** Computed CSS position classes for the desktop toolbar. */
const desktopPositionClasses = computed(() => {
  const position = getDesktopSource().positions;
  return createPositionClasses(position);
});

/** Computed CSS position classes for the mobile toolbar. */
const mobilePositionClasses = computed(() => {
  const position = getMobileSource().positions;
  return createPositionClasses(position);
});

/**
 * Returns `true` if at least one button in the given record has state
 * `"enabled"`. Used to determine whether a toolbar container should
 * be rendered at all.
 *
 * @typeParam T - The union of button name strings.
 * @param buttons - A record mapping button names to their states.
 * @returns Whether any button is enabled.
 */
const hasEnabledButtons = <T extends string>(
  buttons: Record<T, ToolbarButtonState>,
) => Object.values(buttons).some((state) => state === "enabled");

/** `true` when the desktop zoom-level badge (e.g. "150 %") should be visible. */
const shouldShowDesktopZoomLevel = computed(() => {
  return getDesktopSource().zoomLevel === "enabled";
});

/** `true` when the mobile zoom-level badge should be visible. */
const shouldShowMobileZoomLevel = computed(() => {
  return getMobileSource().zoomLevel === "enabled";
});

/** `true` when the desktop container has at least one enabled button or zoom-level display. */
const shouldRenderDesktopContainer = computed(() => {
  const source = getDesktopSource();
  return hasEnabledButtons(source.buttons) || shouldShowDesktopZoomLevel.value;
});

/** `true` when the mobile container has at least one enabled button or zoom-level display. */
const shouldRenderMobileContainer = computed(() => {
  const source = getMobileSource();
  return hasEnabledButtons(source.buttons) || shouldShowMobileZoomLevel.value;
});

/**
 * Copies the raw Mermaid source code (`props.code`) to the system
 * clipboard using the Clipboard API. Shows a brief "Copied"
 * notification for 1 second on success.
 *
 * Falls back to an `alert()` message if the Clipboard API is
 * unavailable or the operation fails.
 */
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

/**
 * Emits the `download` event with the format specified in the
 * resolved toolbar config (e.g. `"svg"`, `"png"`, `"jpeg"`).
 */
const emitDownload = () => {
  emit("download", props.toolbar.downloadFormat);
};

/**
 * Toggles the CSS `force-show` class on the desktop and mobile toolbar
 * containers based on the current `isFullscreen` prop.
 *
 * Exposed to the parent component via `defineExpose` so that
 * `MermaidDiagram.vue` can call it from the `fullscreenchange` event
 * listener.
 */
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
