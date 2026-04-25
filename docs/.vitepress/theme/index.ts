import { h, nextTick, watch } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';

const toolbarTooltipsByLocale = {
  tr: {
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    resetView: 'Görünümü sıfırla',
    copyCode: 'Kodu kopyala',
    copyCodeCopied: 'Kopyalandı',
    download: 'Diyagramı indir',
    toggleFullscreen: 'Tam ekranı aç/kapa',
  },
  zh: {
    zoomIn: '放大',
    zoomOut: '缩小',
    resetView: '重置视图',
    copyCode: '复制代码',
    copyCodeCopied: '已复制',
    download: '下载图表',
    toggleFullscreen: '切换全屏',
  },
} as const;

const toolbarLocales = Object.fromEntries(
  Object.entries(toolbarTooltipsByLocale).map(([locale, tooltips]) => [
    locale,
    { tooltips },
  ]),
);

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark, localeIndex } = useData();

    /** Applies the active VitePress theme and locale to Mermaid diagrams. */
    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
      });
      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        desktop: {
          copyCode: 'enabled',
          toggleFullscreen: 'enabled',
          resetView: 'enabled',
          zoomOut: 'enabled',
          zoomIn: 'enabled',
          zoomLevel: 'enabled',
          download: 'enabled',
        },
        fullscreen: {
          copyCode: 'disabled',
          toggleFullscreen: 'enabled',
          resetView: 'disabled',
          zoomLevel: 'disabled',
          download: 'enabled',
        },
        downloadFormat: 'svg',
        fullscreenMode: 'browser',
        i18n: {
          localeIndex: localeIndex.value,
          locales: toolbarLocales,
        },
      });
    };

    nextTick(() => initMermaid());

    watch(
      () => [isDark.value, localeIndex.value] as const,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
