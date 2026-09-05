import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Locks in the design parity between the mobile and desktop toolbars.
 *
 * Both toolbars share every CSS rule in `src/style.css` and differ only in
 * the values of the `--mermaid-control-*` tokens. These tests assert the
 * properties that must stay identical across modes, plus the touch-target
 * size that is deliberately larger on mobile.
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

/** Waits for the first diagram on the page to finish rendering. */
const gotoBasicExample = async (page: Page) => {
  await page.goto('/examples/basic');
  await expect(page.locator('.mermaid-container').first()).toBeVisible();
  await expect(
    page.locator('.mermaid-container').first().locator('.mermaid > svg'),
  ).toBeVisible();
};

/** Reads a single resolved CSS property from the first matching element. */
const computed = (locator: Locator, property: string) =>
  locator.evaluate(
    (el, prop) => window.getComputedStyle(el).getPropertyValue(prop).trim(),
    property,
  );

test.describe('mobile toolbar', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await gotoBasicExample(page);
  });

  test('replaces the desktop toolbar at a mobile viewport', async ({
    page,
  }) => {
    const diagram = page.locator('.mermaid-container').first();

    await expect(diagram.locator('.mobile-controls')).toBeVisible();
    await expect(diagram.locator('.desktop-controls')).toBeHidden();
  });

  test('stacks above the error overlay like the desktop toolbar does', async ({
    page,
  }) => {
    const controls = page
      .locator('.mermaid-container')
      .first()
      .locator('.mobile-controls');

    // `.diagram-error` sits at z-index 10; the toolbar must stay above it.
    expect(Number(await computed(controls, 'z-index'))).toBe(20);
  });

  test('every button meets the 44px touch target', async ({ page }) => {
    const buttons = page
      .locator('.mermaid-container')
      .first()
      .locator('.mobile-controls button');

    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('icons follow currentColor instead of a hard-coded stroke', async ({
    page,
  }) => {
    const button = page
      .locator('.mermaid-container')
      .first()
      .locator('.mobile-controls button')
      .first();

    const [color, stroke] = await Promise.all([
      computed(button, 'color'),
      computed(button.locator('svg'), 'stroke'),
    ]);

    expect(stroke).toBe(color);
  });

  test('keeps the zoom level badge in its authored position', async ({
    page,
  }) => {
    const badge = page
      .locator('.mermaid-container')
      .first()
      .locator('.mobile-controls .zoom-level');

    await expect(badge).toBeVisible();
    expect(await computed(badge, 'order')).toBe('0');
    expect(await computed(badge, 'margin-right')).toBe('0px');
  });

  test('collapses and expands the toolbar', async ({ page }) => {
    const controls = page
      .locator('.mermaid-container')
      .first()
      .locator('.mobile-controls');
    const toggle = controls.locator('[data-mermaid-control="toggleToolbar"]');
    const items = controls.locator('.toolbar-items');

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(items).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(items).toBeHidden();
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(items).toBeVisible();
  });

  test('zoom controls work through the mobile toolbar', async ({ page }) => {
    const diagram = page.locator('.mermaid-container').first();
    const viewport = diagram.locator('.mermaid-viewport').first();
    const initialTransform = await viewport.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );

    await diagram
      .locator('.mobile-controls [data-mermaid-control="zoomIn"]')
      .click();
    await diagram
      .locator('.mobile-controls [data-mermaid-control="zoomIn"]')
      .click();

    await expect
      .poll(async () =>
        viewport.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .not.toEqual(initialTransform);

    await diagram
      .locator('.mobile-controls [data-mermaid-control="resetView"]')
      .click();

    await expect
      .poll(async () =>
        viewport.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .toEqual(initialTransform);
  });
});

test.describe('toolbar cross-mode parity', () => {
  test('mobile and desktop toolbars resolve to the same design tokens', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await gotoBasicExample(page);

    const diagram = page.locator('.mermaid-container').first();
    const desktopButton = diagram.locator('.desktop-controls button').first();
    const desktopControls = diagram.locator('.desktop-controls');

    const desktop = {
      zIndex: await computed(desktopControls, 'z-index'),
      radius: await computed(desktopControls, 'border-radius'),
      background: await computed(desktopControls, 'background-color'),
      buttonRadius: await computed(desktopButton, 'border-radius'),
      buttonBorder: await computed(desktopButton, 'border-top-color'),
      buttonColor: await computed(desktopButton, 'color'),
    };

    await page.setViewportSize(MOBILE_VIEWPORT);
    const mobileButton = diagram.locator('.mobile-controls button').first();
    const mobileControls = diagram.locator('.mobile-controls');
    await expect(mobileControls).toBeVisible();

    const mobile = {
      zIndex: await computed(mobileControls, 'z-index'),
      radius: await computed(mobileControls, 'border-radius'),
      background: await computed(mobileControls, 'background-color'),
      buttonRadius: await computed(mobileButton, 'border-radius'),
      buttonBorder: await computed(mobileButton, 'border-top-color'),
      buttonColor: await computed(mobileButton, 'color'),
    };

    expect(mobile).toEqual(desktop);
  });

  test('mobile scales up only the tokens it deliberately overrides', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await gotoBasicExample(page);

    const diagram = page.locator('.mermaid-container').first();
    const desktopPadding = await computed(
      diagram.locator('.desktop-controls'),
      'padding-top',
    );
    const desktopIcon = await computed(
      diagram.locator('.desktop-controls button svg').first(),
      'width',
    );

    await page.setViewportSize(MOBILE_VIEWPORT);
    const mobileControls = diagram.locator('.mobile-controls');
    await expect(mobileControls).toBeVisible();

    const mobilePadding = await computed(mobileControls, 'padding-top');
    const mobileIcon = await computed(
      diagram.locator('.mobile-controls button svg').first(),
      'width',
    );

    expect(parseFloat(mobilePadding)).toBeGreaterThan(
      parseFloat(desktopPadding),
    );
    expect(parseFloat(mobileIcon)).toBeGreaterThan(parseFloat(desktopIcon));
  });
});
