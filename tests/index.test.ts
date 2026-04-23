import { afterEach, describe, expect, it, vi } from "vitest";

describe("createMermaidRenderer", () => {
  afterEach(() => {
    vi.doUnmock("../src/styleManager");
    vi.doUnmock("../src/MermaidRenderer");
    vi.resetModules();
  });

  it("returns a no-op renderer during SSR", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);

    const ensureStylesInjected = vi.fn();
    const getInstance = vi.fn();

    vi.doMock("../src/styleManager", () => ({
      ensureStylesInjected,
    }));
    vi.doMock("../src/MermaidRenderer", () => ({
      MermaidRenderer: {
        getInstance,
      },
    }));

    const { createMermaidRenderer } = await import("../src/index");
    const renderer = createMermaidRenderer({ theme: "dark" });

    expect(typeof renderer.setToolbar).toBe("function");
    expect(getInstance).not.toHaveBeenCalled();
    expect(ensureStylesInjected).not.toHaveBeenCalled();
  });

  it("injects styles on import and delegates renderer creation in the browser", async () => {
    const ensureStylesInjected = vi.fn();
    const renderer = {
      setToolbar: vi.fn(),
    };
    const getInstance = vi.fn().mockReturnValue(renderer);

    vi.doMock("../src/styleManager", () => ({
      ensureStylesInjected,
    }));
    vi.doMock("../src/MermaidRenderer", () => ({
      MermaidRenderer: {
        getInstance,
      },
    }));

    const { createMermaidRenderer } = await import("../src/index");
    const config = { theme: "forest" } as const;

    expect(ensureStylesInjected).toHaveBeenCalledTimes(1);
    expect(createMermaidRenderer(config)).toBe(renderer);
    expect(getInstance).toHaveBeenCalledWith(config);
  });
});
