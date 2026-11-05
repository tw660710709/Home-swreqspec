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

describe("TC-DOR-02-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_02_1_approved_verified_detail", async () => {
    getDormitoryDetail.mockResolvedValue({
      id: "dorm-approved-verified",
      name: "หอพักตัวอย่าง A",
      location: "ทำเลตัวอย่าง A",
      type: "หอพักหญิง",
      rooms: [
        {
          id: "room-a-available",
          name: "ห้องตัวอย่าง A1",
          monthly_rent: "5000",
          water_fee: "100",
          electricity_fee: "200",
          deposit: "5000",
        },
      ],
      amenities: ["อินเทอร์เน็ตไร้สาย", "ที่จอดรถ"],
      rules: "กฎระเบียบตัวอย่าง",
      security_info: "ข้อมูลความปลอดภัยตัวอย่าง",
      contact_info: "ช่องทางติดต่อตัวอย่าง",
      images: [
        {
          url: "/fixtures/dormitory-a-room-1.jpg",
          caption: "รูปห้องตัวอย่าง A1",
        },
      ],
      nearby_places: [
        {
          name: "สถานที่ใกล้เคียงตัวอย่าง A",
          distance_text: "ระยะทางตัวอย่าง A",
        },
      ],
      verified_badge: true,
    });

    // Given มีหอพักที่อนุมัติและ Verified พร้อมข้อมูลรายละเอียดครบ
    // When ผู้ใช้เปิดรายละเอียดหอพัก
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified"]}>
        <App />
      </MemoryRouter>,
    );

    // Then หน้าจอแสดงรายละเอียดทุกส่วนและ Verified Badge
    expect(await screen.findByRole("heading", { name: "หอพักตัวอย่าง A" })).toBeTruthy();
    expect(getDormitoryDetail).toHaveBeenCalledWith("dorm-approved-verified");
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("ค่าเช่า: 5,000 บาท")).toBeTruthy();
    expect(screen.getByText("ค่าน้ำ: 100 บาท")).toBeTruthy();
    expect(screen.getByText("ค่าไฟ: 200 บาท")).toBeTruthy();
    expect(screen.getByText("ค่ามัดจำ: 5,000 บาท")).toBeTruthy();
    expect(screen.getByText("- อินเทอร์เน็ตไร้สาย")).toBeTruthy();
    expect(screen.getByText("- ที่จอดรถ")).toBeTruthy();
    expect(screen.getByText("กฎระเบียบตัวอย่าง")).toBeTruthy();
    expect(screen.getByRole("img", { name: "รูปห้องตัวอย่าง A1" })).toBeTruthy();
    expect(
      screen.getByText(/สถานที่ใกล้เคียงตัวอย่าง A — ระยะทางตัวอย่าง A/),
    ).toBeTruthy();
    expect(screen.getByText("ข้อมูลความปลอดภัยตัวอย่าง")).toBeTruthy();
    expect(screen.getByText("ช่องทางติดต่อตัวอย่าง")).toBeTruthy();
  });
});
