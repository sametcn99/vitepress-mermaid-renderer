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

| Source                                                                             | Primary tests                                                                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [src/toolbar.ts](src/toolbar.ts)                                                   | [tests/toolbar.test.ts](tests/toolbar.test.ts)                                                   |
| [src/styleManager.ts](src/styleManager.ts)                                         | [tests/styleManager.test.ts](tests/styleManager.test.ts)                                         |
| [src/MermaidRenderer.ts](src/MermaidRenderer.ts)                                   | [tests/MermaidRenderer.test.ts](tests/MermaidRenderer.test.ts)                                   |
| [src/composables/useMermaidRenderer.ts](src/composables/useMermaidRenderer.ts)     | [tests/composables/useMermaidRenderer.test.ts](tests/composables/useMermaidRenderer.test.ts)     |
| [src/composables/useMermaidNavigation.ts](src/composables/useMermaidNavigation.ts) | [tests/composables/useMermaidNavigation.test.ts](tests/composables/useMermaidNavigation.test.ts) |
| [src/MermaidDiagram.vue](src/MermaidDiagram.vue)                                   | [tests/components/MermaidDiagram.test.ts](tests/components/MermaidDiagram.test.ts)               |
| [src/components/MermaidControls.vue](src/components/MermaidControls.vue)           | [tests/components/MermaidControls.test.ts](tests/components/MermaidControls.test.ts)             |
| [src/components/MermaidError.vue](src/components/MermaidError.vue)                 | [tests/components/MermaidError.test.ts](tests/components/MermaidError.test.ts)                   |

End-to-end coverage for the integrated VitePress experience lives under
[tests/e2e](tests/e2e):

- [tests/e2e/landing.spec.ts](tests/e2e/landing.spec.ts) — landing page rendering and navigation.
- [tests/e2e/examples.spec.ts](tests/e2e/examples.spec.ts) — basic and advanced example pages.
- [tests/e2e/toolbar.spec.ts](tests/e2e/toolbar.spec.ts) — zoom, reset, and clipboard interactions.
- [tests/e2e/fullscreen.spec.ts](tests/e2e/fullscreen.spec.ts) — Fullscreen API invocation.
- [tests/e2e/routing.spec.ts](tests/e2e/routing.spec.ts) — diagram persistence across route changes.
- [tests/e2e/test-project.smoke.spec.ts](tests/e2e/test-project.smoke.spec.ts) — original smoke baseline.

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
