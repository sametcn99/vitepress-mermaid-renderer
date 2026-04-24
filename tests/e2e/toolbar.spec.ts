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

    await diagram
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();
    await diagram
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();

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

    await diagram
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();
    await diagram
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();
    await diagram
      .locator('.desktop-controls [data-mermaid-control="resetView"]')
      .click();

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
    await diagram
      .locator('.desktop-controls [data-mermaid-control="copyCode"]')
      .click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.length).toBeGreaterThan(0);
    expect(clipboard).toMatch(/flowchart|graph|sequenceDiagram/i);
  });

  test("zoom out reverses prior zoom in changes", async ({ page }) => {
    const diagram = page.locator(".mermaid-container").first();
    const inner = diagram.locator(".mermaid").first();
    const zoomIn = diagram.locator(
      '.desktop-controls [data-mermaid-control="zoomIn"]',
    );
    const zoomOut = diagram.locator(
      '.desktop-controls [data-mermaid-control="zoomOut"]',
    );

    const initialTransform = await inner.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );

    await zoomIn.click();
    await zoomIn.click();
    await zoomIn.click();

    const zoomedTransform = await inner.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );
    expect(zoomedTransform).not.toEqual(initialTransform);

    await zoomOut.click();
    await zoomOut.click();
    await zoomOut.click();

    await expect
      .poll(async () =>
        inner.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .not.toEqual(zoomedTransform);
  });

  test("zoom level indicator updates as the diagram is zoomed", async ({
    page,
  }) => {
    const diagram = page.locator(".mermaid-container").first();
    const indicator = diagram.locator(".zoom-level").first();
    const zoomIn = diagram.locator(
      '.desktop-controls [data-mermaid-control="zoomIn"]',
    );

    await expect(indicator).toBeVisible();
    const initialText = (await indicator.innerText()).trim();
    expect(initialText).toMatch(/^\d+%$/);

    await zoomIn.click();
    await zoomIn.click();

    await expect
      .poll(async () => (await indicator.innerText()).trim())
      .not.toEqual(initialText);

    const updatedText = (await indicator.innerText()).trim();
    expect(parseInt(updatedText, 10)).toBeGreaterThan(
      parseInt(initialText, 10),
    );
  });

  test("copy button can be invoked multiple times and stays consistent", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const diagram = page.locator(".mermaid-container").first();
    const copy = diagram.locator(
      '.desktop-controls [data-mermaid-control="copyCode"]',
    );

    await copy.click();
    const first = await page.evaluate(() => navigator.clipboard.readText());

    await page.evaluate(() => navigator.clipboard.writeText(""));
    await copy.click();
    const second = await page.evaluate(() => navigator.clipboard.readText());

    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  test("reset view restores transform after zoom and drag", async ({
    page,
  }) => {
    const diagram = page.locator(".mermaid-container").first();
    const inner = diagram.locator(".mermaid").first();
    const zoomIn = diagram.locator(
      '.desktop-controls [data-mermaid-control="zoomIn"]',
    );
    const reset = diagram.locator(
      '.desktop-controls [data-mermaid-control="resetView"]',
    );

    await zoomIn.click();
    await zoomIn.click();

    const box = await diagram.boundingBox();
    if (!box) throw new Error("diagram bounding box unavailable");
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY + 60, { steps: 10 });
    await page.mouse.up();

    await reset.click();

    await expect
      .poll(async () =>
        inner.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .toMatch(/scale\(1\)/);

    const finalTransform = await inner.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );
    expect(finalTransform).toMatch(/translate\(0px,\s?0px\)|matrix\(1,/);
  });
});
