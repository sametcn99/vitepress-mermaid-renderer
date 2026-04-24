import { expect, test } from "@playwright/test";

/**
 * VitePress locale routing edge cases. The /tr/ locale must use the Turkish
 * navigation, sidebar, footer, edit-link and doc-footer strings configured in
 * test-project/.vitepress/config.mts. The English root locale must keep the
 * default English equivalents.
 */
test.describe("locale-aware VitePress chrome", () => {
  test("Turkish locale renders translated nav and sidebar entries", async ({
    page,
  }) => {
    await page.goto("/tr/examples/basic");

    await expect(
      page.locator(".VPNav").getByRole("link", { name: "Ana Sayfa" }),
    ).toBeVisible();
    await expect(
      page.locator(".VPNav").getByRole("link", { name: "Rehber" }),
    ).toBeVisible();
    await expect(
      page.locator(".VPNav").getByRole("link", { name: "Örnekler" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Hızlı Başlangıç" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Gelişmiş Örnekler" }).first(),
    ).toBeVisible();
  });

  test("Turkish locale renders translated footer text", async ({ page }) => {
    await page.goto("/tr/examples/basic");
    await expect(
      page
        .locator("footer")
        .getByText(/GPL-3\.0 lisansı/)
        .first(),
    ).toHaveCount(1);
    await expect(
      page
        .locator("footer")
        .getByText(/Telif Hakkı ©/)
        .first(),
    ).toHaveCount(1);
  });

  test("English root locale keeps default chrome strings", async ({ page }) => {
    await page.goto("/examples/basic");
    await expect(
      page.locator(".VPNav").getByRole("link", { name: "Home" }),
    ).toBeVisible();
    await expect(
      page.locator(".VPNav").getByRole("link", { name: "Guide" }),
    ).toBeVisible();
    await expect(
      page
        .locator("footer")
        .getByText(/Released under the GPL-3\.0 License/)
        .first(),
    ).toHaveCount(1);
  });
});
