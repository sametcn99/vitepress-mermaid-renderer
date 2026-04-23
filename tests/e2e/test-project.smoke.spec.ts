import { expect, test } from "@playwright/test";

test("renders Mermaid diagrams and toolbar controls in the VitePress smoke site", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "VitePress Mermaid Renderer" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "View Examples" }).click();
  await expect(page).toHaveURL(/\/examples\/basic$/);
  await expect(
    page.getByRole("heading", { name: "Basic Examples" }),
  ).toBeVisible();

  const diagrams = page.locator(".mermaid-container");
  await expect(diagrams.first()).toBeVisible();
  await expect(diagrams.first().locator(".mermaid > svg")).toBeVisible();
  await expect(diagrams.first().locator('[title="Zoom In"]')).toBeVisible();

  await expect
    .poll(async () => diagrams.count(), { timeout: 15000 })
    .toBeGreaterThanOrEqual(2);
});
