import { h, nextTick, watchEffect, watch } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? "dark" : "forest",
      });
      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        desktop: {
          copyCode: "enabled",
          toggleFullscreen: "enabled",
          resetView: "enabled",
          zoomOut: "enabled",
          zoomIn: "enabled",
          zoomLevel: "enabled",
          download: "enabled",
        },
        fullscreen: {
          copyCode: "disabled",
          toggleFullscreen: "enabled",
          resetView: "disabled",
          zoomLevel: "disabled",
        },
        downloadFormat: "svg",
      });
    };

    // initial mermaid setup
    nextTick(() => initMermaid());

    // on theme change, re-render mermaid charts
    watch(
      () => isDark.value,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
