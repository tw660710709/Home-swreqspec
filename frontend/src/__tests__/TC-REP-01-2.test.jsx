import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

describe("TC-REP-01-2: submit valid repair request on UI", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRoomRepairRequests.mockResolvedValue([]);
  });

  it("submits form and displays new item with Pending status", async () => {
    createRepairRequest.mockResolvedValue({
      id: "rep-1",
      resident_id: "resident-1",
      room_id: "room-101",
      issue_type: "ไฟฟ้า",
      description: "หลอดไฟเพดานห้องน้ำเสีย",
      status: "Pending",
      created_at: "2026-11-18T10:00:00Z",
      images: [],
    });

    render(
      <MemoryRouter initialEntries={["/repairs/new"]}>
        <ReportRepairPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/ประเภทปัญหา/), {
      target: { value: "ไฟฟ้า" },
    });
    fireEvent.change(screen.getByLabelText(/รายละเอียดปัญหา/), {
      target: { value: "หลอดไฟเพดานห้องน้ำเสีย" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันการแจ้งซ่อม" }));

    expect(await screen.findByText("ส่งข้อมูลแจ้งซ่อมสำเร็จ")).toBeTruthy();
    expect(screen.getByText("หลอดไฟเพดานห้องน้ำเสีย")).toBeTruthy();
    expect(screen.getByText("รอดำเนินการ (Pending)")).toBeTruthy();
  });
});