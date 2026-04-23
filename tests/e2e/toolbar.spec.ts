import { expect, test } from "@playwright/test";

/**
 * Exercises toolbar controls (zoom, reset, copy) on rendered diagrams.
 */
test.describe("toolbar interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/basic");
    await expect(page.locator(".mermaid-container").first()).toBeVisible();
    await expect(
      page.locator(".mermaid-container").first().locator(".mermaid > svg"),
    ).toBeVisible();
  });

  test("zoom in increases the SVG transform scale", async ({ page }) => {
    const diagram = page.locator(".mermaid-container").first();
    const inner = diagram.locator(".mermaid").first();

    const initialTransform = await inner.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );

    await diagram.locator('.desktop-controls [title="Zoom In"]').click();
    await diagram.locator('.desktop-controls [title="Zoom In"]').click();

    await expect
      .poll(async () =>
        inner.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .not.toEqual(initialTransform);

    const finalTransform = await inner.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );
    expect(finalTransform).toMatch(/scale\(/);
  });

  test("reset view restores the original transform", async ({ page }) => {
    const diagram = page.locator(".mermaid-container").first();
    const inner = diagram.locator(".mermaid").first();

    await diagram.locator('.desktop-controls [title="Zoom In"]').click();
    await diagram.locator('.desktop-controls [title="Zoom In"]').click();
    await diagram.locator('.desktop-controls [title="Reset View"]').click();

    await expect
      .poll(async () =>
        inner.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .toMatch(/scale\(1\)/);
  });

  test("copy button writes mermaid source to the clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const diagram = page.locator(".mermaid-container").first();
    await diagram.locator('.desktop-controls [title="Copy Code"]').click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.length).toBeGreaterThan(0);
    expect(clipboard).toMatch(/flowchart|graph|sequenceDiagram/i);
  });
});
