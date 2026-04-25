import { h, nextTick, watch } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";

const toolbarTooltipsByLocale = {
  tr: {
    zoomIn: "Yakınlaştır",
    zoomOut: "Uzaklaştır",
    resetView: "Görünümü sıfırla",
    copyCode: "Kodu kopyala",
    copyCodeCopied: "Kopyalandı",
    download: "Diyagramı indir",
    toggleFullscreen: "Tam ekranı aç/kapa",
  },
} as const;

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark, localeIndex } = useData();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? "dark" : "forest",
      });
      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        fullscreenMode: "browser",
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
          download: "enabled",
        },
        downloadFormat: "svg",
        i18n: {
          localeIndex: localeIndex.value,
          locales: Object.fromEntries(
            Object.entries(toolbarTooltipsByLocale).map(
              ([locale, tooltips]) => [locale, { tooltips }],
            ),
          ),
        },
      });
    };

    // initial mermaid setup
    nextTick(() => initMermaid());

    // re-render mermaid charts when theme or active locale changes
    watch(
      () => [isDark.value, localeIndex.value] as const,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
