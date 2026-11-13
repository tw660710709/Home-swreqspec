import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TC-DOR-12-1", () => {
  it(
    "test_TC_DOR_12_1_public_view_shows_latest_approved_data_and_images",
    async () => {
      const approvedDetail = {
        id: "dorm-approved",
        name: "หอพักที่อนุมัติแล้ว",
        location: "ทำเลที่อนุมัติแล้ว",
        type: "หอพักรวม",
        rooms: [],
        amenities: ["อินเทอร์เน็ตที่อนุมัติแล้ว"],
        rules: "กฎที่อนุมัติแล้ว",
        security_info: "ข้อมูลความปลอดภัยที่อนุมัติแล้ว",
        contact_info: "ช่องทางติดต่อที่อนุมัติแล้ว",
        images: [
          {
            url: "/approved.jpg",
            caption: "รูปที่อนุมัติแล้ว",
          },
        ],
        nearby_places: [],
        verified_badge: false,
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(approvedDetail),
      });
      vi.stubGlobal("fetch", fetchMock);

      // Given มีข้อมูลหอพักและรูปภาพที่ได้รับอนุมัติแล้ว
      // When ผู้ใช้งานทั่วไปเปิดดูข้อมูลหอพัก
      render(
        <MemoryRouter initialEntries={["/dorms/dorm-approved"]}>
          <App />
        </MemoryRouter>,
      );

      // Then แสดงข้อมูลหอพักและรูปภาพล่าสุดที่ได้รับอนุมัติแล้ว
      expect(
        await screen.findByRole("heading", {
          name: approvedDetail.name,
        }),
      ).toBeTruthy();
      expect(screen.getByText(approvedDetail.location)).toBeTruthy();
      expect(
        screen.getByRole("img", { name: "รูปที่อนุมัติแล้ว" }).getAttribute("src"),
      ).toBe("/approved.jpg");
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith(
        "/dormitories/dorm-approved",
      );
    },
  );
});
