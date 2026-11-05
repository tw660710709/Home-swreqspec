import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getDormitoryDetail } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("TC-DOR-05-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_05_1_detail_load_error_shows_retry", async () => {
    getDormitoryDetail.mockRejectedValue(new Error("Server error"));

    // Given การเชื่อมต่อฐานข้อมูลล้มเหลวระหว่างเปิดดูรายละเอียดหอพัก
    // When ผู้ใช้เข้าหน้ารายละเอียด
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified"]}>
        <App />
      </MemoryRouter>,
    );

    // Then แสดงข้อความแจ้งเตือนความผิดพลาด
    expect(await screen.findByText("ไม่สามารถโหลดข้อมูลได้")).toBeTruthy();

    // Then แสดงปุ่มให้ลองใหม่
    const retryButton = screen.getByRole("button", { name: "ลองใหม่" });
    expect(retryButton).toBeTruthy();

    // Then หน้าจอไม่ค้างและยังตอบสนองต่อผู้ใช้
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(retryButton);
    await waitFor(() => {
      expect(getDormitoryDetail).toHaveBeenCalledTimes(2);
    });
  });
});
