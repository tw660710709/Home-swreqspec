import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TC-DOR-12-3", () => {
  it(
    "test_TC_DOR_12_3_public_view_hides_pending_dormitory_data",
    async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ detail: "not found" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      // Given ข้อมูลหอพักมีสถานะรออนุมัติ
      // When ผู้ใช้งานทั่วไปเปิดดูข้อมูลหอพัก
      render(
        <MemoryRouter initialEntries={["/dorms/dorm-pending"]}>
          <App />
        </MemoryRouter>,
      );

      // Then ไม่แสดงข้อมูลหอพักหรือรูปภาพที่รออนุมัติ
      await screen.findByRole("alert");
      expect(
        screen.queryByRole("heading", { name: "หอพักที่รออนุมัติ" }),
      ).toBeNull();
      expect(
        screen.queryByRole("img", { name: "รูปที่รออนุมัติ" }),
      ).toBeNull();
      expect(fetchMock).toHaveBeenCalledWith("/dormitories/dorm-pending");
    },
  );
});
