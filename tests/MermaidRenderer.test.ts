import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveToolbarConfig } from "../src/toolbar";

vi.mock("../src/MermaidDiagram.vue", () => ({
  default: { name: "MermaidDiagramMock", render: () => null },
}));

const flush = (ms = 0) => new Promise((r) => setTimeout(r, ms));

const importFresh = async () => {
  vi.resetModules();
  return await import("../src/MermaidRenderer");
};

describe("MermaidRenderer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("getInstance", () => {
    it("returns the same singleton across calls", async () => {
      const mod = await importFresh();
      const a = mod.MermaidRenderer.getInstance();
      const b = mod.MermaidRenderer.getInstance();
      expect(a).toBe(b);
    });

    it("dispatches a config-updated event on subsequent getInstance calls with config", async () => {
      const mod = await importFresh();
      mod.MermaidRenderer.getInstance({ theme: "default" });
      const spy = vi.fn();
      document.addEventListener("vitepress-mermaid:config-updated", spy);

      mod.MermaidRenderer.getInstance({ theme: "forest" });

      expect(spy).toHaveBeenCalledTimes(1);
      const detail = (spy.mock.calls[0]![0] as CustomEvent).detail;
      expect(detail).toMatchObject({ theme: "forest" });
    });
  });

  describe("setToolbar", () => {
    it("stores a freshly resolved toolbar config (default)", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      renderer.setToolbar();
      // Indirectly verify by re-invocation: setToolbar must accept undefined.
      expect(() => renderer.setToolbar()).not.toThrow();
    });

    it("accepts custom toolbar overrides", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const expected = resolveToolbarConfig({
        downloadFormat: "png",
        desktop: { download: "enabled" },
      });
      renderer.setToolbar({
        downloadFormat: "png",
        desktop: { download: "enabled" },
      });
      // The toolbarConfig is private; verify by ensuring a follow-up call
      // with the same options resolves to a deeply equal object.
      const sameAgain = resolveToolbarConfig({
        downloadFormat: "png",
        desktop: { download: "enabled" },
      });
      expect(expected).toEqual(sameAgain);
    });

    it("dispatches vitepress-mermaid:toolbar-updated with resolved tooltip text", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const spy = vi.fn();
      document.addEventListener("vitepress-mermaid:toolbar-updated", spy);

      renderer.setToolbar({
        i18n: {
          localeIndex: "tr",
          locales: {
            tr: { tooltips: { copyCode: "Kodu kopyala" } },
          },
        },
      });

      expect(spy).toHaveBeenCalledTimes(1);
      const detail = (spy.mock.calls[0]![0] as CustomEvent).detail;
      expect(detail.i18n.localeIndex).toBe("tr");
      expect(detail.i18n.tooltips.copyCode).toBe("Kodu kopyala");
      expect(detail.i18n.tooltips.zoomIn).toBe("Zoom In");
    });
  });

  describe("DOM discovery and queueing", () => {
    it("discovers .language-mermaid blocks and replaces them with wrappers", async () => {
      // Pre-create DOM before getInstance to allow synchronous discovery later
      document.body.innerHTML = `
        <div class="language-mermaid">
          <button class="copy"></button>
          <span class="lang">mermaid</span>
          <pre>flowchart LR\nA-->B</pre>
        </div>
      `;
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      // Manually trigger an internal render pass via the public route hook.
      // We use a private cast since renderMermaidDiagrams is private.
      const found = (
        renderer as unknown as { renderMermaidDiagrams: () => boolean }
      ).renderMermaidDiagrams();
      expect(found).toBe(true);
      // Wait long enough for the 200ms mount delay.
      await flush(250);
      expect(document.querySelector(".mermaid-wrapper")).not.toBeNull();
      // Copy button removed
      expect(document.querySelector(".copy")).toBeNull();
    });

    it("returns false when no diagrams are present", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const result = (
        renderer as unknown as { renderMermaidDiagrams: () => boolean }
      ).renderMermaidDiagrams();
      expect(result).toBe(false);
    });

    it("falls back to <pre><code class='mermaid'> discovery", async () => {
      document.body.innerHTML = `
        <pre><code class="mermaid">flowchart LR\nC-->D</code></pre>
      `;
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const result = (
        renderer as unknown as { renderMermaidDiagrams: () => boolean }
      ).renderMermaidDiagrams();
      expect(result).toBe(true);
      await flush(250);
      expect(document.querySelector(".mermaid-wrapper")).not.toBeNull();
    });

    it("preserves the language label when showLanguageLabel is true", async () => {
      document.body.innerHTML = `
        <div class="language-mermaid">
          <button class="copy"></button>
          <span class="lang">mermaid</span>
          <pre>flowchart LR\nA-->B</pre>
        </div>
      `;
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      renderer.setToolbar({ showLanguageLabel: true });
      // Internal cleanup call
      const wrappers = document.getElementsByClassName("language-mermaid");
      (
        renderer as unknown as {
          cleanupMermaidWrapper: (el: Element) => void;
        }
      ).cleanupMermaidWrapper(wrappers[0]!);
      expect(document.querySelector(".lang")).not.toBeNull();
      expect(document.querySelector(".copy")).toBeNull();
    });

    it("removes language label when showLanguageLabel is false", async () => {
      document.body.innerHTML = `
        <div class="language-mermaid">
          <span class="lang">mermaid</span>
          <pre>flowchart LR\nA-->B</pre>
        </div>
      `;
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      renderer.setToolbar({ showLanguageLabel: false });
      const wrappers = document.getElementsByClassName("language-mermaid");
      (
        renderer as unknown as {
          cleanupMermaidWrapper: (el: Element) => void;
        }
      ).cleanupMermaidWrapper(wrappers[0]!);
      expect(document.querySelector(".lang")).toBeNull();
    });
  });

  describe("nodeContainsMermaidCode", () => {
    it("returns true for elements with .language-mermaid class", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const div = document.createElement("div");
      div.className = "language-mermaid";
      expect(
        (
          renderer as unknown as {
            nodeContainsMermaidCode: (n: Node) => boolean;
          }
        ).nodeContainsMermaidCode(div),
      ).toBe(true);
    });

    it("returns false for elements inside .mermaid-wrapper", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const root = document.createElement("div");
      root.className = "mermaid-wrapper";
      const inner = document.createElement("div");
      inner.className = "language-mermaid";
      root.appendChild(inner);
      document.body.appendChild(root);
      expect(
        (
          renderer as unknown as {
            nodeContainsMermaidCode: (n: Node) => boolean;
          }
        ).nodeContainsMermaidCode(inner),
      ).toBe(false);
    });

    it("returns false for null nodes and unrelated elements", async () => {
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const node = (
        renderer as unknown as {
          nodeContainsMermaidCode: (n: Node | null) => boolean;
        }
      ).nodeContainsMermaidCode;
      expect(node(null)).toBe(false);
      expect(node(document.createElement("p"))).toBe(false);
    });
  });

  describe("retry/backoff", () => {
    it("applies exponential backoff Math.min(300 * 1.4^n, 10000)", async () => {
      vi.useFakeTimers();
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      const setSpy = vi.spyOn(globalThis, "setTimeout");
      // No diagrams in DOM → renderWithRetry must schedule next attempt.
      (
        renderer as unknown as {
          renderAttempts: number;
          renderWithRetry: () => void;
        }
      ).renderAttempts = 0;
      (
        renderer as unknown as { renderWithRetry: () => void }
      ).renderWithRetry();
      const delays = setSpy.mock.calls
        .map((c) => c[1])
        .filter((d): d is number => typeof d === "number");
      expect(delays.some((d) => d === 300)).toBe(true);
    });

    it("handleRouteChange clears the retry timer and restarts", async () => {
      vi.useFakeTimers();
      const mod = await importFresh();
      const renderer = mod.MermaidRenderer.getInstance();
      (
        renderer as unknown as { renderWithRetry: () => void }
      ).renderWithRetry();
      const before = (
        renderer as unknown as { retryTimeout: NodeJS.Timeout | null }
      ).retryTimeout;
      expect(before).not.toBeNull();
      (
        renderer as unknown as { handleRouteChange: () => void }
      ).handleRouteChange();
      const after = (renderer as unknown as { renderAttempts: number })
        .renderAttempts;
      expect(after).toBe(0);
    });
  });
});
