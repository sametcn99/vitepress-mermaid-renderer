import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  const isReleaseBuild = mode === 'release';

  return {
    plugins: [
      vue(),
      dts({
        exclude: ['test.ts', 'docs/**', 'test-project/**', 'tests/**'],
        insertTypesEntry: true,
        rollupTypes: true,
        compilerOptions: {
          removeComments: true,
        },
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'VitepressMermaidRenderer',
        fileName: () => 'vitepress-mermaid-renderer.js',
        formats: ['es'],
      },
      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
        external: ['vue', 'mermaid'],
        output: {
          globals: {
            vue: 'Vue',
            mermaid: 'mermaid',
          },
        },
      },
      sourcemap: false,
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          passes: 3,
          pure_getters: true,
          unsafe_arrows: true,
          hoist_funs: true,
          drop_debugger: true,
          drop_console: isReleaseBuild,
          sequences: false,
          conditionals: true,
          evaluate: true,
          booleans: true,
          loops: true,
          unused: true,
          warnings: false,
          comparisons: true,
          inline: 2,
          join_vars: true,
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/,
            reserved: [],
          },
        },
        format: {
          comments: false,
          ascii_only: true,
        },
      },
      cssMinify: true,
      cssCodeSplit: true,
      outDir: 'dist',
      emptyOutDir: true,
    },
    test: {
      environment: 'happy-dom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['tests/**/*.test.ts'],
      exclude: ['dist/**', 'docs/**', 'test-project/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/types/**'],
      },
    },
  };
});
