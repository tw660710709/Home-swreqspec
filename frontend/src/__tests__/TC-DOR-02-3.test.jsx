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

describe("TC-DOR-02-3", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_02_3_unapproved_dormitory_detail", async () => {
    getDormitoryDetail.mockRejectedValue(new Error("Not found"));

    // Given มีหอพักที่ไม่ Approved แม้สถานะ Verified จะถูกระบุเป็นจริง
    // When ผู้ใช้เปิดรายละเอียดหอพัก
    render(
      <MemoryRouter initialEntries={["/dorms/dorm-unapproved"]}>
        <App />
      </MemoryRouter>,
    );

    // Then ไม่มีข้อมูลรายละเอียดของหอพักที่ไม่ Approved
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(getDormitoryDetail).toHaveBeenCalledWith("dorm-unapproved");
    expect(
      screen.queryByRole("heading", { name: "ราคาค่าเช่าและค่าใช้จ่าย" }),
    ).toBeNull();
    expect(screen.queryByText("หอพักตัวอย่าง C")).toBeNull();
  });
});
