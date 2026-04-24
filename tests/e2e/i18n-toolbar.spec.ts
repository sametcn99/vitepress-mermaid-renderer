import { expect, test } from "@playwright/test";

/**
 * Verifies that the toolbar tooltip text reflects the active VitePress locale.
 * The Turkish locale fixture (test-project/tr/**) wires `useData().localeIndex`
 * into `setToolbar({ i18n: ... })`, so visiting a /tr/ page must produce
 * Turkish tooltip strings on the rendered toolbar buttons.
 */
test("toolbar tooltips switch to Turkish under the /tr/ locale", async ({
  page,
}) => {
  await page.goto("/tr/examples/basic");

  const diagram = page.locator(".mermaid-container").first();
  await expect(diagram).toBeVisible();
  await expect(diagram.locator(".mermaid > svg")).toBeVisible();

  const zoomIn = diagram.locator('[data-mermaid-control="zoomIn"]').first();
  await expect(zoomIn).toBeVisible();
  await expect(zoomIn).toHaveAttribute("title", "Yakınlaştır");
  await expect(zoomIn).toHaveAttribute("aria-label", "Yakınlaştır");

  const copyCode = diagram.locator('[data-mermaid-control="copyCode"]').first();
  await expect(copyCode).toHaveAttribute("title", "Kodu kopyala");
});

/**
 * Each tooltip key must use the Turkish translation under /tr/. Guards against
 * regressions where a single key is dropped from the locale map and silently
 * falls back to English.
 */
test("all six toolbar tooltips are translated under /tr/", async ({ page }) => {
  await page.goto("/tr/examples/basic");
  const diagram = page.locator(".mermaid-container").first();
  await expect(diagram.locator(".mermaid > svg")).toBeVisible();

  const expected: Record<string, string> = {
    zoomIn: "Yakınlaştır",
    zoomOut: "Uzaklaştır",
    resetView: "Görünümü sıfırla",
    copyCode: "Kodu kopyala",
    download: "Diyagramı indir",
    toggleFullscreen: "Tam ekranı aç/kapa",
  };

  for (const [key, value] of Object.entries(expected)) {
    const button = diagram
      .locator(`.desktop-controls [data-mermaid-control="${key}"]`)
      .first();
    await expect(button).toHaveAttribute("title", value);
    await expect(button).toHaveAttribute("aria-label", value);
  }
});

/**
 * Navigating from the Turkish locale back to the English root must restore
 * the default English tooltips (round-trip via the live update channel).
 */
test("navigating from /tr/ back to / restores English tooltips", async ({
  page,
}) => {
  await page.goto("/tr/examples/basic");
  const trDiagram = page.locator(".mermaid-container").first();
  await expect(trDiagram.locator(".mermaid > svg")).toBeVisible();
  await expect(
    trDiagram.locator('[data-mermaid-control="zoomIn"]').first(),
  ).toHaveAttribute("title", "Yakınlaştır");

  await page.goto("/examples/basic");
  const enDiagram = page.locator(".mermaid-container").first();
  await expect(enDiagram.locator(".mermaid > svg")).toBeVisible();
  await expect(
    enDiagram.locator('[data-mermaid-control="zoomIn"]').first(),
  ).toHaveAttribute("title", "Zoom In");
  await expect(
    enDiagram.locator('[data-mermaid-control="copyCode"]').first(),
  ).toHaveAttribute("title", "Copy Code");
});
