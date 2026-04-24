import { expect, test } from "@playwright/test";

/**
 * Accessibility-focused edge cases for the toolbar:
 * - All enabled controls must expose matching `title` and `aria-label`.
 * - Buttons must be reachable with the keyboard (focusable).
 * - Activating a focused control with Enter must apply the same effect as a
 *   pointer click (zoom in changes the inner transform).
 */
test.describe("toolbar accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/basic");
    await expect(page.locator(".mermaid-container").first()).toBeVisible();
    await expect(
      page.locator(".mermaid-container").first().locator(".mermaid > svg"),
    ).toBeVisible();
  });

  test("every desktop control exposes matching title and aria-label", async ({
    page,
  }) => {
    const diagram = page.locator(".mermaid-container").first();
    const keys = [
      "zoomIn",
      "zoomOut",
      "resetView",
      "copyCode",
      "download",
      "toggleFullscreen",
    ];
    for (const key of keys) {
      const button = diagram
        .locator(`.desktop-controls [data-mermaid-control="${key}"]`)
        .first();
      await expect(button).toBeVisible();
      const title = await button.getAttribute("title");
      const aria = await button.getAttribute("aria-label");
      expect(title, `title for ${key}`).toBeTruthy();
      expect(aria, `aria-label for ${key}`).toEqual(title);
    }
  });

  test("zoom in is operable via keyboard activation", async ({ page }) => {
    const diagram = page.locator(".mermaid-container").first();
    const inner = diagram.locator(".mermaid").first();
    const zoomIn = diagram
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .first();

    const before = await inner.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );

    await zoomIn.focus();
    await expect(zoomIn).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    await expect
      .poll(async () =>
        inner.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .not.toEqual(before);
  });
});
