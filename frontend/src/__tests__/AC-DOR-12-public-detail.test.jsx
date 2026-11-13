import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AC-DOR-12 public detail", () => {
  it("test_AC_DOR_12_public_detail_renders_only_api_approved_data", async () => {
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

    // Given API รายละเอียดสาธารณะมีข้อมูล/รูปที่อนุมัติแล้วเท่านั้น
    // When ผู้ใช้งานทั่วไปเปิดหน้ารายละเอียดหอพัก
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved"]}>
        <App />
      </MemoryRouter>,
    );

    // Then หน้าแสดงข้อมูลจาก API โดยเรียกเฉพาะ endpoint รายละเอียด
    expect(
      await screen.findByRole("heading", { name: "หอพักที่อนุมัติแล้ว" }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/dormitories/dorm-approved");
    expect(screen.getByText("ทำเลที่อนุมัติแล้ว")).toBeTruthy();
    expect(screen.getByText("- อินเทอร์เน็ตที่อนุมัติแล้ว")).toBeTruthy();
    expect(screen.getByText("กฎที่อนุมัติแล้ว")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "รูปที่อนุมัติแล้ว" }).getAttribute("src"),
    ).toBe("/approved.jpg");
    expect(screen.queryByText(/รออนุมัติ/)).toBeNull();
  });
});
