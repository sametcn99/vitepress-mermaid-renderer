// https://vitepress.dev/guide/custom-theme
import { h, nextTick } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";
import "vitepress-mermaid-renderer/dist/style.css"; // This path will use the exports mapping in package.json

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {});
  },
  enhanceApp({ app, router, siteData }) {
    if (router) {
      router.onAfterPageLoad = () => {
        const mermaidRenderer = createMermaidRenderer();
        mermaidRenderer.initialize();
        mermaidRenderer.renderMermaidDiagrams();
      };
      router.onAfterRouteChange = () => {
        const mermaidRenderer = createMermaidRenderer();
        mermaidRenderer.initialize();
        mermaidRenderer.renderMermaidDiagrams();
      };
    }
  },
} satisfies Theme;
