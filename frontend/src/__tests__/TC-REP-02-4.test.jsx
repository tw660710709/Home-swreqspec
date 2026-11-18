import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("TC-REP-02-4: attach valid image file and submit", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRoomRepairRequests.mockResolvedValue([]);
  });

  it("sends selected .png file with repair request", async () => {
    const validPng = new File(["png-content"], "leak.png", { type: "image/png" });
    createRepairRequest.mockResolvedValue({
      id: "rep-2",
      issue_type: "ประปา",
      description: "ก๊อกน้ำรั่ว",
      status: "Pending",
      created_at: "2026-11-18T10:05:00Z",
      images: [{ id: "img-1", original_filename: "leak.png" }],
    });

    render(
      <MemoryRouter initialEntries={["/repairs/new"]}>
        <ReportRepairPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/ประเภทปัญหา/), {
      target: { value: "ประปา" },
    });
    fireEvent.change(screen.getByLabelText(/รายละเอียดปัญหา/), {
      target: { value: "ก๊อกน้ำรั่ว" },
    });
    fireEvent.change(screen.getByLabelText(/รูปภาพประกอบ/), {
      target: { files: [validPng] },
    });
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันการแจ้งซ่อม" }));

    await waitFor(() => {
      expect(createRepairRequest).toHaveBeenCalledWith({
        issueType: "ประปา",
        description: "ก๊อกน้ำรั่ว",
        images: [validPng],
      });
    });
    expect(await screen.findByText("ส่งข้อมูลแจ้งซ่อมสำเร็จ")).toBeTruthy();
  });
});