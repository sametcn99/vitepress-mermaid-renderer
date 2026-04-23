import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { useMermaidRenderer } from "../../src/composables/useMermaidRenderer";

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

interface HostExpose {
  detectDiagramType: (code: string) => string;
  renderMermaidDiagram: (
    id: string,
    code: string,
    retryCount?: number,
    maxRetries?: number,
  ) => Promise<void>;
  state: ReturnType<typeof useMermaidRenderer>;
}

/**
 * Mounts a tiny host component that exercises the composable inside a real
 * Vue lifecycle so that onMounted / onUnmounted hooks fire as in production.
 */
const mountHost = (
  options: Parameters<typeof useMermaidRenderer>[0] = {},
  diagramId = "mermaid-host",
) => {
  const Host = defineComponent({
    setup(_, { expose }) {
      const state = useMermaidRenderer(options);
      expose({
        state,
        detectDiagramType: state.detectDiagramType,
        renderMermaidDiagram: state.renderMermaidDiagram,
      });
      return () =>
        h("div", { class: "mermaid-host" }, [
          h("div", { id: diagramId, class: "mermaid" }, ""),
        ]);
    },
  });
  return mount(Host, { attachTo: document.body });
};

describe("useMermaidRenderer", () => {
  beforeEach(() => {
    mermaidMocks.initialize.mockReset();
    mermaidMocks.run.mockReset();
    mermaidMocks.run.mockImplementation(
      async ({ nodes }: { nodes: Element[] }) => {
        const [element] = nodes;
        element.innerHTML = '<svg viewBox="0 0 100 50"></svg>';
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  describe("detectDiagramType", () => {
    it.each([
      ["flowchart LR\nA-->B", "flowchart"],
      ["graph TD; A-->B", "flowchart"],
      ["sequenceDiagram\n A->>B: hi", "sequence"],
      ["gantt\n  title sample", "gantt"],
      ["C4Context\n  title C4", "c4"],
      ["C4Container\n  title", "c4"],
      ["gitGraph:\n  commit", "gitgraph"],
      ["gitGraph\n  commit", "gitgraph"],
      ["pie title Pets\n  Dogs : 1", "unknown"],
      ["", "unknown"],
    ])("classifies %j as %s", (code, expected) => {
      const wrapper = mountHost();
      const expose = wrapper.vm as unknown as HostExpose;
      expect(expose.detectDiagramType(code)).toBe(expected);
      wrapper.unmount();
    });
  });

  it("calls mermaid.initialize on mount and merges defaults with user config", async () => {
    const wrapper = mountHost({ config: { theme: "dark" } });
    await nextTick();

    expect(mermaidMocks.initialize).toHaveBeenCalledTimes(1);
    const arg = mermaidMocks.initialize.mock.calls[0]![0];
    expect(arg.theme).toBe("dark");
    expect(arg.startOnLoad).toBe(false);
    expect(arg.securityLevel).toBe("loose");
    wrapper.unmount();
  });

  it("renders the diagram successfully and invokes onRenderComplete with success=true", async () => {
    const onRenderComplete = vi.fn();
    const wrapper = mountHost({ onRenderComplete }, "mermaid-success");
    const expose = wrapper.vm as unknown as HostExpose;

    await expose.renderMermaidDiagram("mermaid-success", "flowchart LR\nA-->B");

    expect(mermaidMocks.run).toHaveBeenCalledTimes(1);
    expect(onRenderComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "mermaid-success", success: true }),
    );
    expect(expose.state.isRendered.value).toBe(true);
    expect(expose.state.renderError.value).toBe(false);
    wrapper.unmount();
  });

  it("retries with exponential backoff when the target element is missing then succeeds", async () => {
    vi.useFakeTimers();
    const onRenderComplete = vi.fn();
    const wrapper = mountHost({ onRenderComplete }, "mermaid-existing");
    const expose = wrapper.vm as unknown as HostExpose;

    const renderPromise = expose.renderMermaidDiagram(
      "missing-element-id",
      "flowchart LR\nA-->B",
      0,
      2,
    );

    // First retry delay = 100, second = 200, third throws
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);
    await renderPromise;

    expect(expose.state.renderError.value).toBe(true);
    expect(expose.state.renderErrorDetails.value).toContain(
      "Failed to find diagram container element",
    );
    expect(onRenderComplete).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    wrapper.unmount();
  });

  it("captures rendering failures and exposes them through reactive refs", async () => {
    const onRenderComplete = vi.fn();
    mermaidMocks.run.mockRejectedValueOnce(new Error("boom"));
    const wrapper = mountHost({ onRenderComplete }, "mermaid-failure");
    const expose = wrapper.vm as unknown as HostExpose;

    await expose.renderMermaidDiagram("mermaid-failure", "flowchart LR\nA-->B");

    expect(expose.state.renderError.value).toBe(true);
    expect(expose.state.renderErrorDetails.value).toContain("boom");
    expect(expose.state.isRendered.value).toBe(true);
    expect(onRenderComplete).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    wrapper.unmount();
  });

  it("re-initialises mermaid and re-renders on vitepress-mermaid:config-updated event", async () => {
    const wrapper = mountHost(
      { config: { theme: "default" } },
      "mermaid-update",
    );
    const expose = wrapper.vm as unknown as HostExpose;

    await expose.renderMermaidDiagram("mermaid-update", "flowchart LR\nA-->B");
    const initialInitCount = mermaidMocks.initialize.mock.calls.length;
    const initialRunCount = mermaidMocks.run.mock.calls.length;

    document.dispatchEvent(
      new CustomEvent("vitepress-mermaid:config-updated", {
        detail: { theme: "forest" },
      }),
    );
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mermaidMocks.initialize.mock.calls.length).toBeGreaterThan(
      initialInitCount,
    );
    const lastInit = mermaidMocks.initialize.mock.calls.at(-1)![0];
    expect(lastInit.theme).toBe("forest");
    expect(mermaidMocks.run.mock.calls.length).toBeGreaterThan(initialRunCount);
    wrapper.unmount();
  });

  it("removes the config-updated listener on unmount", async () => {
    const wrapper = mountHost({}, "mermaid-cleanup");
    const expose = wrapper.vm as unknown as HostExpose;
    await expose.renderMermaidDiagram("mermaid-cleanup", "flowchart LR\nA-->B");
    const beforeUnmount = mermaidMocks.initialize.mock.calls.length;

    wrapper.unmount();

    document.dispatchEvent(
      new CustomEvent("vitepress-mermaid:config-updated", {
        detail: { theme: "neutral" },
      }),
    );
    await nextTick();

    expect(mermaidMocks.initialize.mock.calls.length).toBe(beforeUnmount);
  });

  it("serialises concurrent renders through the shared pipeline", async () => {
    const order: string[] = [];
    mermaidMocks.run.mockImplementation(
      async ({ nodes }: { nodes: Element[] }) => {
        const [element] = nodes;
        order.push(element.id + ":start");
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push(element.id + ":end");
        element.innerHTML = "<svg></svg>";
      },
    );
    const wrapper = mountHost({}, "diagram-a");
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="diagram-b" class="mermaid"></div>',
    );
    const expose = wrapper.vm as unknown as HostExpose;

    await Promise.all([
      expose.renderMermaidDiagram("diagram-a", "flowchart LR\nA-->B"),
      expose.renderMermaidDiagram("diagram-b", "flowchart LR\nC-->D"),
    ]);

    // Each render must finish before the next starts (no interleaving).
    expect(order).toEqual([
      "diagram-a:start",
      "diagram-a:end",
      "diagram-b:start",
      "diagram-b:end",
    ]);
    wrapper.unmount();
  });
});
