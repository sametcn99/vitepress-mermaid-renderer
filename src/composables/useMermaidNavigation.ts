import { ref, type Ref } from "vue";

export interface MermaidNavigationState {
  scale: Ref<number>;
  translateX: Ref<number>;
  translateY: Ref<number>;
  isPanning: Ref<boolean>;
  isFullscreen: Ref<boolean>;
}

export interface MermaidNavigationActions {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  toggleFullscreen: (diagramWrapper: HTMLElement | null) => void;
  startPan: (e: MouseEvent) => void;
  pan: (e: MouseEvent) => void;
  endPan: () => void;
  handleWheel: (e: WheelEvent) => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;
  panUp: () => void;
  panDown: () => void;
  panLeft: () => void;
  panRight: () => void;
  updateFullscreenControls: (controlsRefs: {
    controls: HTMLElement | null;
    mobileControls: HTMLElement | null;
  }) => void;
}

export function useMermaidNavigation(): MermaidNavigationState &
  MermaidNavigationActions {
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

  // Constants
  const PAN_STEP = 50; // Pixels to pan per button press

  // Actions
  const zoomIn = () => {
    scale.value = scale.value * 1.2;
  };

  const zoomOut = () => {
    if (scale.value > 0.2) {
      // Prevent extreme zooming out
      scale.value = scale.value / 1.2;
    }
  };

  const resetView = () => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  };

  const toggleFullscreen = (diagramWrapper: HTMLElement | null) => {
    try {
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
          throw new Error("Fullscreen API not available");
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
      console.error("Fullscreen error:", err);
      alert("Fullscreen mode is not supported in this browser.");
    }
  };

  const startPan = (e: MouseEvent) => {
    isPanning.value = true;
    lastX.value = e.clientX;
    lastY.value = e.clientY;
  };

  const pan = (e: MouseEvent) => {
    if (!isPanning.value) return;

    const deltaX = e.clientX - lastX.value;
    const deltaY = e.clientY - lastY.value;

    translateX.value += deltaX / scale.value;
    translateY.value += deltaY / scale.value;

    lastX.value = e.clientX;
    lastY.value = e.clientY;
  };

  const endPan = () => {
    isPanning.value = false;
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      // Zoom
      const delta = -Math.sign(e.deltaY) * 0.1;
      const newScale = scale.value * (1 + delta);

      // Apply bounds to prevent extreme zooming
      if (newScale >= 0.2 && newScale <= 10) {
        scale.value = newScale;
      }
    } else {
      // Pan
      translateX.value += -e.deltaX / scale.value;
      translateY.value += -e.deltaY / scale.value;
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
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

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while interacting with diagram

    if (touchPanning.value && e.touches.length === 1) {
      // Handle panning
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchX.value;
      const deltaY = touch.clientY - lastTouchY.value;

      translateX.value += deltaX / scale.value;
      translateY.value += deltaY / scale.value;

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
        if (newScale >= 0.2 && newScale <= 10) {
          scale.value = newScale;
        }

        initialTouchDistance.value = currentDistance;
      }
    }
  };

  const handleTouchEnd = () => {
    touchPanning.value = false;
    initialTouchDistance.value = 0;
  };

  const panUp = () => {
    translateY.value -= PAN_STEP / scale.value;
  };

  const panDown = () => {
    translateY.value += PAN_STEP / scale.value;
  };

  const panLeft = () => {
    translateX.value -= PAN_STEP / scale.value;
  };

  const panRight = () => {
    translateX.value += PAN_STEP / scale.value;
  };

  const updateFullscreenControls = (controlsRefs: {
    controls: HTMLElement | null;
    mobileControls: HTMLElement | null;
  }) => {
    try {
      if (document.fullscreenElement) {
        isFullscreen.value = true;
        if (controlsRefs.controls) {
          controlsRefs.controls.classList.add("force-show");
        }
        if (controlsRefs.mobileControls) {
          controlsRefs.mobileControls.classList.add("force-show");
        }
      } else {
        isFullscreen.value = false;
        if (controlsRefs.controls) {
          controlsRefs.controls.classList.remove("force-show");
        }
        if (controlsRefs.mobileControls) {
          controlsRefs.mobileControls.classList.remove("force-show");
        }
      }
    } catch (err) {
      console.error("Error updating fullscreen controls:", err);
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
