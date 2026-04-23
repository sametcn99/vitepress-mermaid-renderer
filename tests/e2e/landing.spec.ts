import { expect, test } from "@playwright/test";

/**
 * Smoke checks for the VitePress landing page rendered by the test project.
 * Validates hero, action buttons, and core navigation links.
 */
test.describe("landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the hero section with primary actions", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "VitePress Mermaid Renderer" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View Examples" }),
    ).toBeVisible();
  });

  test("navigates to the getting-started guide", async ({ page }) => {
    await page.getByRole("link", { name: "Get Started" }).click();
    await expect(page).toHaveURL(/\/guide\/getting-started$/);
    await expect(
      page.getByRole("heading", { name: /getting started/i }).first(),
    ).toBeVisible();
  });
});
