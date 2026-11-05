import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getDormitoryDetail } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("TC-DOR-02-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_02_2_approved_unverified_detail", async () => {
    getDormitoryDetail.mockResolvedValue({
      id: "dorm-approved-unverified",
      name: "หอพักตัวอย่าง B",
      location: "ทำเลตัวอย่าง B",
      type: "หอพักรวม",
      rooms: [
        {
          id: "room-b-available",
          name: "ห้องตัวอย่าง B1",
          monthly_rent: "6000",
          water_fee: "100",
          electricity_fee: "200",
          deposit: "6000",
        },
      ],
      amenities: ["พื้นที่ส่วนกลาง"],
      rules: "กฎระเบียบตัวอย่าง",
      security_info: "ข้อมูลความปลอดภัยตัวอย่าง",
      contact_info: "ช่องทางติดต่อตัวอย่าง",
      images: [
        {
          url: "/fixtures/dormitory-b-room-1.jpg",
          caption: "รูปห้องตัวอย่าง B1",
        },
      ],
      nearby_places: [
        {
          name: "สถานที่ใกล้เคียงตัวอย่าง B",
          distance_text: "ระยะทางตัวอย่าง B",
        },
      ],
      verified_badge: false,
    });

    // Given มีหอพักที่อนุมัติแต่ไม่มีสถานะ Verified พร้อมข้อมูลรายละเอียด
    // When ผู้ใช้เปิดรายละเอียดหอพัก
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-unverified"]}>
        <App />
      </MemoryRouter>,
    );

    // Then แสดงข้อมูลรายละเอียดและไม่แสดง Verified Badge
    expect(await screen.findByRole("heading", { name: "หอพักตัวอย่าง B" })).toBeTruthy();
    expect(getDormitoryDetail).toHaveBeenCalledWith("dorm-approved-unverified");
    expect(screen.getByText("ค่าเช่า: 6,000 บาท")).toBeTruthy();
    expect(screen.getByText("- พื้นที่ส่วนกลาง")).toBeTruthy();
    expect(screen.getByRole("img", { name: "รูปห้องตัวอย่าง B1" })).toBeTruthy();
    expect(screen.queryByText("Verified")).toBeNull();
  });
});
