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

describe("TC-DOR-04-3", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
    searchDormitories.mockResolvedValue([]);
  });

  it("test_TC_DOR_04_3_clear_filters_when_none_are_set", async () => {
    // Given ไม่มีการตั้งค่าตัวกรองค้างไว้
    // When ผู้ใช้กดล้างตัวกรอง
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText("ไม่พบหอพักตามเงื่อนไขที่คุณระบุ");
    fireEvent.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));

    // Then spec ไม่ได้กำหนดผลลัพธ์ของการล้างตัวกรองเมื่อไม่มีค่าให้ล้าง
  });
});
