import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getRecommendedDormitories, searchDormitories } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("TC-DOR-04-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_04_1_clear_filters_loads_all_approved", async () => {
    const allApproved = [
      {
        id: "approved-female",
        name: "หอพักหญิง Approved",
        location: "ทำเลหญิง",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "5000",
        availability_status: "ห้องว่าง",
      },
      {
        id: "approved-male",
        name: "หอพักชาย Approved",
        location: "ทำเลชาย",
        type: "หอพักชาย",
        min_rent: "6000",
        max_rent: "6000",
        availability_status: "ห้องเต็ม",
      },
    ];
    const filtered = [allApproved[0]];
    searchDormitories
      .mockResolvedValueOnce(allApproved)
      .mockResolvedValueOnce(filtered)
      .mockResolvedValueOnce(allApproved);

    // Given มีการตั้งค่าตัวกรองค้างไว้และมีรายการ Approved ในระบบ
    // When ผู้ใช้กดล้างตัวกรอง
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("หอพักหญิง Approved");
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักหญิง" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));
    await screen.findByText("หอพักหญิง Approved");
    fireEvent.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));

    // Then รีเซ็ตตัวกรองและโหลดรายการ Approved ทั้งหมดกลับมาแสดง
    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "",
        dormitoryType: "",
        minPrice: "",
        maxPrice: "",
      });
    });
    expect(await screen.findByText("หอพักหญิง Approved")).toBeTruthy();
    expect(await screen.findByText("หอพักชาย Approved")).toBeTruthy();
    expect(screen.getByLabelText("ประเภทหอพัก").value).toBe("");
  });
});
