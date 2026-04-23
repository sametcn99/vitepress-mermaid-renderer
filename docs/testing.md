# Testing Guide

This project ships three layered test suites that together provide regression
safety for the VitePress Mermaid Renderer plugin.

## Commands

| Command                 | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `bun run test`          | Runs the full Vitest suite (unit + component) headlessly.    |
| `bun run test:watch`    | Re-runs Vitest in watch mode for local development.          |
| `bun run test:coverage` | Runs Vitest with V8 coverage and prints a summary.           |
| `bun run test:e2e`      | Builds the test project and runs the Playwright smoke suite. |
| `bun run lint`          | Runs ESLint across the workspace.                            |
| `bun run build`         | Produces the publishable bundle and `.d.ts` outputs.         |

## Source → Test Ownership Map

- [src/toolbar.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/toolbar.ts) → [tests/toolbar.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/toolbar.test.ts)
- [src/styleManager.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/styleManager.ts) → [tests/styleManager.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/styleManager.test.ts)
- [src/MermaidRenderer.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/MermaidRenderer.ts) → [tests/MermaidRenderer.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/MermaidRenderer.test.ts)
- [src/composables/useMermaidRenderer.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/composables/useMermaidRenderer.ts) → [tests/composables/useMermaidRenderer.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/composables/useMermaidRenderer.test.ts)
- [src/composables/useMermaidNavigation.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/composables/useMermaidNavigation.ts) → [tests/composables/useMermaidNavigation.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/composables/useMermaidNavigation.test.ts)
- [src/MermaidDiagram.vue](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/MermaidDiagram.vue) → [tests/components/MermaidDiagram.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/components/MermaidDiagram.test.ts)
- [src/components/MermaidControls.vue](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/components/MermaidControls.vue) → [tests/components/MermaidControls.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/components/MermaidControls.test.ts)
- [src/components/MermaidError.vue](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/src/components/MermaidError.vue) → [tests/components/MermaidError.test.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/components/MermaidError.test.ts)

End-to-end coverage for the integrated VitePress experience lives under
[tests/e2e](https://github.com/sametcn99/vitepress-mermaid-renderer/tree/main/tests/e2e):

- [tests/e2e/landing.spec.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/e2e/landing.spec.ts) — landing page rendering and navigation.
- [tests/e2e/examples.spec.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/e2e/examples.spec.ts) — basic and advanced example pages.
- [tests/e2e/toolbar.spec.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/e2e/toolbar.spec.ts) — zoom, reset, and clipboard interactions.
- [tests/e2e/fullscreen.spec.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/e2e/fullscreen.spec.ts) — Fullscreen API invocation.
- [tests/e2e/routing.spec.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/e2e/routing.spec.ts) — diagram persistence across route changes.
- [tests/e2e/test-project.smoke.spec.ts](https://github.com/sametcn99/vitepress-mermaid-renderer/blob/main/tests/e2e/test-project.smoke.spec.ts) — original smoke baseline.

## Regression Protocol

When a bug surfaces, follow this protocol before shipping a fix:

1. **Reproduce in a unit test first.** Pick the file from the ownership map,
   add a failing test that reproduces the regression, and confirm it fails
   locally with `bun run test`.
2. **Land the fix in source.** Update the relevant module and re-run the
   targeted test until it passes.
3. **Run the full Vitest suite.** `bun run test` must remain green for all
   suites.
4. **Run coverage and inspect the affected module.** `bun run test:coverage`
   should not show a meaningful regression for the changed file.
5. **Run the Playwright smoke suite.** `bun run test:e2e` exercises the
   integrated VitePress experience and must remain green.
6. **Lint and build.** `bun run lint && bun run build` must both succeed
   before the change is mergeable.

## Notes for New Tests

- Mock the `mermaid` package via `vi.hoisted` + `vi.mock` to avoid pulling in
  the real renderer.
- For singleton modules (`MermaidRenderer`, `styleManager`) reset via
  `vi.resetModules()` followed by a dynamic import.
- Use `@vue/test-utils` `mount` with `defineComponent` host wrappers to expose
  composable internals without exporting them from production code.
- For Playwright specs, scope toolbar selectors to `.desktop-controls` to
  avoid strict-mode collisions with the mobile control row.
