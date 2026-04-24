import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMermaidNavigation } from "../../src/composables/useMermaidNavigation";

const wheelEvent = (overrides: Partial<WheelEventInit> = {}): WheelEvent =>
  ({
    ctrlKey: false,
    deltaY: 0,
    preventDefault: vi.fn(),
    ...overrides,
  }) as unknown as WheelEvent;

const touch = (clientX: number, clientY: number) =>
  ({ clientX, clientY }) as Touch;

const touchEvent = (touches: Touch[]): TouchEvent =>
  ({
    touches,
    preventDefault: vi.fn(),
  }) as unknown as TouchEvent;

describe("useMermaidNavigation", () => {
  beforeEach(() => {
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("zoom and reset", () => {
    it("zooms in by ×1.2 per call", () => {
      const nav = useMermaidNavigation();
      nav.zoomIn();
      expect(nav.scale.value).toBeCloseTo(1.2);
      nav.zoomIn();
      expect(nav.scale.value).toBeCloseTo(1.44);
    });

    it("zooms out by ÷1.2 monotonically", () => {
      const nav = useMermaidNavigation();
      const before = nav.scale.value;
      nav.zoomOut();
      expect(nav.scale.value).toBeCloseTo(before / 1.2);
      nav.zoomOut();
      expect(nav.scale.value).toBeCloseTo(before / 1.2 / 1.2);
    });

    it("resets translate and scale to defaults", () => {
      const nav = useMermaidNavigation();
      nav.zoomIn();
      nav.startPan({ clientX: 0, clientY: 0 } as MouseEvent);
      nav.pan({ clientX: 50, clientY: 30 } as MouseEvent);
      nav.endPan();
      expect(nav.scale.value).not.toBe(1);
      nav.resetView();
      expect(nav.scale.value).toBe(1);
      expect(nav.translateX.value).toBe(0);
      expect(nav.translateY.value).toBe(0);
    });
  });

  describe("mouse pan", () => {
    it("only updates translation when isPanning is true", () => {
      const nav = useMermaidNavigation();
      nav.pan({ clientX: 100, clientY: 100 } as MouseEvent);
      expect(nav.translateX.value).toBe(0);
      expect(nav.translateY.value).toBe(0);
    });

    it("applies delta divided by scale during panning", () => {
      const nav = useMermaidNavigation();
      nav.zoomIn();
      nav.zoomIn();
      const startScale = nav.scale.value;
      nav.startPan({ clientX: 0, clientY: 0 } as MouseEvent);
      nav.pan({ clientX: 60, clientY: 30 } as MouseEvent);
      expect(nav.translateX.value).toBeCloseTo(60 / startScale);
      expect(nav.translateY.value).toBeCloseTo(30 / startScale);
      nav.endPan();
      expect(nav.isPanning.value).toBe(false);
    });
  });

  describe("directional pan", () => {
    it("pans up/down/left/right by PAN_STEP / scale", () => {
      const nav = useMermaidNavigation();
      nav.panUp();
      expect(nav.translateY.value).toBe(-50);
      nav.panDown();
      expect(nav.translateY.value).toBe(0);
      nav.panLeft();
      expect(nav.translateX.value).toBe(-50);
      nav.panRight();
      expect(nav.translateX.value).toBe(0);
    });
  });

  describe("wheel zoom", () => {
    it("ignores wheel events without Ctrl outside fullscreen", () => {
      const nav = useMermaidNavigation();
      const ev = wheelEvent({ deltaY: -120 });
      nav.handleWheel(ev);
      expect(nav.scale.value).toBe(1);
      expect(ev.preventDefault).not.toHaveBeenCalled();
    });

    it("zooms in 10% with ctrl held", () => {
      const nav = useMermaidNavigation();
      const ev = wheelEvent({ ctrlKey: true, deltaY: -120 });
      nav.handleWheel(ev);
      expect(nav.scale.value).toBeCloseTo(1.1);
      expect(ev.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("zooms in fullscreen even without ctrl", () => {
      const nav = useMermaidNavigation();
      nav.toggleFullscreen(null, "dialog");
      const ev = wheelEvent({ deltaY: 120 });
      nav.handleWheel(ev);
      expect(nav.scale.value).toBeLessThan(1);
    });

    it("clamps zoom inside [0.2, 10]", () => {
      const nav = useMermaidNavigation();
      nav.toggleFullscreen(null, "dialog");
      for (let i = 0; i < 100; i++) {
        nav.handleWheel(wheelEvent({ deltaY: -120 }));
      }
      expect(nav.scale.value).toBeLessThanOrEqual(10);
      for (let i = 0; i < 200; i++) {
        nav.handleWheel(wheelEvent({ deltaY: 120 }));
      }
      expect(nav.scale.value).toBeGreaterThanOrEqual(0.2);
    });
  });

  describe("touch interactions (desktop / fullscreen)", () => {
    beforeEach(() => {
      vi.spyOn(window, "matchMedia").mockImplementation(
        (query: string) =>
          ({
            matches: false,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );
    });

    it("starts and continues a single-finger pan", () => {
      const nav = useMermaidNavigation();
      nav.handleTouchStart(touchEvent([touch(10, 10)]));
      nav.handleTouchMove(touchEvent([touch(40, 30)]));
      expect(nav.translateX.value).toBeCloseTo(30);
      expect(nav.translateY.value).toBeCloseTo(20);
      nav.handleTouchEnd();
    });

    it("performs pinch-zoom with two-finger gesture and dampening", () => {
      const nav = useMermaidNavigation();
      nav.handleTouchStart(touchEvent([touch(0, 0), touch(100, 0)]));
      nav.handleTouchMove(touchEvent([touch(0, 0), touch(200, 0)]));
      // distance doubled → zoomRatio=2 → newScale = 1*(1+1*0.2) = 1.2
      expect(nav.scale.value).toBeCloseTo(1.2);
      nav.handleTouchEnd();
    });
  });

  describe("touch interactions (mobile non-fullscreen)", () => {
    beforeEach(() => {
      vi.spyOn(window, "matchMedia").mockImplementation(
        (query: string) =>
          ({
            matches: query.includes("768"),
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );
    });

    it("ignores single-finger touch so the page can scroll", () => {
      const nav = useMermaidNavigation();
      nav.handleTouchStart(touchEvent([touch(10, 10)]));
      nav.handleTouchMove(touchEvent([touch(50, 50)]));
      expect(nav.translateX.value).toBe(0);
      expect(nav.translateY.value).toBe(0);
    });

    it("handles two-finger pinch + pan on mobile", () => {
      const nav = useMermaidNavigation();
      nav.handleTouchStart(touchEvent([touch(0, 0), touch(100, 0)]));
      nav.handleTouchMove(touchEvent([touch(10, 10), touch(210, 10)]));
      expect(nav.scale.value).toBeCloseTo(1.2);
      expect(nav.translateX.value).toBeCloseTo((110 - 50) / 1.2);
    });
  });

  describe("fullscreen", () => {
    it("dialog mode toggles isFullscreen without invoking the API", () => {
      const nav = useMermaidNavigation();
      const wrapper = document.createElement("div");
      nav.toggleFullscreen(wrapper, "dialog");
      expect(nav.isFullscreen.value).toBe(true);
      nav.toggleFullscreen(wrapper, "dialog");
      expect(nav.isFullscreen.value).toBe(false);
    });

    it("restores the previous view after exiting dialog fullscreen", () => {
      const nav = useMermaidNavigation();

      nav.zoomIn();
      nav.panRight();
      nav.panDown();

      const previousScale = nav.scale.value;
      const previousTranslateX = nav.translateX.value;
      const previousTranslateY = nav.translateY.value;

      nav.toggleFullscreen(null, "dialog");
      nav.zoomIn();
      nav.panLeft();
      nav.panUp();

      expect(nav.scale.value).not.toBeCloseTo(previousScale);
      expect(nav.translateX.value).not.toBeCloseTo(previousTranslateX);
      expect(nav.translateY.value).not.toBeCloseTo(previousTranslateY);

      nav.toggleFullscreen(null, "dialog");

      expect(nav.scale.value).toBeCloseTo(previousScale);
      expect(nav.translateX.value).toBeCloseTo(previousTranslateX);
      expect(nav.translateY.value).toBeCloseTo(previousTranslateY);
    });

    it("alerts when no fullscreen API is available in browser mode", () => {
      const alertFn = vi.fn();
      vi.stubGlobal("alert", alertFn);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const nav = useMermaidNavigation();
      const wrapper = document.createElement("div");
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      nav.toggleFullscreen(wrapper, "browser");
      expect(alertFn).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it("calls webkit/moz/ms request fallbacks when standard API is missing", () => {
      const nav = useMermaidNavigation();
      const wrapper = document.createElement("div");
      const webkitRequest = vi.fn();
      Object.defineProperty(wrapper, "webkitRequestFullscreen", {
        configurable: true,
        value: webkitRequest,
      });
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      nav.toggleFullscreen(wrapper, "browser");
      expect(webkitRequest).toHaveBeenCalled();
      expect(nav.isFullscreen.value).toBe(true);
    });

    it("invokes requestFullscreen and exitFullscreen across a full cycle", () => {
      const nav = useMermaidNavigation();
      const wrapper = document.createElement("div");
      const requestFullscreen = vi.fn();
      const exitFullscreen = vi.fn();
      Object.defineProperty(wrapper, "requestFullscreen", {
        configurable: true,
        value: requestFullscreen,
      });
      Object.defineProperty(document, "exitFullscreen", {
        configurable: true,
        value: exitFullscreen,
      });
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });

      nav.toggleFullscreen(wrapper, "browser");
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
      expect(nav.isFullscreen.value).toBe(true);

      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: wrapper,
      });
      nav.toggleFullscreen(wrapper, "browser");
      expect(exitFullscreen).toHaveBeenCalledTimes(1);
      expect(nav.isFullscreen.value).toBe(false);
    });

    it("restores the previous view when browser fullscreen exits via fullscreenchange", () => {
      const nav = useMermaidNavigation();
      const wrapper = document.createElement("div");
      const requestFullscreen = vi.fn();

      Object.defineProperty(wrapper, "requestFullscreen", {
        configurable: true,
        value: requestFullscreen,
      });

      nav.zoomIn();
      nav.panRight();
      nav.panDown();

      const previousScale = nav.scale.value;
      const previousTranslateX = nav.translateX.value;
      const previousTranslateY = nav.translateY.value;

      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });

      nav.toggleFullscreen(wrapper, "browser");

      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: wrapper,
      });
      nav.updateFullscreenControls({ controls: null, mobileControls: null });

      nav.zoomIn();
      nav.panLeft();
      nav.panUp();

      expect(nav.scale.value).not.toBeCloseTo(previousScale);
      expect(nav.translateX.value).not.toBeCloseTo(previousTranslateX);
      expect(nav.translateY.value).not.toBeCloseTo(previousTranslateY);

      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      nav.updateFullscreenControls({ controls: null, mobileControls: null });

      expect(requestFullscreen).toHaveBeenCalledTimes(1);
      expect(nav.isFullscreen.value).toBe(false);
      expect(nav.scale.value).toBeCloseTo(previousScale);
      expect(nav.translateX.value).toBeCloseTo(previousTranslateX);
      expect(nav.translateY.value).toBeCloseTo(previousTranslateY);
    });

    it("updateFullscreenControls toggles the force-show class", () => {
      const nav = useMermaidNavigation();
      const controls = document.createElement("div");
      const mobileControls = document.createElement("div");

      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: controls,
      });
      nav.updateFullscreenControls({ controls, mobileControls });
      expect(controls.classList.contains("force-show")).toBe(true);
      expect(mobileControls.classList.contains("force-show")).toBe(true);

      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      nav.updateFullscreenControls({ controls, mobileControls });
      expect(controls.classList.contains("force-show")).toBe(false);
      expect(mobileControls.classList.contains("force-show")).toBe(false);
    });
  });
});
