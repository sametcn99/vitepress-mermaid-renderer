import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ensureStylesInjected", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("injects the stylesheet into the document head once", async () => {
    const { ensureStylesInjected } = await import("../src/styleManager");

    ensureStylesInjected();
    ensureStylesInjected();

    const styles = document.head.querySelectorAll(
      "#vitepress-mermaid-renderer-styles",
    );

    expect(styles).toHaveLength(1);
    expect(styles[0]).toBeInstanceOf(HTMLStyleElement);
    expect(document.head.contains(styles[0]!)).toBe(true);
  });

  it("reuses an existing injected style element", async () => {
    const existingStyle = document.createElement("style");
    existingStyle.id = "vitepress-mermaid-renderer-styles";
    existingStyle.textContent = "existing";
    document.head.appendChild(existingStyle);

    const { ensureStylesInjected } = await import("../src/styleManager");

    ensureStylesInjected();

    const styles = document.head.querySelectorAll(
      "#vitepress-mermaid-renderer-styles",
    );

    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe("existing");
  });

  it("is a no-op when document is undefined (SSR guard)", async () => {
    vi.stubGlobal("document", undefined);

    const { ensureStylesInjected } = await import("../src/styleManager");

    expect(() => ensureStylesInjected()).not.toThrow();

    vi.unstubAllGlobals();
  });

  it("short-circuits subsequent calls via the module-level injected flag", async () => {
    const { ensureStylesInjected } = await import("../src/styleManager");

    ensureStylesInjected();
    expect(
      document.head.querySelectorAll("#vitepress-mermaid-renderer-styles"),
    ).toHaveLength(1);

    // Remove the injected element manually; the internal flag is set,
    // so a second call should NOT re-inject.
    document.head.innerHTML = "";
    ensureStylesInjected();
    expect(
      document.head.querySelectorAll("#vitepress-mermaid-renderer-styles"),
    ).toHaveLength(0);
  });
});
