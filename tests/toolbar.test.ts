import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOOLBAR_CONFIG,
  isResolvedToolbarConfig,
  resolveToolbarConfig,
  resolveToolbarI18n,
} from "../src/toolbar";

describe("resolveToolbarConfig", () => {
  it("returns the default toolbar configuration when no overrides are provided", () => {
    expect(resolveToolbarConfig()).toEqual(DEFAULT_TOOLBAR_CONFIG);
  });

  it("merges nested overrides without dropping the untouched defaults", () => {
    const resolved = resolveToolbarConfig({
      showLanguageLabel: false,
      downloadFormat: "png",
      fullscreenMode: "dialog",
      desktop: {
        download: "enabled",
        positions: { vertical: "top" },
      },
      mobile: { zoomIn: "enabled" },
    });

    expect(resolved.showLanguageLabel).toBe(false);
    expect(resolved.downloadFormat).toBe("png");
    expect(resolved.fullscreenMode).toBe("dialog");
    expect(resolved.desktop.buttons.download).toBe("enabled");
    expect(resolved.desktop.buttons.copyCode).toBe("enabled");
    expect(resolved.desktop.positions).toEqual({
      vertical: "top",
      horizontal: "right",
    });
    expect(resolved.mobile.buttons.zoomIn).toBe("enabled");
    expect(resolved.mobile.buttons.zoomOut).toBe("disabled");
  });

  it("respects fullscreen overrides independently from desktop and mobile", () => {
    const resolved = resolveToolbarConfig({
      fullscreen: {
        download: "enabled",
        copyCode: "enabled",
        positions: { vertical: "top", horizontal: "left" },
        zoomLevel: "disabled",
      },
    });

    expect(resolved.fullscreen.buttons.download).toBe("enabled");
    expect(resolved.fullscreen.buttons.copyCode).toBe("enabled");
    expect(resolved.fullscreen.buttons.toggleFullscreen).toBe("enabled");
    expect(resolved.fullscreen.positions).toEqual({
      vertical: "top",
      horizontal: "left",
    });
    expect(resolved.fullscreen.zoomLevel).toBe("disabled");
    expect(resolved.desktop).toEqual(DEFAULT_TOOLBAR_CONFIG.desktop);
    expect(resolved.mobile).toEqual(DEFAULT_TOOLBAR_CONFIG.mobile);
  });

  it("merges only the provided position axis and keeps the other default", () => {
    const resolved = resolveToolbarConfig({
      desktop: { positions: { horizontal: "left" } },
      mobile: { positions: { vertical: "top" } },
    });

    expect(resolved.desktop.positions).toEqual({
      vertical: "bottom",
      horizontal: "left",
    });
    expect(resolved.mobile.positions).toEqual({
      vertical: "top",
      horizontal: "right",
    });
  });

  it("ignores invalid button state values and unknown keys", () => {
    const overrides = {
      desktop: {
        zoomIn: "maybe",
        nonsense: "enabled",
      },
    } as unknown as Parameters<typeof resolveToolbarConfig>[0];
    const resolved = resolveToolbarConfig(overrides);

    expect(resolved.desktop.buttons.zoomIn).toBe("enabled");
  });

  it("toggles desktop zoomLevel when explicitly disabled", () => {
    const resolved = resolveToolbarConfig({
      desktop: { zoomLevel: "disabled" },
    });
    expect(resolved.desktop.zoomLevel).toBe("disabled");
    expect(resolved.mobile.zoomLevel).toBe("enabled");
  });

  it("preserves DEFAULT_TOOLBAR_CONFIG immutability across calls", () => {
    const first = resolveToolbarConfig({ desktop: { download: "enabled" } });
    const second = resolveToolbarConfig();
    expect(first.desktop.buttons.download).toBe("enabled");
    expect(second.desktop.buttons.download).toBe("disabled");
    expect(DEFAULT_TOOLBAR_CONFIG.desktop.buttons.download).toBe("disabled");
  });
});

describe("isResolvedToolbarConfig", () => {
  it("recognizes resolved toolbar configs", () => {
    expect(isResolvedToolbarConfig(resolveToolbarConfig())).toBe(true);
  });

  it("rejects partial toolbar option objects", () => {
    expect(
      isResolvedToolbarConfig({
        desktop: { download: "enabled" },
      }),
    ).toBe(false);
  });

  it("rejects null, undefined, and primitive values", () => {
    expect(isResolvedToolbarConfig(null)).toBe(false);
    expect(isResolvedToolbarConfig(undefined)).toBe(false);
    expect(isResolvedToolbarConfig("string")).toBe(false);
    expect(isResolvedToolbarConfig(123)).toBe(false);
    expect(isResolvedToolbarConfig({})).toBe(false);
  });

  it("rejects objects missing scalar resolution markers", () => {
    expect(
      isResolvedToolbarConfig({
        desktop: { buttons: {}, positions: {}, zoomLevel: "enabled" },
      }),
    ).toBe(false);
  });
});

describe("resolveToolbarI18n", () => {
  it("returns the built-in English defaults when no overrides are provided", () => {
    const i18n = resolveToolbarI18n();
    expect(i18n.localeIndex).toBe("root");
    expect(i18n.tooltips).toEqual({
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetView: "Reset View",
      copyCode: "Copy Code",
      download: "Download Diagram",
      toggleFullscreen: "Toggle Fullscreen",
    });
  });

  it("applies global tooltip overrides on top of defaults", () => {
    const i18n = resolveToolbarI18n({
      tooltips: { copyCode: "Kopyala" },
    });
    expect(i18n.tooltips.copyCode).toBe("Kopyala");
    expect(i18n.tooltips.zoomIn).toBe("Zoom In");
  });

  it("prefers locale-specific overrides over global ones", () => {
    const i18n = resolveToolbarI18n({
      localeIndex: "tr",
      tooltips: { zoomIn: "Global ZI" },
      locales: {
        tr: { tooltips: { zoomIn: "Yakınlaştır" } },
      },
    });
    expect(i18n.localeIndex).toBe("tr");
    expect(i18n.tooltips.zoomIn).toBe("Yakınlaştır");
  });

  it("falls back to global override when locale entry omits the key", () => {
    const i18n = resolveToolbarI18n({
      localeIndex: "tr",
      tooltips: { download: "Global DL" },
      locales: { tr: { tooltips: { zoomIn: "Yakınlaştır" } } },
    });
    expect(i18n.tooltips.download).toBe("Global DL");
    expect(i18n.tooltips.zoomIn).toBe("Yakınlaştır");
    expect(i18n.tooltips.resetView).toBe("Reset View");
  });

  it("falls back to defaults when localeIndex has no matching locale entry", () => {
    const i18n = resolveToolbarI18n({
      localeIndex: "fr",
      locales: { tr: { tooltips: { zoomIn: "Yakınlaştır" } } },
    });
    expect(i18n.localeIndex).toBe("fr");
    expect(i18n.tooltips.zoomIn).toBe("Zoom In");
  });

  it("ignores empty-string overrides so a tooltip is never blanked out", () => {
    const i18n = resolveToolbarI18n({
      localeIndex: "tr",
      tooltips: { zoomIn: "" },
      locales: { tr: { tooltips: { zoomIn: "" } } },
    });
    expect(i18n.tooltips.zoomIn).toBe("Zoom In");
  });

  it("flows through resolveToolbarConfig and never mutates DEFAULT_TOOLBAR_CONFIG", () => {
    const resolved = resolveToolbarConfig({
      i18n: {
        localeIndex: "tr",
        locales: { tr: { tooltips: { copyCode: "Kodu kopyala" } } },
      },
    });
    expect(resolved.i18n.localeIndex).toBe("tr");
    expect(resolved.i18n.tooltips.copyCode).toBe("Kodu kopyala");
    expect(DEFAULT_TOOLBAR_CONFIG.i18n.localeIndex).toBe("root");
    expect(DEFAULT_TOOLBAR_CONFIG.i18n.tooltips.copyCode).toBe("Copy Code");
  });
});
