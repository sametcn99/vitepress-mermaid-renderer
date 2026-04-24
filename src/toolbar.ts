/**
 * @module toolbar
 *
 * Defines the complete type system and resolution logic for the interactive
 * toolbar that accompanies every rendered Mermaid diagram. The toolbar provides
 * zoom, pan, copy, download, and fullscreen controls and adapts its layout
 * across desktop, mobile, and fullscreen display modes.
 *
 * **Architecture overview:**
 * - Consumer-facing types (`MermaidToolbarOptions`) allow partial overrides.
 * - Internal types (`ResolvedToolbarConfig`, `ToolbarModeConfig`) guarantee
 *   every field is present after resolution.
 * - `resolveToolbarConfig()` bridges the two by merging user input with
 *   `DEFAULT_TOOLBAR_CONFIG`.
 *
 * Used by:
 * - `MermaidRenderer.ts` — calls `resolveToolbarConfig()` and passes the
 *   result to every diagram mount.
 * - `MermaidDiagram.vue` — receives toolbar config as a prop.
 * - `MermaidControls.vue` — reads the resolved config to determine which
 *   buttons to render and where to position them.
 *
 * @example
 * ```ts
 * import { resolveToolbarConfig } from "./toolbar";
 *
 * const config = resolveToolbarConfig({
 *   desktop: { zoomIn: "disabled", positions: { vertical: "top" } },
 *   downloadFormat: "png",
 * });
 * ```
 */

/**
 * Represents the two possible runtime states for any toolbar button.
 *
 * - `"enabled"` — the button is rendered and interactive.
 * - `"disabled"` — the button is hidden from the toolbar.
 *
 * Used as the value type in every button-state record throughout the
 * toolbar configuration system.
 *
 * @example
 * ```ts
 * const state: ToolbarButtonState = "enabled";
 * ```
 */
export type ToolbarButtonState = "enabled" | "disabled";

/**
 * Supported image formats for downloading a rendered diagram.
 *
 * - `"svg"` — lossless vector format; preserves full quality at any zoom.
 * - `"png"` — rasterized with a white background; widely compatible.
 * - `"jpg"` — lossy rasterized format with a white background.
 *
 * Configured via {@link MermaidToolbarOptions.downloadFormat} and consumed
 * by the download handler in `MermaidDiagram.vue`.
 *
 * @default "svg"
 *
 * @example
 * ```ts
 * const format: DownloadFormat = "png";
 * ```
 */
export type DownloadFormat = "svg" | "png" | "jpg";

/**
 * Determines how fullscreen mode is presented to users when the
 * fullscreen toolbar button is clicked.
 *
 * - `"browser"` — Uses the native browser Fullscreen API
 *   (`Element.requestFullscreen()`). The diagram takes over the entire
 *   screen and an OS-level fullscreen chrome is shown. This is the
 *   default for backwards compatibility.
 * - `"dialog"` — Renders the diagram in an in-page modal dialog overlay
 *   managed via CSS (`mermaid-dialog-backdrop`). This avoids browser
 *   permission prompts and works in contexts where the Fullscreen API
 *   is restricted (e.g. embedded iframes).
 *
 * Configured via {@link MermaidToolbarOptions.fullscreenMode} and used
 * in `MermaidDiagram.vue` and `useMermaidNavigation.ts`.
 *
 * @default "browser"
 *
 * @example
 * ```ts
 * const mode: FullscreenMode = "dialog";
 * ```
 */
export type FullscreenMode = "browser" | "dialog";

/**
 * Union of every button identifier that can appear inside the toolbar,
 * regardless of which display mode (desktop / mobile / fullscreen) is
 * active. This is the broadest button set and is used as the generic
 * constraint for the fullscreen toolbar configuration.
 *
 * Individual modes may narrow this set — see {@link DesktopToolbarButton}
 * and {@link MobileToolbarButton}.
 *
 * | Button               | Description                              |
 * | -------------------- | ---------------------------------------- |
 * | `"zoomIn"`           | Increases the diagram scale by 20 %      |
 * | `"zoomOut"`          | Decreases the diagram scale by ~17 %     |
 * | `"resetView"`        | Resets zoom and pan to defaults           |
 * | `"copyCode"`         | Copies the raw Mermaid source to clipboard|
 * | `"toggleFullscreen"` | Toggles fullscreen display                |
 * | `"download"`         | Downloads the diagram as an image file    |
 *
 * @example
 * ```ts
 * const btn: ToolbarButton = "download";
 * ```
 */
export type ToolbarButton =
  | "zoomIn"
  | "zoomOut"
  | "resetView"
  | "copyCode"
  | "toggleFullscreen"
  | "download";

/**
 * Canonical key set for tooltip strings shown on toolbar buttons.
 *
 * Mirrors {@link ToolbarButton} so every interactive button has exactly
 * one tooltip key. Used as the index type of {@link ToolbarTooltipText}
 * and the `data-mermaid-control` attribute applied to each rendered
 * button in `MermaidControls.vue`.
 *
 * @example
 * ```ts
 * const key: ToolbarTooltipKey = "zoomIn";
 * ```
 */
export type ToolbarTooltipKey = ToolbarButton;

/**
 * Fully-resolved tooltip text map for every toolbar button.
 *
 * Every key from {@link ToolbarTooltipKey} is required so consuming
 * components can read tooltip strings without null/undefined checks.
 *
 * Built-in defaults are English and live in
 * {@link DEFAULT_TOOLBAR_CONFIG}.`i18n.tooltips`.
 *
 * @example
 * ```ts
 * const tooltips: ToolbarTooltipText = {
 *   zoomIn: "Yakınlaştır",
 *   zoomOut: "Uzaklaştır",
 *   resetView: "Görünümü sıfırla",
 *   copyCode: "Kodu kopyala",
 *   download: "Diyagramı indir",
 *   toggleFullscreen: "Tam ekranı aç/kapa",
 * };
 * ```
 */
export type ToolbarTooltipText = Record<ToolbarTooltipKey, string>;

/**
 * Per-locale tooltip override accepted inside
 * {@link ToolbarI18nOptions.locales}.
 *
 * Every key is optional; missing keys fall back to the global
 * `i18n.tooltips` overrides and finally to the built-in English defaults.
 */
export interface ToolbarI18nLocaleOptions {
  /**
   * Partial overrides for the tooltip text map for this locale.
   */
  tooltips?: Partial<ToolbarTooltipText>;
}

/**
 * Consumer-facing locale-aware tooltip configuration block.
 *
 * Designed to be aligned with the VitePress multilingual model:
 * `localeIndex` matches the key VitePress exposes via `useData()` (for
 * example `"root"`, `"en"`, `"tr"`). The library itself stays framework
 * agnostic — consumers are responsible for forwarding the active locale
 * index from VitePress to {@link MermaidRenderer.setToolbar}.
 *
 * Resolution precedence (high to low):
 * 1. `locales[localeIndex].tooltips[key]`
 * 2. `tooltips[key]`
 * 3. Built-in English default in {@link DEFAULT_TOOLBAR_CONFIG}.
 *
 * @example
 * ```ts
 * const i18n: ToolbarI18nOptions = {
 *   localeIndex: "tr",
 *   tooltips: { copyCode: "Kodu kopyala" },
 *   locales: {
 *     tr: {
 *       tooltips: {
 *         zoomIn: "Yakınlaştır",
 *         zoomOut: "Uzaklaştır",
 *         resetView: "Görünümü sıfırla",
 *         download: "Diyagramı indir",
 *         toggleFullscreen: "Tam ekranı aç/kapa",
 *       },
 *     },
 *   },
 * };
 * ```
 */
export interface ToolbarI18nOptions {
  /**
   * Active VitePress locale index. Defaults to `"root"` when omitted,
   * matching the VitePress default locale key.
   */
  localeIndex?: string;
  /**
   * Optional global tooltip overrides applied when a locale-specific
   * value is missing.
   */
  tooltips?: Partial<ToolbarTooltipText>;
  /**
   * Optional per-locale tooltip overrides keyed by VitePress locale index.
   */
  locales?: Record<string, ToolbarI18nLocaleOptions>;
}

/**
 * Fully-resolved i18n block stored on {@link ResolvedToolbarConfig}.
 *
 * Both fields are guaranteed to be present so downstream components can
 * read tooltip strings directly without null checks.
 */
export interface ResolvedToolbarI18n {
  /**
   * Active VitePress locale index that was used to resolve `tooltips`.
   */
  localeIndex: string;
  /**
   * Concrete tooltip text map applied to rendered buttons.
   */
  tooltips: ToolbarTooltipText;
}

/**
 * The set of buttons available in the **desktop** toolbar mode.
 *
 * Currently identical to {@link ToolbarButton} (all buttons are available),
 * but defined as a separate type alias so the desktop configuration can
 * be narrowed independently in the future without breaking the API.
 *
 * Used as the generic parameter for {@link DesktopToolbarOptions}.
 *
 * @see ToolbarButton
 */
export type DesktopToolbarButton = ToolbarButton;

/**
 * The set of buttons available in the **mobile** toolbar mode.
 *
 * Although the union members are currently the same as {@link ToolbarButton},
 * the mobile mode disables zoom buttons by default (see
 * {@link DEFAULT_TOOLBAR_CONFIG}) to save screen space. Consumers can
 * re-enable them explicitly via `mobile: { zoomIn: "enabled" }`.
 *
 * Used as the generic parameter for {@link MobileToolbarOptions}.
 *
 * @see ToolbarButton
 */
export type MobileToolbarButton =
  | "resetView"
  | "copyCode"
  | "toggleFullscreen"
  | "zoomIn"
  | "zoomOut"
  | "download";

/**
 * Valid vertical anchors for the toolbar container inside the diagram.
 * Combined with {@link ToolbarHorizontalPosition} to form a
 * {@link ToolbarPosition} that selects a corner of the diagram.
 *
 * @example
 * ```ts
 * const v: ToolbarVerticalPosition = "top";
 * ```
 */
export type ToolbarVerticalPosition = "top" | "bottom";

/**
 * Valid horizontal anchors for the toolbar container inside the diagram.
 * Combined with {@link ToolbarVerticalPosition} to form a
 * {@link ToolbarPosition} that selects a corner of the diagram.
 *
 * @example
 * ```ts
 * const h: ToolbarHorizontalPosition = "left";
 * ```
 */
export type ToolbarHorizontalPosition = "left" | "right";

/**
 * Describes the anchor corner for the toolbar container within the
 * diagram wrapper. Composed of a vertical and a horizontal anchor,
 * effectively selecting one of the four corners (top-left, top-right,
 * bottom-left, bottom-right).
 *
 * Each display mode (desktop, mobile, fullscreen) can have its own
 * position. If not overridden, the default is `bottom-right`.
 *
 * @example
 * ```ts
 * const position: ToolbarPosition = {
 *   vertical: "top",
 *   horizontal: "left",
 * };
 * ```
 */
export interface ToolbarPosition {
  /**
   * Vertical alignment of the toolbar.
   */
  vertical: ToolbarVerticalPosition;
  /**
   * Horizontal alignment of the toolbar.
   */
  horizontal: ToolbarHorizontalPosition;
}

/**
 * Generic shape accepted by each mode-specific override block in the
 * consumer-facing {@link MermaidToolbarOptions}.
 *
 * Consumers can selectively enable or disable individual buttons and
 * optionally reposition the toolbar in a different corner via `positions`.
 * Every field is optional — omitted buttons and positions fall back to
 * the defaults defined in {@link DEFAULT_TOOLBAR_CONFIG}.
 *
 * The generic parameter `ButtonType` is bound to the button union for
 * the specific mode (e.g. {@link DesktopToolbarButton} for desktop).
 *
 * @typeParam ButtonType - The union of button identifiers valid for the
 *   target display mode.
 *
 * @example
 * ```ts
 * // Hide the copy button and move toolbar to top-left on desktop
 * const desktopOverrides: ToolbarModeOverrides<DesktopToolbarButton> = {
 *   copyCode: "disabled",
 *   positions: { vertical: "top", horizontal: "left" },
 * };
 * ```
 */
export type ToolbarModeOverrides<ButtonType extends string> = Partial<
  Record<ButtonType, ToolbarButtonState>
> & {
  /**
   * Optional overrides for the toolbar's position options.
   */
  positions?: Partial<ToolbarPosition>;
  /**
   * Controls the visibility of the zoom level indicator.
   */
  zoomLevel?: ToolbarButtonState;
};

/**
 * Consumer-facing override options for the **desktop** toolbar mode.
 * Shorthand for `ToolbarModeOverrides<DesktopToolbarButton>`.
 *
 * @see ToolbarModeOverrides
 * @see DesktopToolbarButton
 */
export type DesktopToolbarOptions = ToolbarModeOverrides<DesktopToolbarButton>;

/**
 * Consumer-facing override options for the **mobile** toolbar mode.
 * Shorthand for `ToolbarModeOverrides<MobileToolbarButton>`.
 *
 * @see ToolbarModeOverrides
 * @see MobileToolbarButton
 */
export type MobileToolbarOptions = ToolbarModeOverrides<MobileToolbarButton>;

/**
 * Consumer-facing override options for the **fullscreen** toolbar mode.
 * Shorthand for `ToolbarModeOverrides<ToolbarButton>`.
 *
 * @see ToolbarModeOverrides
 * @see ToolbarButton
 */
export type FullscreenToolbarOptions = ToolbarModeOverrides<ToolbarButton>;

/**
 * Top-level, **consumer-facing** toolbar configuration interface.
 *
 * Accepted by:
 * - `MermaidRenderer.setToolbar(toolbar)` — applies options globally
 *   to all future diagram mounts.
 * - `<MermaidDiagram :toolbar="toolbar" />` — applies options to a
 *   single diagram instance.
 *
 * Every field is optional. Omitted modes and properties gracefully fall
 * back to the values defined in {@link DEFAULT_TOOLBAR_CONFIG}.
 *
 * @example
 * ```ts
 * const toolbar: MermaidToolbarOptions = {
 *   showLanguageLabel: false,
 *   downloadFormat: "png",
 *   fullscreenMode: "dialog",
 *   desktop: {
 *     download: "enabled",
 *     positions: { vertical: "top", horizontal: "left" },
 *   },
 *   mobile: {
 *     zoomIn: "enabled",
 *     zoomOut: "enabled",
 *   },
 * };
 * ```
 */
export interface MermaidToolbarOptions {
  /**
   * Toggles whether the original VitePress language label (the little "mermaid"
   * badge VitePress renders in the top-right corner of fenced code blocks)
   * remains visible after the renderer replaces the block with the interactive
   * diagram. Defaults to true.
   */
  showLanguageLabel?: boolean;
  /**
   * Specifies the format to use when downloading the diagram.
   * Defaults to "svg".
   */
  downloadFormat?: DownloadFormat;
  /**
   * Controls how fullscreen is displayed when the fullscreen button is clicked.
   * Defaults to "browser" for backwards compatibility.
   */
  fullscreenMode?: FullscreenMode;
  /**
   * Configuration options for the desktop toolbar.
   */
  desktop?: ToolbarModeOverrides<DesktopToolbarButton>;
  /**
   * Configuration options for the mobile toolbar.
   */
  mobile?: ToolbarModeOverrides<MobileToolbarButton>;
  /**
   * Configuration options for the fullscreen toolbar.
   */
  fullscreen?: ToolbarModeOverrides<ToolbarButton>;
  /**
   * Optional locale-aware overrides for toolbar button tooltip text.
   *
   * Designed for VitePress multilingual sites: pass the active
   * `localeIndex` returned by `useData()` and provide tooltip
   * translations under `locales`. See {@link ToolbarI18nOptions}.
   */
  i18n?: ToolbarI18nOptions;
}

/**
 * Internal, fully-resolved shape describing a single toolbar mode
 * (desktop, mobile, or fullscreen) after user overrides have been
 * merged with the defaults.
 *
 * Unlike the consumer-facing {@link ToolbarModeOverrides}, every
 * property here is **required** — no optional fields remain. This
 * makes downstream rendering logic in `MermaidControls.vue`
 * straightforward because it never needs to handle `undefined`.
 *
 * @typeParam ButtonType - The union of button identifiers valid for
 *   the target display mode.
 *
 * @see resolveToolbarMode
 */
export interface ToolbarModeConfig<ButtonType extends string> {
  /**
   * Button states for the current toolbar mode.
   */
  buttons: Record<ButtonType, ToolbarButtonState>;
  /**
   * Position configuration for the current toolbar mode.
   */
  positions: ToolbarPosition;
  /**
   * State of the zoom level indicator.
   */
  zoomLevel: ToolbarButtonState;
}

/**
 * Fully resolved toolbar configuration that is stored by
 * {@link MermaidRenderer} and passed down to Vue components as a prop.
 *
 * Unlike the consumer-facing {@link MermaidToolbarOptions}, every
 * property is guaranteed to be present (no optionals). Components can
 * read fields directly without null/undefined checks.
 *
 * Created by {@link resolveToolbarConfig} and discriminated from raw
 * user input via the {@link isResolvedToolbarConfig} type guard.
 *
 * @example
 * ```ts
 * import { resolveToolbarConfig } from "./toolbar";
 *
 * const resolved: ResolvedToolbarConfig = resolveToolbarConfig({
 *   desktop: { download: "enabled" },
 * });
 * console.log(resolved.desktop.buttons.download); // "enabled"
 * console.log(resolved.desktop.positions.vertical); // "bottom" (default)
 * ```
 */
export interface ResolvedToolbarConfig {
  /**
   * Resolved configuration for the desktop toolbar.
   */
  desktop: ToolbarModeConfig<DesktopToolbarButton>;
  /**
   * Resolved configuration for the mobile toolbar.
   */
  mobile: ToolbarModeConfig<MobileToolbarButton>;
  /**
   * Resolved configuration for the fullscreen toolbar.
   */
  fullscreen: ToolbarModeConfig<ToolbarButton>;
  /**
   * Whether to show the language label.
   */
  showLanguageLabel: boolean;
  /**
   * The format for downloading the diagram.
   */
  downloadFormat: DownloadFormat;
  /**
   * Resolved fullscreen display mode.
   */
  fullscreenMode: FullscreenMode;
  /**
   * Resolved locale-aware tooltip text used by `MermaidControls.vue`.
   *
   * Always present after resolution. See {@link ResolvedToolbarI18n}.
   */
  i18n: ResolvedToolbarI18n;
}

/**
 * Type guard that distinguishes an already-resolved {@link ResolvedToolbarConfig}
 * from a raw, user-supplied {@link MermaidToolbarOptions} object.
 *
 * This is necessary because `MermaidDiagram.vue` accepts both shapes
 * in its `toolbar` prop. When the config comes from `MermaidRenderer`
 * it is already resolved; when a consumer passes it inline it may be
 * a partial options object that still needs resolution.
 *
 * The guard checks for structural markers that only exist after
 * resolution: the presence of nested `buttons`, `positions`, and
 * `zoomLevel` keys inside the `desktop` mode, plus the required
 * scalar fields `showLanguageLabel`, `downloadFormat`, and
 * `fullscreenMode`.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is a {@link ResolvedToolbarConfig},
 *          `false` otherwise.
 *
 * @example
 * ```ts
 * const input: MermaidToolbarOptions | ResolvedToolbarConfig = getToolbar();
 * if (isResolvedToolbarConfig(input)) {
 *   // input is ResolvedToolbarConfig — use directly
 * } else {
 *   // input is MermaidToolbarOptions — needs resolveToolbarConfig()
 * }
 * ```
 */
export const isResolvedToolbarConfig = (
  value: unknown,
): value is ResolvedToolbarConfig => {
  const candidate = value as Partial<ResolvedToolbarConfig> | undefined;
  return Boolean(
    candidate &&
    candidate.desktop &&
    typeof candidate.desktop === "object" &&
    "buttons" in candidate.desktop &&
    "positions" in candidate.desktop &&
    "zoomLevel" in candidate.desktop &&
    typeof candidate.showLanguageLabel === "boolean" &&
    typeof candidate.downloadFormat === "string" &&
    typeof candidate.fullscreenMode === "string" &&
    !!candidate.i18n &&
    typeof candidate.i18n === "object" &&
    typeof candidate.i18n.localeIndex === "string" &&
    !!candidate.i18n.tooltips &&
    typeof candidate.i18n.tooltips === "object",
  );
};

/**
 * Canonical default configuration for every toolbar mode.
 *
 * This constant serves as the baseline that {@link resolveToolbarConfig}
 * merges user overrides into. If a consumer omits a field, the value
 * from this object is used.
 *
 * **Default button states:**
 *
 * | Button              | Desktop   | Mobile    | Fullscreen |
 * | ------------------- | --------- | --------- | ---------- |
 * | `zoomIn`            | enabled   | disabled  | disabled   |
 * | `zoomOut`           | enabled   | disabled  | disabled   |
 * | `resetView`         | enabled   | enabled   | disabled   |
 * | `copyCode`          | enabled   | enabled   | disabled   |
 * | `toggleFullscreen`  | enabled   | enabled   | enabled    |
 * | `download`          | disabled  | disabled  | disabled   |
 *
 * All modes default to `bottom-right` positioning and `zoomLevel: "enabled"`.
 *
 * @constant
 */
export const DEFAULT_TOOLBAR_CONFIG: ResolvedToolbarConfig = {
  desktop: {
    buttons: {
      zoomIn: "enabled",
      zoomOut: "enabled",
      resetView: "enabled",
      copyCode: "enabled",
      toggleFullscreen: "enabled",
      download: "disabled",
    },
    positions: {
      vertical: "bottom",
      horizontal: "right",
    },
    zoomLevel: "enabled",
  },
  mobile: {
    buttons: {
      zoomIn: "disabled",
      zoomOut: "disabled",
      resetView: "enabled",
      copyCode: "enabled",
      toggleFullscreen: "enabled",
      download: "disabled",
    },
    positions: {
      vertical: "bottom",
      horizontal: "right",
    },
    zoomLevel: "enabled",
  },
  fullscreen: {
    buttons: {
      zoomIn: "disabled",
      zoomOut: "disabled",
      resetView: "disabled",
      copyCode: "disabled",
      toggleFullscreen: "enabled",
      download: "disabled",
    },
    positions: {
      vertical: "bottom",
      horizontal: "right",
    },
    zoomLevel: "enabled",
  },
  showLanguageLabel: true,
  downloadFormat: "svg",
  fullscreenMode: "browser",
  i18n: {
    localeIndex: "root",
    tooltips: {
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetView: "Reset View",
      copyCode: "Copy Code",
      download: "Download Diagram",
      toggleFullscreen: "Toggle Fullscreen",
    },
  },
} as const;

/**
 * Merges optional user-provided positional overrides with the defaults,
 * ensuring both axes (`vertical` and `horizontal`) always have a
 * concrete value even when the consumer only overrides one axis.
 *
 * @param defaults - The base position from {@link DEFAULT_TOOLBAR_CONFIG}.
 * @param overrides - Optional partial position provided by the consumer.
 * @returns A fully-resolved {@link ToolbarPosition}.
 *
 * @example
 * ```ts
 * const pos = mergePosition(
 *   { vertical: "bottom", horizontal: "right" },
 *   { vertical: "top" },
 * );
 * // pos => { vertical: "top", horizontal: "right" }
 * ```
 */
const mergePosition = (
  defaults: ToolbarPosition,
  overrides?: Partial<ToolbarPosition>,
): ToolbarPosition => ({
  vertical: overrides?.vertical ?? defaults.vertical,
  horizontal: overrides?.horizontal ?? defaults.horizontal,
});

/**
 * Type guard that verifies whether a given value is one of the two valid
 * {@link ToolbarButtonState} string literals (`"enabled"` or `"disabled"`).
 *
 * Used internally by {@link mergeToolbarButtons} to filter out non-button
 * keys (like `positions` and `zoomLevel`) that share the same override
 * object.
 *
 * @param value - The value to check.
 * @returns `true` if `value` is `"enabled"` or `"disabled"`.
 */
const isToolbarButtonState = (value: unknown): value is ToolbarButtonState =>
  value === "enabled" || value === "disabled";

/**
 * Merges per-button state overrides with defaults while safely ignoring
 * the `positions` and `zoomLevel` keys that coexist in the same
 * {@link ToolbarModeOverrides} object.
 *
 * Only values that pass the {@link isToolbarButtonState} guard are
 * applied; all other keys are silently skipped.
 *
 * @typeParam ButtonType - The union of button identifiers for the
 *   target display mode.
 * @param defaults - The default button state record from
 *   {@link DEFAULT_TOOLBAR_CONFIG}.
 * @param overrides - Optional consumer-provided overrides.
 * @returns A new record with every button resolved to a concrete state.
 *
 * @example
 * ```ts
 * const buttons = mergeToolbarButtons(
 *   { zoomIn: "enabled", zoomOut: "enabled", download: "disabled" },
 *   { download: "enabled" },
 * );
 * // buttons.download => "enabled"
 * ```
 */
const mergeToolbarButtons = <ButtonType extends string>(
  defaults: Record<ButtonType, ToolbarButtonState>,
  overrides?: ToolbarModeOverrides<ButtonType>,
): Record<ButtonType, ToolbarButtonState> => {
  if (!overrides) {
    return { ...defaults };
  }

  const merged = { ...defaults };
  (Object.keys(overrides) as Array<keyof typeof overrides>).forEach((key) => {
    if (key === "positions" || key === "zoomLevel") {
      return;
    }
    const buttonKey = key as ButtonType;
    const value = overrides[buttonKey];
    if (isToolbarButtonState(value)) {
      merged[buttonKey] = value;
    }
  });
  return merged;
};

/**
 * Resolves a single toolbar mode by independently merging button states,
 * positional overrides, and the zoom-level indicator.
 *
 * This is an internal helper called once per mode (desktop, mobile,
 * fullscreen) by {@link resolveToolbarConfig}.
 *
 * @typeParam ButtonType - The union of button identifiers for the
 *   target display mode.
 * @param defaults - The default mode config from
 *   {@link DEFAULT_TOOLBAR_CONFIG}.
 * @param overrides - Optional consumer-provided overrides.
 * @returns A fully-resolved {@link ToolbarModeConfig}.
 */
const resolveToolbarMode = <ButtonType extends string>(
  defaults: ToolbarModeConfig<ButtonType>,
  overrides?: ToolbarModeOverrides<ButtonType>,
): ToolbarModeConfig<ButtonType> => {
  return {
    buttons: mergeToolbarButtons(defaults.buttons, overrides),
    positions: mergePosition(defaults.positions, overrides?.positions),
    zoomLevel:
      overrides?.zoomLevel && isToolbarButtonState(overrides.zoomLevel)
        ? overrides.zoomLevel
        : defaults.zoomLevel,
  };
};

/**
 * Public helper that normalizes a consumer-supplied
 * {@link MermaidToolbarOptions} object into a fully-resolved
 * {@link ResolvedToolbarConfig} by merging each mode's overrides
 * with the canonical {@link DEFAULT_TOOLBAR_CONFIG}.
 *
 * When called without arguments (or with `undefined`), the returned
 * configuration is identical to `DEFAULT_TOOLBAR_CONFIG`.
 *
 * This function is the **single source of truth** for toolbar
 * configuration resolution and is called by:
 * - `MermaidRenderer.setToolbar()` — on global toolbar changes.
 * - `MermaidDiagram.vue` — when the `toolbar` prop is a raw options
 *   object rather than an already-resolved config.
 *
 * @param toolbar - Optional partial toolbar options from the consumer.
 * @returns A fully-resolved toolbar config with no optional fields.
 *
 * @example
 * ```ts
 * import { resolveToolbarConfig } from "./toolbar";
 *
 * // All defaults
 * const defaults = resolveToolbarConfig();
 *
 * // Custom: enable download on desktop, use PNG format
 * const custom = resolveToolbarConfig({
 *   downloadFormat: "png",
 *   desktop: { download: "enabled" },
 * });
 * ```
 */
/**
 * Type guard ensuring an unknown value is a non-empty string.
 *
 * Used by {@link resolveToolbarI18n} so empty strings cannot accidentally
 * blank out a tooltip when overriding it.
 */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/**
 * Picks the first non-empty string tooltip override from the supplied
 * partial maps, falling back to `undefined` when none of them define a
 * non-empty value for `key`.
 */
const pickTooltip = (
  key: ToolbarTooltipKey,
  ...sources: Array<Partial<ToolbarTooltipText> | undefined>
): string | undefined => {
  for (const source of sources) {
    const candidate = source?.[key];
    if (isNonEmptyString(candidate)) {
      return candidate;
    }
  }
  return undefined;
};

/**
 * Resolves the locale-aware tooltip block for {@link ResolvedToolbarConfig}.
 *
 * Precedence (high to low):
 * 1. `i18n.locales[localeIndex].tooltips[key]`
 * 2. `i18n.tooltips[key]`
 * 3. Built-in default in `DEFAULT_TOOLBAR_CONFIG.i18n.tooltips[key]`.
 *
 * If `localeIndex` is omitted, the VitePress-default `"root"` key is used.
 *
 * @param i18n - Optional consumer-provided i18n options.
 * @returns A fully-resolved {@link ResolvedToolbarI18n}.
 */
export const resolveToolbarI18n = (
  i18n?: ToolbarI18nOptions,
): ResolvedToolbarI18n => {
  const localeIndex = isNonEmptyString(i18n?.localeIndex)
    ? i18n!.localeIndex!
    : DEFAULT_TOOLBAR_CONFIG.i18n.localeIndex;

  const localeOverrides = i18n?.locales?.[localeIndex]?.tooltips;
  const globalOverrides = i18n?.tooltips;
  const defaults = DEFAULT_TOOLBAR_CONFIG.i18n.tooltips;

  const keys: ToolbarTooltipKey[] = [
    "zoomIn",
    "zoomOut",
    "resetView",
    "copyCode",
    "toggleFullscreen",
    "download",
  ];

  const tooltips = keys.reduce((acc, key) => {
    acc[key] =
      pickTooltip(key, localeOverrides, globalOverrides) ?? defaults[key];
    return acc;
  }, {} as ToolbarTooltipText);

  return { localeIndex, tooltips };
};

export const resolveToolbarConfig = (
  toolbar?: MermaidToolbarOptions,
): ResolvedToolbarConfig => {
  const showLanguageLabel =
    toolbar?.showLanguageLabel ?? DEFAULT_TOOLBAR_CONFIG.showLanguageLabel;

  const downloadFormat =
    toolbar?.downloadFormat ?? DEFAULT_TOOLBAR_CONFIG.downloadFormat;

  const fullscreenMode =
    toolbar?.fullscreenMode ?? DEFAULT_TOOLBAR_CONFIG.fullscreenMode;

  return {
    desktop: resolveToolbarMode(
      DEFAULT_TOOLBAR_CONFIG.desktop,
      toolbar?.desktop,
    ),
    mobile: resolveToolbarMode(DEFAULT_TOOLBAR_CONFIG.mobile, toolbar?.mobile),
    fullscreen: resolveToolbarMode(
      DEFAULT_TOOLBAR_CONFIG.fullscreen,
      toolbar?.fullscreen,
    ),
    showLanguageLabel,
    downloadFormat,
    fullscreenMode,
    i18n: resolveToolbarI18n(toolbar?.i18n),
  };
};
