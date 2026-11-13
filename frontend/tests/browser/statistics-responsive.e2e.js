import { expect, test } from "@playwright/test";

const statisticsResponse = {
  empty_data: false,
  summary: {
    dormitory_id: "dorm-responsive",
    total_rooms: 10,
    vacant_rooms: 4,
    occupied_rooms: 6,
    detail_page_views: 28,
    appointments_count: 11,
  },
  date_range: {
    start_date: "2026-01-01",
    end_date: "2026-01-07",
    detail_page_views: 28,
    appointments_count: 11,
  },
};

const viewports = [
  { name: "phone", width: 375, height: 812, chartColumns: 2, summaryColumns: 1 },
  { name: "tablet", width: 768, height: 1024, chartColumns: 4, summaryColumns: 3 },
  { name: "desktop", width: 1440, height: 900, chartColumns: 4, summaryColumns: 3 },
];

for (const viewport of viewports) {
  test(`test_NFR_USE_01_dashboard_is_readable_at_${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.route("**/dormitories/*/statistics?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(statisticsResponse),
      }),
    );

    await page.goto("/dorms/dorm-responsive/statistics");

    await expect(page.getByRole("heading", { name: "สถิติหอพัก" })).toBeVisible();
    await expect(page.getByLabel("วันที่เริ่มต้น")).toBeVisible();
    await expect(page.getByLabel("วันที่สิ้นสุด")).toBeVisible();
    await expect(page.getByRole("button", { name: "ยืนยันช่วงเวลา" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ดาวน์โหลดรายงาน CSV" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "กราฟสรุป" })).toBeVisible();

    for (const label of ["จำนวนห้องทั้งหมด", "ห้องว่าง", "ห้องเต็ม", "ผู้เข้าชม", "การนัดหมาย"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }

    const controls = [
      page.getByLabel("วันที่เริ่มต้น"),
      page.getByLabel("วันที่สิ้นสุด"),
      page.getByRole("button", { name: "ยืนยันช่วงเวลา" }),
      page.getByRole("button", { name: "ดาวน์โหลดรายงาน CSV" }),
    ];
    for (const control of controls) {
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    }

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      headerDirection: getComputedStyle(
        document.querySelector("h1").parentElement.parentElement,
      ).flexDirection,
      chartColumns: getComputedStyle(
        document.querySelector("h2 + div.grid"),
      ).gridTemplateColumns.split(/\s+/).length,
      chartLabelFontSize: Number.parseFloat(
        getComputedStyle(document.querySelector("h2 + div.grid span")).fontSize,
      ),
      summaryColumns: getComputedStyle(
        [...document.querySelectorAll("div.mb-4.grid")].find((element) =>
          element.textContent.includes("จำนวนห้องทั้งหมด"),
        ),
      ).gridTemplateColumns.split(/\s+/).length,
    }));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.headerDirection).toBe(viewport.width < 640 ? "column" : "row");
    expect(layout.chartColumns).toBe(viewport.chartColumns);
    expect(layout.chartLabelFontSize).toBeGreaterThanOrEqual(12);
    expect(layout.summaryColumns).toBe(viewport.summaryColumns);
  });
}
