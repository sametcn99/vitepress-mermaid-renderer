import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VitepressMermaidRenderer",
      fileName: (format) => {
        if (format === "es") return "vitepress-mermaid-renderer.js";
        if (format === "umd") return "vitepress-mermaid-renderer.umd.cjs";
        return `vitepress-mermaid-renderer.${format}`;
      },
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["vue", "mermaid"],
      output: {
        globals: {
          vue: "Vue",
          mermaid: "mermaid",
        },
      },
    },
    sourcemap: true,
    // Ensure the code only runs in the client
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: false,
    outDir: "dist",
    emptyOutDir: true,
  },
});
