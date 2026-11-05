import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getRecommendedDormitories, searchDormitories } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("TC-DOR-03-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    searchDormitories.mockResolvedValue([]);
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_03_1_empty_search_shows_recommendations", async () => {
    getRecommendedDormitories.mockResolvedValue([
      {
        id: "dorm-approved-verified",
        name: "หอพักแนะนำตัวอย่าง",
        location: "ทำเลตัวอย่าง",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "7000",
        availability_status: "ห้องว่าง",
      },
    ]);

    // Given ไม่มีผลค้นหาตรงเงื่อนไขและมีรายการ Approved สำหรับแนะนำ
    // When ผู้ใช้ค้นหา
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("ไม่พบหอพักตามเงื่อนไขที่คุณระบุ");
    fireEvent.change(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล"), {
      target: { value: "ทำเลที่ไม่มี" },
    });
    fireEvent.change(screen.getByLabelText("ราคาต่ำสุด"), {
      target: { value: "6000" },
    });
    fireEvent.change(screen.getByLabelText("ราคาสูงสุด"), {
      target: { value: "7000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    // Then แสดงข้อความไม่พบข้อมูลและรายการแนะนำไม่เกิน 5 รายการ
    expect(await screen.findByText("ไม่พบหอพักตามเงื่อนไขที่คุณระบุ")).toBeTruthy();
    const recommendationList = screen.getByRole("list", { name: "หอพักแนะนำ" });
    expect(within(recommendationList).getByText("หอพักแนะนำตัวอย่าง")).toBeTruthy();
    expect(within(recommendationList).getAllByRole("listitem").length).toBeLessThanOrEqual(5);
  });
});
