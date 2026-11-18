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

describe("TC-REP-03-3: show inline validation errors when required fields are empty", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRoomRepairRequests.mockResolvedValue([]);
  });

  it("blocks API call and displays error messages below missing fields", async () => {
    render(
      <MemoryRouter initialEntries={["/repairs/new"]}>
        <ReportRepairPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "ยืนยันการแจ้งซ่อม" }));

    expect(await screen.findByText("กรุณาเลือกประเภทปัญหา")).toBeTruthy();
    expect(screen.getByText("กรุณากรอกรายละเอียดปัญหา")).toBeTruthy();
    expect(createRepairRequest).not.toHaveBeenCalled();
  });
});