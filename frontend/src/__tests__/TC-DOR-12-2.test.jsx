import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TC-DOR-12-2", () => {
  it("test_TC_DOR_12_2_public_view_hides_pending_image", async () => {
    const approvedDetail = {
      id: "dorm-approved",
      name: "หอพักที่อนุมัติแล้ว",
      location: "ทำเลที่อนุมัติแล้ว",
      type: "หอพักรวม",
      rooms: [],
      amenities: [],
      rules: "",
      security_info: "",
      contact_info: "ช่องทางติดต่อ",
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

    // Given หอพักและรูปหนึ่งได้รับอนุมัติแล้ว แต่อีกรูปยังรออนุมัติ
    // When ผู้ใช้งานทั่วไปเปิดดูข้อมูลหอพัก
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved"]}>
        <App />
      </MemoryRouter>,
    );

    // Then แสดงเฉพาะข้อมูลและรูปที่ได้รับอนุมัติแล้ว
    expect(
      await screen.findByRole("heading", {
        name: approvedDetail.name,
      }),
    ).toBeTruthy();
    expect(screen.getByText(approvedDetail.location)).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "รูปที่อนุมัติแล้ว" }).getAttribute("src"),
    ).toBe("/approved.jpg");
    expect(screen.queryByRole("img", { name: /รออนุมัติ/ })).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/dormitories/dorm-approved",
    );
  });
});
