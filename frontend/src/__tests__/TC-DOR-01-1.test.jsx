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

describe("TC-DOR-01-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_01_1_female_available_search", async () => {
    const femaleDormitory = {
      id: "female-available",
      name: "หอพักหญิงตัวอย่าง",
      location: "ทำเลตัวอย่าง",
      type: "หอพักหญิง",
      min_rent: "5000",
      max_rent: "5000",
      availability_status: "ห้องว่าง",
    };
    const maleDormitory = {
      id: "male-available",
      name: "หอพักชายตัวอย่าง",
      location: "ทำเลตัวอย่าง",
      type: "หอพักชาย",
      min_rent: "5000",
      max_rent: "5000",
      availability_status: "ห้องว่าง",
    };
    searchDormitories.mockImplementation(({ dormitoryType }) =>
      Promise.resolve(
        dormitoryType ? [femaleDormitory] : [femaleDormitory, maleDormitory],
      ),
    );

    // Given มีหอพัก Approved ประเภทหญิงที่มีห้องว่างและประเภทอื่นในระบบ
    // When ผู้ใช้เลือกกรองเฉพาะหอพักหญิงและค้นหา
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("หอพักชายตัวอย่าง");
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักหญิง" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    // Then แสดงเฉพาะรายการหอพักหญิงและสถานะห้องว่างตามข้อมูล
    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "",
        dormitoryType: "หอพักหญิง",
        minPrice: "",
        maxPrice: "",
      });
    });
    expect(await screen.findByText("หอพักหญิงตัวอย่าง")).toBeTruthy();
    expect(screen.queryByText("หอพักชายตัวอย่าง")).toBeNull();
    expect(screen.getByText(/สถานะห้อง:\s*ห้องว่าง/)).toBeTruthy();
  });
});
