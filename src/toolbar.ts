/**
 * Represents the two possible runtime states for any toolbar button.
 */
export type ToolbarButtonState = "enabled" | "disabled";

/**
 * Supported download formats for the diagram.
 */
export type DownloadFormat = "svg" | "png" | "jpg";

/**
 * All buttons that can ever appear inside the toolbar regardless of mode.
 */
export type ToolbarButton =
  | "zoomIn"
  | "zoomOut"
  | "resetView"
  | "copyCode"
  | "toggleFullscreen"
  | "download";

/**
 * Desktop view can expose every toolbar button.
 */
export type DesktopToolbarButton = ToolbarButton;

/**
 * Mobile view intentionally keeps the button set slimmer by default for space
 * reasons, but the zoom controls can be toggled on when needed.
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
 */
export type ToolbarVerticalPosition = "top" | "bottom";
/**
 * Valid horizontal anchors for the toolbar container inside the diagram.
 */
export type ToolbarHorizontalPosition = "left" | "right";

/**
 * Combination of vertical and horizontal anchors, effectively selecting a corner.
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
 * Shape accepted by each mode-specific override block. Consumers can override
 * individual button states and optionally place the toolbar in a different
 * corner via `positions`.
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
 * Options specifically for the desktop toolbar mode.
 */
export type DesktopToolbarOptions = ToolbarModeOverrides<DesktopToolbarButton>;

/**
 * Options specifically for the mobile toolbar mode.
 */
export type MobileToolbarOptions = ToolbarModeOverrides<MobileToolbarButton>;

/**
 * Options specifically for the fullscreen toolbar mode.
 */
export type FullscreenToolbarOptions = ToolbarModeOverrides<ToolbarButton>;

/**
 * Top-level configuration accepted by `setToolbar()` and `<MermaidDiagram toolbar />`.
 * Each mode is optional and falls back to defaults when omitted.
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
}

/**
 * Internal shape describing a mode once overrides and defaults have been resolved.
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
 * Fully resolved toolbar configuration stored by the renderer and passed
 * down to Vue components.
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
}

/**
 * Type guard that distinguishes already-resolved toolbar configs from raw
 * user-supplied overrides.
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
      typeof candidate.downloadFormat === "string",
  );
};

/**
 * Canonical defaults for every toolbar mode, used as a baseline before user
 * overrides are merged in.
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
} as const;

/**
 * Merges optional user-provided positional overrides with the defaults while
 * ensuring both axes always have a concrete value.
 */
const mergePosition = (
  defaults: ToolbarPosition,
  overrides?: Partial<ToolbarPosition>,
): ToolbarPosition => ({
  vertical: overrides?.vertical ?? defaults.vertical,
  horizontal: overrides?.horizontal ?? defaults.horizontal,
});

/**
 * Type guard verifying a value is a valid button state string literal.
 */
const isToolbarButtonState = (value: unknown): value is ToolbarButtonState =>
  value === "enabled" || value === "disabled";

/**
 * Merges per-button state overrides with defaults while ignoring the `positions`
 * key that shares the same object in the public API.
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
 * Resolves a single toolbar mode by merging button states and positional
 * overrides independently.
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
 * Public helper that normalizes the full toolbar configuration object,
 * guaranteeing button states and positions exist for every mode.
 */
export const resolveToolbarConfig = (
  toolbar?: MermaidToolbarOptions,
): ResolvedToolbarConfig => {
  const showLanguageLabel =
    toolbar?.showLanguageLabel ?? DEFAULT_TOOLBAR_CONFIG.showLanguageLabel;

  const downloadFormat =
    toolbar?.downloadFormat ?? DEFAULT_TOOLBAR_CONFIG.downloadFormat;

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
  };
};
