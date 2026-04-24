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
      wrapper
        .find('.desktop-controls [data-mermaid-control="download"]')
        .exists(),
    ).toBe(false);
    expect(wrapper.get(".desktop-controls").classes()).toContain(
      "toolbar-vertical-bottom",
    );
    expect(wrapper.get(".desktop-controls").classes()).toContain(
      "toolbar-horizontal-right",
    );

    await wrapper.setProps({ isFullscreen: true });

    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="download"]')
        .exists(),
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

    await wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .trigger("click");
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
      .get('.desktop-controls [data-mermaid-control="download"]')
      .trigger("click");

    expect(wrapper.emitted("download")).toEqual([["jpg"]]);
  });

  it("renders localized tooltip text on title and aria-label and exposes data-mermaid-control attributes", () => {
    const toolbar = resolveToolbarConfig({
      desktop: { download: "enabled" },
      mobile: { zoomIn: "enabled" },
      i18n: {
        localeIndex: "tr",
        locales: {
          tr: {
            tooltips: {
              zoomIn: "Yakınlaştır",
              copyCode: "Kodu kopyala",
              download: "Diyagramı indir",
              resetView: "Görünümü sıfırla",
              toggleFullscreen: "Tam ekran",
              zoomOut: "Uzaklaştır",
            },
          },
        },
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

    const copyBtn = wrapper.get(
      '.desktop-controls [data-mermaid-control="copyCode"]',
    );
    expect(copyBtn.attributes("title")).toBe("Kodu kopyala");
    expect(copyBtn.attributes("aria-label")).toBe("Kodu kopyala");

    const dlBtn = wrapper.get(
      '.desktop-controls [data-mermaid-control="download"]',
    );
    expect(dlBtn.attributes("title")).toBe("Diyagramı indir");

    const mobileZoomIn = wrapper.get(
      '.mobile-controls [data-mermaid-control="zoomIn"]',
    );
    expect(mobileZoomIn.attributes("title")).toBe("Yakınlaştır");
    expect(mobileZoomIn.attributes("aria-label")).toBe("Yakınlaştır");
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
