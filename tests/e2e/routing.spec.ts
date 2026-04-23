import { expect, test } from "@playwright/test";

/**
 * Verifies diagrams render correctly across client-side route navigations.
 */
test("client navigation re-renders Mermaid diagrams", async ({ page }) => {
  await page.goto("/examples/advanced");
  await expect(page.locator(".mermaid-container").first()).toBeVisible();
  await expect(
    page.locator(".mermaid-container").first().locator(".mermaid > svg"),
  ).toBeVisible();

  await page.goto("/examples/basic");
  await expect(page.locator(".mermaid-container").first()).toBeVisible();
  await expect(
    page.locator(".mermaid-container").first().locator(".mermaid > svg"),
  ).toBeVisible();
});
