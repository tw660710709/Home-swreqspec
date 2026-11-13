import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDormitoryReviewPage from "../pages/AdminDormitoryReviewPage.jsx";
import {
  approveDormitory,
  getDormitoryApprovalHistory,
  getDormitoryForReview,
  getPendingDormitories,
  rejectDormitory,
  requestDormitoryRevision,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  approveDormitory: vi.fn(),
  getDormitoryApprovalHistory: vi.fn(),
  getDormitoryForReview: vi.fn(),
  getPendingDormitories: vi.fn(),
  rejectDormitory: vi.fn(),
  requestDormitoryRevision: vi.fn(),
}));

describe("UC-13 Admin review page", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getPendingDormitories.mockResolvedValue([
      {
        dormitory_id: "dorm-1",
        name: "หอพักทดสอบ",
        status: "Pending Review",
      },
    ]);
    getDormitoryForReview.mockResolvedValue({
      dormitory_id: "dorm-1",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
      type: "หอพักรวม",
      contact_info: "ติดต่อ",
      amenities: [],
      rules: "",
      status: "Pending Review",
      required_fields: ["name", "location", "type", "contact_info"],
      missing_required_fields: [],
      required_fields_complete: true,
      documents: [],
    });
    getDormitoryApprovalHistory.mockResolvedValue([]);
    approveDormitory.mockResolvedValue({});
    requestDormitoryRevision.mockResolvedValue({});
    rejectDormitory.mockResolvedValue({});
  });

  it("test_AC_ADM_01_admin_reviews_dormitory_details", async () => {
    render(
      <MemoryRouter>
        <AdminDormitoryReviewPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /หอพักทดสอบ/ }));
    expect(await screen.findByText("ทำเลทดสอบ")).toBeTruthy();
    expect(screen.getByText("ข้อมูลที่กำหนดเป็น Required ครบถ้วน")).toBeTruthy();
    expect(getDormitoryForReview).toHaveBeenCalledWith("dorm-1");
    expect(getDormitoryApprovalHistory).toHaveBeenCalledWith("dorm-1");
  });

  it("test_AC_ADM_03_requires_a_reason_before_requesting_revision", async () => {
    render(
      <MemoryRouter>
        <AdminDormitoryReviewPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /หอพักทดสอบ/ }));
    fireEvent.click(await screen.findByRole("button", { name: "ขอให้แก้ไข" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "เหตุผลต้องมีความยาว 1–500 ตัวอักษร",
    );
    expect(requestDormitoryRevision).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/เหตุผลสำหรับขอแก้ไข/), {
      target: { value: "กรุณาแก้ไขข้อมูล" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ขอให้แก้ไข" }));
    expect(requestDormitoryRevision).toHaveBeenCalledWith(
      "dorm-1",
      "กรุณาแก้ไขข้อมูล",
    );
  });
});
