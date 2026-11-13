import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getOwnerDormitories } from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
}));

describe("TC-DOR-07-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_07_1_owner_list_and_actions", async () => {
    getOwnerDormitories.mockResolvedValue([
      {
        dormitory_id: "dorm-001",
        name: "หอพักของ owner-1",
        location: "ทำเล owner-1",
        type: "หอพักรวม",
      },
      {
        dormitory_id: "dorm-003",
        name: "หอพักอีกแห่งของ owner-1",
        location: "ทำเล owner-1",
        type: "หอพักหญิง",
      },
    ]);

    // Given API คืนรายการของ owner-1 เมื่อมีข้อมูลของ owner-1 และ owner-2 ในระบบ
    // When owner-1 เลือกเมนูจัดการข้อมูลหอพัก
    render(
      <MemoryRouter initialEntries={["/owner/dormitories"]}>
        <App />
      </MemoryRouter>,
    );

    // Then แสดงเฉพาะรายการของ owner-1 พร้อมปุ่มเพิ่มและแก้ไข
    expect(await screen.findByText("หอพักของ owner-1")).toBeTruthy();
    expect(screen.getByText("หอพักอีกแห่งของ owner-1")).toBeTruthy();
    expect(screen.queryByText("หอพักของ owner-2")).toBeNull();
    expect(
      screen.getByRole("link", { name: "เพิ่มหอพักใหม่" }).getAttribute("href"),
    ).toBe("/owner/dormitories/new");
    expect(screen.getAllByRole("link", { name: "แก้ไข" })).toHaveLength(2);
    expect(getOwnerDormitories).toHaveBeenCalledOnce();
  });
});
