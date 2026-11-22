import { expect, test } from "@playwright/test";

const viewports = [
  { name: "phone", width: 375, height: 812, columns: 1 },
  { name: "tablet", width: 768, height: 1024, columns: 1 },
  { name: "desktop", width: 1440, height: 900, columns: 2 },
];

for (const viewport of viewports) {
  test(`test_CON_UI_01_manage_account_fits_${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/account");

    await expect(
      page.getByRole("heading", { name: "จัดการบัญชี" }),
    ).toBeVisible();
    await expect(page.getByLabel("ชื่อ")).toBeVisible();
    await expect(page.getByLabel("รหัสผ่านเดิม")).toBeVisible();

    const layout = await page.evaluate(() => {
      const cardGrid = document.querySelector(
        'section[aria-labelledby="account-profile-heading"]',
      ).parentElement;
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        columns: getComputedStyle(cardGrid).gridTemplateColumns.split(/\s+/).length,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.columns).toBe(viewport.columns);

    for (const label of ["ชื่อ", "เบอร์โทรศัพท์", "อีเมล", "รหัสผ่านเดิม"]) {
      const bounds = await page.getByLabel(label).boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    }
  });
}
