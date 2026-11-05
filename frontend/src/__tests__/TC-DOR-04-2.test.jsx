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

describe("TC-DOR-04-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_04_2_clears_all_filter_fields", async () => {
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
    searchDormitories.mockResolvedValue(allApproved);

    // Given มีค่าคำค้นหา ประเภท และช่วงราคาต่ำสุด/สูงสุดค้างอยู่
    // When ผู้ใช้กดล้างตัวกรอง
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("หอพักหญิง Approved");
    fireEvent.change(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล"), {
      target: { value: "ทำเลตัวอย่าง" },
    });
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักหญิง" },
    });
    fireEvent.change(screen.getByLabelText("ราคาต่ำสุด"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByLabelText("ราคาสูงสุด"), {
      target: { value: "7000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));

    // Then ค่าตัวกรองทั้งหมดกลับเป็นค่าเริ่มต้นและโหลดรายการใหม่
    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "",
        dormitoryType: "",
        minPrice: "",
        maxPrice: "",
      });
    });
    expect(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล").value).toBe("");
    expect(screen.getByLabelText("ประเภทหอพัก").value).toBe("");
    expect(screen.getByLabelText("ราคาต่ำสุด").value).toBe("");
    expect(screen.getByLabelText("ราคาสูงสุด").value).toBe("");
    expect(await screen.findByText("หอพักหญิง Approved")).toBeTruthy();
    expect(await screen.findByText("หอพักชาย Approved")).toBeTruthy();
  });
});
