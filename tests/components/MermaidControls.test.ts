import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import MermaidControls from "../../src/components/MermaidControls.vue";
import { resolveToolbarConfig } from "../../src/toolbar";

describe("MermaidControls", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("switches to fullscreen toolbar settings when fullscreen mode is enabled", async () => {
    const toolbar = resolveToolbarConfig({
      desktop: {
        positions: { vertical: "bottom", horizontal: "right" },
      },
      fullscreen: {
        download: "enabled",
        positions: { vertical: "top", horizontal: "left" },
      },
    });

    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: "graph TD; A-->B",
        isFullscreen: false,
        toolbar,
      },
    });

    expect(
      wrapper.find('.desktop-controls [title="Download Diagram"]').exists(),
    ).toBe(false);
    expect(wrapper.get(".desktop-controls").classes()).toContain(
      "toolbar-vertical-bottom",
    );
    expect(wrapper.get(".desktop-controls").classes()).toContain(
      "toolbar-horizontal-right",
    );

    await wrapper.setProps({ isFullscreen: true });

    expect(
      wrapper.find('.desktop-controls [title="Download Diagram"]').exists(),
    ).toBe(true);
    expect(wrapper.get(".desktop-controls").classes()).toContain(
      "toolbar-vertical-top",
    );
    expect(wrapper.get(".desktop-controls").classes()).toContain(
      "toolbar-horizontal-left",
    );
  });

  it("copies the Mermaid source and clears the copied state after the timeout", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: "graph TD; A-->B",
        isFullscreen: false,
        toolbar: resolveToolbarConfig(),
      },
    });

    await wrapper.get('.desktop-controls [title="Copy Code"]').trigger("click");
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith("graph TD; A-->B");
    expect(wrapper.text()).toContain("Copied");

    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.text()).not.toContain("Copied");
  });

  it("emits the resolved download format when download is clicked", async () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: "graph TD; A-->B",
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          downloadFormat: "jpg",
          desktop: { download: "enabled" },
        }),
      },
    });

    await wrapper
      .get('.desktop-controls [title="Download Diagram"]')
      .trigger("click");

    expect(wrapper.emitted("download")).toEqual([["jpg"]]);
  });

  it("hides the zoom-level indicator when desktop.zoomLevel is disabled", () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1.25,
        code: "graph TD; A-->B",
        isFullscreen: false,
        toolbar: resolveToolbarConfig({ desktop: { zoomLevel: "disabled" } }),
      },
    });
    expect(wrapper.find(".desktop-controls .zoom-level").exists()).toBe(false);
  });

  it("renders mobile controls separately from desktop", () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: "graph TD; A-->B",
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          mobile: { zoomIn: "enabled", zoomOut: "enabled" },
        }),
      },
    });
    expect(wrapper.find(".mobile-controls").exists()).toBe(true);
  });

  it("exposes refs for fullscreen control elements", () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: "graph TD; A-->B",
        isFullscreen: false,
        toolbar: resolveToolbarConfig(),
      },
    });
    const exposed = wrapper.vm as unknown as {
      $refs: { controls?: HTMLElement; mobileControls?: HTMLElement };
    };
    expect(exposed.$refs.controls).toBeInstanceOf(HTMLElement);
  });
});
