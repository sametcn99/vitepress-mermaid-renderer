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
    .locator('.desktop-controls [data-mermaid-control="toggleFullscreen"]')
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

/**
 * When the document is already in fullscreen, clicking the toggle button must
 * call the Fullscreen API exit path. Both `requestFullscreen` and
 * `exitFullscreen` are stubbed and we simulate the fullscreen state by
 * overriding `document.fullscreenElement`.
 */
test("fullscreen toggle calls exitFullscreen when already fullscreen", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __fsCalls: number }).__fsCalls = 0;
    (window as unknown as { __fsExits: number }).__fsExits = 0;
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      writable: true,
      value: function requestFullscreenStub() {
        (window as unknown as { __fsCalls: number }).__fsCalls += 1;
        Object.defineProperty(document, "fullscreenElement", {
          configurable: true,
          get: () => this,
        });
        return Promise.resolve();
      },
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      writable: true,
      value: function exitFullscreenStub() {
        (window as unknown as { __fsExits: number }).__fsExits += 1;
        Object.defineProperty(document, "fullscreenElement", {
          configurable: true,
          get: () => null,
        });
        return Promise.resolve();
      },
    });
  });

  await page.goto("/examples/basic");

  const diagram = page.locator(".mermaid-container").first();
  await expect(diagram).toBeVisible();
  await expect(diagram.locator(".mermaid > svg")).toBeVisible();

  const toggle = diagram.locator(
    '.desktop-controls [data-mermaid-control="toggleFullscreen"]',
  );
  await toggle.click();
  await toggle.click();

  await expect
    .poll(
      async () =>
        page.evaluate(
          () => (window as unknown as { __fsExits: number }).__fsExits,
        ),
      { timeout: 5_000 },
    )
    .toBeGreaterThanOrEqual(1);
});
