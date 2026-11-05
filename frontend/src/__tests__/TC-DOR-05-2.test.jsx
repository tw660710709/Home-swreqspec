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

describe("TC-DOR-05-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_05_2_retry_after_detail_load_error", async () => {
    getDormitoryDetail
      .mockRejectedValueOnce(new Error("Server error"))
      .mockResolvedValueOnce({
        id: "dorm-approved-verified",
        name: "หอพักตัวอย่าง A",
        location: "ทำเลตัวอย่าง A",
        type: "หอพักหญิง",
        rooms: [],
        amenities: [],
        rules: "กฎระเบียบตัวอย่าง",
        security_info: "ข้อมูลความปลอดภัยตัวอย่าง",
        contact_info: "ช่องทางติดต่อตัวอย่าง",
        images: [],
        nearby_places: [],
        verified_badge: true,
      });

    // Given การเชื่อมต่อฐานข้อมูลล้มเหลวครั้งแรกและกลับมาใช้ได้เมื่อร้องขออีกครั้ง
    // When ผู้ใช้เข้าหน้ารายละเอียด
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified"]}>
        <App />
      </MemoryRouter>,
    );

    // Then หลังเกิดข้อผิดพลาดครั้งแรกแสดงข้อความแจ้งเตือน
    expect(await screen.findByText("ไม่สามารถโหลดข้อมูลได้")).toBeTruthy();

    // Then หลังเกิดข้อผิดพลาดครั้งแรกแสดงปุ่มให้ลองใหม่
    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }));
    await waitFor(() => {
      expect(getDormitoryDetail).toHaveBeenCalledTimes(2);
    });
    // ผลหลังโหลดซ้ำสำเร็จไม่ได้ assert เพราะ spec ไม่ได้บอก
  });
});
