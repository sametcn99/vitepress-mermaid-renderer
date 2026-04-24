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

  test("zooming one diagram does not affect sibling diagrams", async ({
    page,
  }) => {
    await page.goto("/examples/basic");
    const diagrams = page.locator(".mermaid-container");
    await expect(diagrams.first()).toBeVisible();
    await expect
      .poll(async () => diagrams.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2);

    const first = diagrams.nth(0);
    const second = diagrams.nth(1);
    await expect(first.locator(".mermaid > svg")).toBeVisible();
    await expect(second.locator(".mermaid > svg")).toBeVisible();

    const secondInitial = await second
      .locator(".mermaid")
      .first()
      .evaluate((el) => (el as HTMLElement).style.transform);

    await first
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();
    await first
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();

    const firstAfter = await first
      .locator(".mermaid")
      .first()
      .evaluate((el) => (el as HTMLElement).style.transform);
    const secondAfter = await second
      .locator(".mermaid")
      .first()
      .evaluate((el) => (el as HTMLElement).style.transform);

    expect(firstAfter).toMatch(/scale\(/);
    expect(secondAfter).toEqual(secondInitial);
  });
});
