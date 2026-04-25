# 测试指南

本项目包含分层测试套件，为 VitePress Mermaid Renderer 插件提供回归保障。

## 命令

| 命令                    | 说明                                                 |
| ----------------------- | ---------------------------------------------------- |
| `bun run test`          | 以 headless 模式运行 Vitest unit 和 component 测试。 |
| `bun run test:watch`    | 在本地开发时以 watch 模式运行 Vitest。               |
| `bun run test:coverage` | 运行 Vitest 并输出 V8 coverage 报告。                |
| `bun run test:e2e`      | 构建测试项目并运行 Playwright smoke suite。          |
| `bun run lint`          | 在整个 workspace 中运行 ESLint。                     |
| `bun run build`         | 生成可发布 bundle 和 `.d.ts` 输出。                  |

## 源码与测试对应关系

- `src/toolbar.ts` → `tests/toolbar.test.ts`
- `src/styleManager.ts` → `tests/styleManager.test.ts`
- `src/MermaidRenderer.ts` → `tests/MermaidRenderer.test.ts`
- `src/composables/useMermaidRenderer.ts` →
  `tests/composables/useMermaidRenderer.test.ts`
- `src/composables/useMermaidNavigation.ts` →
  `tests/composables/useMermaidNavigation.test.ts`
- `src/MermaidDiagram.vue` → `tests/components/MermaidDiagram.test.ts`
- `src/components/MermaidControls.vue` →
  `tests/components/MermaidControls.test.ts`
- `src/components/MermaidError.vue` → `tests/components/MermaidError.test.ts`

集成 VitePress 行为的端到端测试位于 `tests/e2e`。Locale
navigation 和 toolbar 测试会验证土耳其语 route 下翻译是否正确应用。

## 回归处理流程

1. 先用 unit test 复现问题。
2. 在相关 source 文件中完成修复。
3. 目标测试通过后运行 `bun run test`。
4. 检查受影响模块的 coverage 输出。
5. 使用 Playwright smoke suite 验证 VitePress 集成体验。
6. merge 前确保 lint 和 build 都通过。

## 新测试注意事项

- 使用 `vi.hoisted` 和 `vi.mock` mock `mermaid` 包，避免加载真实 renderer。
- 对 singleton 模块使用 `vi.resetModules()`，然后 dynamic import。
- 使用 `@vue/test-utils` 的 `mount` 和 host
  wrapper 组件暴露 composable 内部状态。
- 在 Playwright specs 中将 toolbar selector 限定到
  `.desktop-controls`，避免 strict-mode 冲突。
