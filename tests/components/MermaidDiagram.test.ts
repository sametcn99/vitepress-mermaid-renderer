import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MermaidDiagram from "../../src/MermaidDiagram.vue";
import { resolveToolbarConfig } from "../../src/toolbar";

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  run: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: mermaidMocks.initialize,
    run: mermaidMocks.run,
  },
}));

const flushDiagramRender = async () => {
  await nextTick();
  await vi.runAllTimersAsync();
  await nextTick();
};

describe("MermaidDiagram", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.className = "";
    mermaidMocks.initialize.mockReset();
    mermaidMocks.run.mockReset();
    mermaidMocks.run.mockImplementation(
      async ({ nodes }: { nodes: Element[] }) => {
        const [element] = nodes;
        element.innerHTML = '<svg viewBox="0 0 120 60"></svg>';
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.className = "";
  });

  it("renders a diagram, emits renderComplete, and reacts to toolbar updates", async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: resolveToolbarConfig({ fullscreenMode: "browser" }),
      },
    });

    await flushDiagramRender();

    expect(mermaidMocks.initialize).toHaveBeenCalled();
    expect(mermaidMocks.run).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".diagram-wrapper .mermaid > svg").exists()).toBe(true);
    expect(wrapper.emitted("renderComplete")?.[0]?.[0]).toMatchObject({
      success: true,
    });

    document.dispatchEvent(
      new CustomEvent("vitepress-mermaid:toolbar-updated", {
        detail: { fullscreenMode: "dialog" },
      }),
    );
    await nextTick();

    await wrapper
      .get('.desktop-controls [data-mermaid-control="toggleFullscreen"]')
      .trigger("click");
    await nextTick();

    expect(wrapper.find(".mermaid-dialog-backdrop").exists()).toBe(true);
    expect(document.body.classList.contains("mermaid-dialog-open")).toBe(true);

    await wrapper.get(".mermaid-dialog-backdrop").trigger("click");
    await nextTick();

    expect(wrapper.find(".mermaid-dialog-backdrop").exists()).toBe(false);

    wrapper.unmount();
    expect(document.body.classList.contains("mermaid-dialog-open")).toBe(false);
  });

  it("surfaces render failures through the error component and event payload", async () => {
    vi.useRealTimers();
    mermaidMocks.run.mockRejectedValueOnce(new Error("render failed"));

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: resolveToolbarConfig(),
      },
    });

    await nextTick();
    await Promise.resolve();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(wrapper.find(".diagram-error").exists()).toBe(true);
    expect(wrapper.text()).toContain("Failed to render diagram");
    expect(wrapper.emitted("renderComplete")?.[0]?.[0]).toMatchObject({
      success: false,
    });
  });

  it("accepts raw MermaidToolbarOptions and resolves them internally", async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: { downloadFormat: "png", desktop: { download: "enabled" } },
      },
    });
    await flushDiagramRender();

    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="download"]')
        .exists(),
    ).toBe(true);
    wrapper.unmount();
  });

  it("updates tooltip text when receiving a localized toolbar-updated event", async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: resolveToolbarConfig(),
      },
    });
    await flushDiagramRender();

    const initial = wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .attributes("title");
    expect(initial).toBe("Copy Code");

    document.dispatchEvent(
      new CustomEvent("vitepress-mermaid:toolbar-updated", {
        detail: resolveToolbarConfig({
          i18n: {
            localeIndex: "tr",
            locales: { tr: { tooltips: { copyCode: "Kodu kopyala" } } },
          },
        }),
      }),
    );
    await nextTick();

    const updated = wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .attributes("title");
    expect(updated).toBe("Kodu kopyala");
    wrapper.unmount();
  });

  it("downloads SVG via Blob + anchor click", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:svg");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy });
      }
      return el;
    });

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: resolveToolbarConfig({
          downloadFormat: "svg",
          desktop: { download: "enabled" },
        }),
      },
    });
    await flushDiagramRender();

    await wrapper
      .get('.desktop-controls [data-mermaid-control="download"]')
      .trigger("click");
    await nextTick();

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("logs an error and aborts download when no SVG is present", async () => {
    mermaidMocks.run.mockImplementation(async () => {
      // intentionally produce no SVG
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: resolveToolbarConfig({
          downloadFormat: "svg",
          desktop: { download: "enabled" },
        }),
      },
    });
    await flushDiagramRender();

    await wrapper
      .get('.desktop-controls [data-mermaid-control="download"]')
      .trigger("click");
    await nextTick();

    expect(errorSpy).toHaveBeenCalledWith("SVG element not found for download");
    wrapper.unmount();
  });

  it("registers and removes vendor-prefixed fullscreenchange listeners", async () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: "flowchart LR\nA-->B",
        toolbar: resolveToolbarConfig(),
      },
    });
    await flushDiagramRender();

    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];
    for (const ev of events) {
      expect(addSpy.mock.calls.some((c) => c[0] === ev)).toBe(true);
    }

    wrapper.unmount();

    for (const ev of events) {
      expect(removeSpy.mock.calls.some((c) => c[0] === ev)).toBe(true);
    }
  });
});
