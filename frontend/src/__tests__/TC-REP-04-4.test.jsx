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

describe("TC-REP-04-4: reject unsupported or too many image files on UI", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRoomRepairRequests.mockResolvedValue([]);
  });

  it("displays error when selecting .pdf or more than 3 files", async () => {
    render(
      <MemoryRouter initialEntries={["/repairs/new"]}>
        <ReportRepairPage />
      </MemoryRouter>,
    );

    const pdfFile = new File(["%PDF"], "document.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/รูปภาพประกอบ/), {
      target: { files: [pdfFile] },
    });

    expect(
      await screen.findByText("รองรับเฉพาะไฟล์รูปภาพนามสกุล .jpg, .jpeg หรือ .png เท่านั้น"),
    ).toBeTruthy();

    const fourImages = [1, 2, 3, 4].map(
      (i) => new File(["img"], `photo_${i}.jpg`, { type: "image/jpeg" }),
    );
    fireEvent.change(screen.getByLabelText(/รูปภาพประกอบ/), {
      target: { files: fourImages },
    });

    expect(
      await screen.findByText("แนบรูปภาพได้สูงสุดไม่เกิน 3 รูปต่อรายการ"),
    ).toBeTruthy();
    expect(createRepairRequest).not.toHaveBeenCalled();
  });
});