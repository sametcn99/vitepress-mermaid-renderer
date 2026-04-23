import { expect, test } from "@playwright/test";

/**
 * Verifies the fullscreen control invokes the Fullscreen API.
 * Headless Chromium cannot grant real fullscreen without user activation,
 * so we stub `requestFullscreen` and assert the click triggers it.
 */
test("fullscreen toggle invokes the Fullscreen API", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __fsCalls: number }).__fsCalls = 0;
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      writable: true,
      value: function requestFullscreenStub() {
        (window as unknown as { __fsCalls: number }).__fsCalls += 1;
        return Promise.resolve();
      },
    });
  });

  await page.goto("/examples/basic");

  const diagram = page.locator(".mermaid-container").first();
  await expect(diagram).toBeVisible();
  await expect(diagram.locator(".mermaid > svg")).toBeVisible();

  await diagram
    .locator('.desktop-controls [title="Toggle Fullscreen"]')
    .click();

  await expect
    .poll(
      async () =>
        page.evaluate(
          () => (window as unknown as { __fsCalls: number }).__fsCalls,
        ),
      { timeout: 5_000 },
    )
    .toBeGreaterThanOrEqual(1);
});
