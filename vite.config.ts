import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
  const isReleaseBuild = mode === "release";

  return {
    plugins: [
      vue(),
      dts({
        exclude: ["test.ts", "docs/**", "test-project/**"],
        insertTypesEntry: true,
        rollupTypes: true,
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
        treeshake: "smallest",
        external: ["vue", "mermaid"],
        output: {
          globals: {
            vue: "Vue",
            mermaid: "mermaid",
          },
        },
      },
      sourcemap: false,
      // Ensure the code only runs in the client
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          passes: 3,
          pure_getters: true,
          unsafe_arrows: true,
          hoist_funs: true,
          drop_debugger: true,
          drop_console: isReleaseBuild,
        },
        mangle: {
          toplevel: true,
        },
        format: {
          comments: false,
          ascii_only: true,
        },
      },
      cssMinify: true,
      cssCodeSplit: false,
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
