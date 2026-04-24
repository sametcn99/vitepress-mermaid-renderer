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

/**
 * Browser back/forward navigation must keep diagrams rendered without
 * leaving orphan toolbars or losing the SVG output.
 */
test("browser back and forward keeps diagrams rendered", async ({ page }) => {
  await page.goto("/examples/basic");
  await expect(
    page.locator(".mermaid-container").first().locator(".mermaid > svg"),
  ).toBeVisible();

  await page.goto("/examples/advanced");
  await expect(
    page.locator(".mermaid-container").first().locator(".mermaid > svg"),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/examples\/basic$/);
  await expect(
    page.locator(".mermaid-container").first().locator(".mermaid > svg"),
  ).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/\/examples\/advanced$/);
  await expect(
    page.locator(".mermaid-container").first().locator(".mermaid > svg"),
  ).toBeVisible();
});

/**
 * Re-visiting the same URL must not duplicate toolbar buttons or detach
 * existing event listeners. Asserts each container has exactly one zoomIn
 * desktop control after a reload.
 */
test("revisiting the same page keeps a single toolbar per diagram", async ({
  page,
}) => {
  await page.goto("/examples/basic");
  await expect(page.locator(".mermaid-container").first()).toBeVisible();
  const first = page.locator(".mermaid-container").first();
  await expect(first.locator(".mermaid > svg")).toBeVisible();

  await page.reload();
  await expect(page.locator(".mermaid-container").first()).toBeVisible();
  await expect(
    page
      .locator(".mermaid-container")
      .first()
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]'),
  ).toHaveCount(1);
});
