import { expect, test } from '@playwright/test';

/**
 * Verifies the examples pages render multiple Mermaid diagrams with toolbars.
 */
test.describe('examples pages', () => {
  test('basic examples renders multiple diagrams with SVGs', async ({
    page,
  }) => {
    await page.goto('/examples/basic');
    const diagrams = page.locator('.mermaid-container');
    await expect(diagrams.first()).toBeVisible();

    // Scroll the page incrementally to trigger IntersectionObserver for
    // offscreen diagrams. Rendering is lazy — diagrams below the fold are
    // only rendered once they scroll near the viewport.
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const step = 500;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await delay(200);
      }
      window.scrollTo(0, document.body.scrollHeight);
    });

    await expect
      .poll(async () => diagrams.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(5);

    const count = await diagrams.count();
    for (let i = 0; i < count; i += 1) {
      await expect(diagrams.nth(i).locator('.mermaid > svg')).toBeVisible();
    }
  });

  test('advanced examples page renders at least one diagram', async ({
    page,
  }) => {
    await page.goto('/examples/advanced');
    const diagrams = page.locator('.mermaid-container');
    await expect(diagrams.first()).toBeVisible();
    await expect(diagrams.first().locator('.mermaid > svg')).toBeVisible();
  });

  test('zooming one diagram does not affect sibling diagrams', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 2400 });
    await page.goto('/examples/basic');
    const diagrams = page.locator('.mermaid-container');
    await expect(diagrams.first()).toBeVisible();

    await expect
      .poll(async () => diagrams.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2);

    const first = diagrams.nth(0);
    const second = diagrams.nth(1);
    await expect(first.locator('.mermaid > svg')).toBeVisible();
    await expect(second.locator('.mermaid > svg')).toBeVisible();

    const secondInitial = await second
      .locator('.mermaid')
      .first()
      .evaluate((el) => (el as HTMLElement).style.transform);

    await first
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();
    await first
      .locator('.desktop-controls [data-mermaid-control="zoomIn"]')
      .click();

    const firstAfter = await first
      .locator('.mermaid')
      .first()
      .evaluate((el) => (el as HTMLElement).style.transform);
    const secondAfter = await second
      .locator('.mermaid')
      .first()
      .evaluate((el) => (el as HTMLElement).style.transform);

    expect(firstAfter).toMatch(/scale\(/);
    expect(secondAfter).toEqual(secondInitial);
  });
});
