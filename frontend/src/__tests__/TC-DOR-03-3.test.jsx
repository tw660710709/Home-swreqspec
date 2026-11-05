import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getRecommendedDormitories, searchDormitories } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("TC-DOR-03-3", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_03_3_matching_results_exist", async () => {
    searchDormitories.mockResolvedValue([
      {
        id: "dorm-approved-verified",
        name: "หอพักตัวอย่าง A",
        location: "ทำเลตัวอย่าง A",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "7000",
        availability_status: "ห้องว่าง",
      },
    ]);

    // Given มีหอพัก Approved ที่ตรงกับเงื่อนไขค้นหา
    // When ผู้ใช้ค้นหาด้วยชื่อหอพักที่ตรงกัน
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("หอพักตัวอย่าง A");
    fireEvent.change(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล"), {
      target: { value: "หอพักตัวอย่าง A" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    // Then แสดงรายการที่ตรงกับเงื่อนไขตาม FR-DOR-01
    expect(await screen.findByText("หอพักตัวอย่าง A")).toBeTruthy();
    expect(searchDormitories).toHaveBeenLastCalledWith({
      query: "หอพักตัวอย่าง A",
      dormitoryType: "",
      minPrice: "",
      maxPrice: "",
    });
    // ส่วนที่ spec ไม่ได้บอกเกี่ยวกับ no-results/recommendations ไม่ตรวจ
  });
});
