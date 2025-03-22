// https://vitepress.dev/guide/custom-theme
import { h, nextTick, onMounted } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";
import "vitepress-mermaid-renderer/dist/style.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Add a mounted hook to ensure diagrams render on initial page load
      "layout-top": () =>
        h({
          setup() {
            onMounted(() => {
              // This will run when the component is mounted on initial page load
              nextTick(() => {
                const mermaidRenderer = createMermaidRenderer({
                  theme: "default",
                  securityLevel: "loose",
                  startOnLoad: false,
                });
                mermaidRenderer.renderMermaidDiagrams();
              });
            });
            return () => null;
          },
        }),
    });
  },
  enhanceApp({ app, router }) {
    // Use client-only safe implementation
    const mermaidRenderer = createMermaidRenderer({
      theme: "default",
      securityLevel: "loose",
      startOnLoad: false,
    });

    mermaidRenderer.initialize();

    if (router) {
      router.onAfterRouteChange = () => {
        nextTick(() => mermaidRenderer.renderMermaidDiagrams());
      };
    }
  },
} satisfies Theme;
