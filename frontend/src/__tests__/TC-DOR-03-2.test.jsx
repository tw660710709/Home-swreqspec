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

describe("TC-DOR-03-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    searchDormitories.mockResolvedValue([]);
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_03_2_recommendations_are_limited_to_five", async () => {
    getRecommendedDormitories.mockResolvedValue(
      Array.from({ length: 5 }, (_, index) => ({
        id: `dorm-approved-${index}`,
        name: `หอพักแนะนำ ${index}`,
        location: "ทำเลตัวอย่าง",
        type: "หอพักหญิง",
        min_rent: "6000",
        max_rent: "6000",
        availability_status: "ห้องว่าง",
      })),
    );

    // Given ไม่มีผลค้นหาตรงเงื่อนไขและรายการแนะนำที่เข้าเกณฑ์มากกว่า 5 รายการ
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
      target: { value: "6000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    // Then แสดงข้อความไม่พบข้อมูลและแสดงรายการแนะนำไม่เกิน 5 รายการ
    expect(await screen.findByText("ไม่พบหอพักตามเงื่อนไขที่คุณระบุ")).toBeTruthy();
    const recommendationList = screen.getByRole("list", { name: "หอพักแนะนำ" });
    expect(within(recommendationList).getAllByRole("listitem")).toHaveLength(5);
  });
});
