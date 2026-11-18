import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ReportRepairPage from "../pages/ReportRepairPage.jsx";
import { createRepairRequest, getRoomRepairRequests } from "../api/client.js";

vi.mock("../api/client.js", async () => {
  const actual = await vi.importActual("../api/client.js");
  return {
    ...actual,
    createRepairRequest: vi.fn(),
    getRoomRepairRequests: vi.fn(),
  };
});

describe("TC-REP-05-1 & TC-REP-05-2: cancel repair form without saving", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRoomRepairRequests.mockResolvedValue([]);
  });

  it("TC-REP-05-1: navigates back to previous page without calling API", async () => {
    render(
      <MemoryRouter initialEntries={["/previous", "/repairs/new"]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<div>หน้าก่อนหน้า</div>} />
          <Route path="/repairs/new" element={<ReportRepairPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/รายละเอียดปัญหา/), {
      target: { value: "ข้อความที่พิมพ์ค้างไว้" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(await screen.findByText("หน้าก่อนหน้า")).toBeTruthy();
    expect(createRepairRequest).not.toHaveBeenCalled();
  });

  it("TC-REP-05-2: navigates to home / when there is no previous history", async () => {
    render(
      <MemoryRouter initialEntries={["/repairs/new"]}>
        <Routes>
          <Route path="/" element={<div>หน้าหลักหอพัก</div>} />
          <Route path="/repairs/new" element={<ReportRepairPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(await screen.findByText("หน้าหลักหอพัก")).toBeTruthy();
    expect(createRepairRequest).not.toHaveBeenCalled();
  });
});