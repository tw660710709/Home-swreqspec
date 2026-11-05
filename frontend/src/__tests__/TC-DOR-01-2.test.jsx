import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getRecommendedDormitories, searchDormitories } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("TC-DOR-01-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_01_2_female_availability_statuses", async () => {
    const dormitories = [
      {
        id: "female-available",
        name: "หอพักหญิงห้องว่าง",
        location: "ทำเลตัวอย่าง",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "5000",
        availability_status: "ห้องว่าง",
      },
      {
        id: "female-full",
        name: "หอพักหญิงห้องเต็ม",
        location: "ทำเลตัวอย่าง",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "5000",
        availability_status: "ห้องเต็ม",
      },
    ];
    searchDormitories.mockResolvedValue(dormitories);

    // Given มีหอพักหญิงที่มีทั้งสถานะห้องว่างและห้องเต็มในระบบ
    // When ผู้ใช้เลือกกรองเฉพาะหอพักหญิงและค้นหา
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("หอพักหญิงห้องว่าง");
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักหญิง" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    // Then แสดงเฉพาะหอพักหญิงและสถานะของแต่ละรายการตามข้อมูล
    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "",
        dormitoryType: "หอพักหญิง",
        minPrice: "",
        maxPrice: "",
      });
    });
    const availableCard = screen.getByText("หอพักหญิงห้องว่าง").closest("li");
    const fullCard = screen.getByText("หอพักหญิงห้องเต็ม").closest("li");
    expect(within(availableCard).getByText(/สถานะห้อง:\s*ห้องว่าง/)).toBeTruthy();
    expect(within(fullCard).getByText(/สถานะห้อง:\s*ห้องเต็ม/)).toBeTruthy();
    expect(screen.getAllByText(/ประเภท:\s*หอพักหญิง/)).toHaveLength(2);
  });
});
