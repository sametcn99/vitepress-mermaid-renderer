import { h, nextTick, watchEffect, watch } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";
import "vitepress-mermaid-renderer/dist/style.css";
import { useData, useRouter } from "vitepress";

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData();
    const router = useRouter();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? "dark" : "forest",
      });
      mermaidRenderer.initialize();
      nextTick(() => mermaidRenderer!.renderMermaidDiagrams());
    };

    // Initial render
    nextTick(() => initMermaid());

    // on theme change, re-render mermaid charts
    watch(
      () => isDark.value,
      () => {
        nextTick(() => initMermaid());
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
