import { expect, test } from "@playwright/test";

/**
 * Verifies the examples pages render multiple Mermaid diagrams with toolbars.
 */
test.describe("examples pages", () => {
  test("basic examples renders multiple diagrams with SVGs", async ({
    page,
  }) => {
    await page.goto("/examples/basic");
    const diagrams = page.locator(".mermaid-container");
    await expect(diagrams.first()).toBeVisible();

    await expect
      .poll(async () => diagrams.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(5);

    const count = await diagrams.count();
    for (let i = 0; i < count; i += 1) {
      await expect(diagrams.nth(i).locator(".mermaid > svg")).toBeVisible();
    }
  });

  test("advanced examples page renders at least one diagram", async ({
    page,
  }) => {
    await page.goto("/examples/advanced");
    const diagrams = page.locator(".mermaid-container");
    await expect(diagrams.first()).toBeVisible();
    await expect(diagrams.first().locator(".mermaid > svg")).toBeVisible();
  });
});
