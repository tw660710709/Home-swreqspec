import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DormDetailPage from "../pages/DormDetailPage.jsx";
import OwnerDormitoryFormPage from "../pages/OwnerDormitoryFormPage.jsx";
import { getOwnerDormitory, updateOwnerDormitory } from "../api/client.js";
import { getDormitoryDetail } from "../api/dormApi.js";

vi.mock("../api/client.js", () => ({
  createOwnerDormitory: vi.fn(),
  getOwnerDormitory: vi.fn(),
  updateOwnerDormitory: vi.fn(),
  uploadOwnerDormitoryImages: vi.fn().mockResolvedValue({
    accepted: [],
    rejected: [],
  }),
  OwnerDormitoryValidationError: class extends Error {
    constructor(fieldErrors) {
      super("กรุณาตรวจสอบข้อมูลที่กรอก");
      this.fieldErrors = fieldErrors;
    }
  },
}));

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
}));

vi.mock("../components/OwnerSavedImages.jsx", () => ({
  default: () => null,
}));

function renderOwnerForm() {
  return render(
    <MemoryRouter initialEntries={["/owner/dormitories/dorm-001/edit"]}>
      <Routes>
        <Route
          path="/owner/dormitories/:dormitoryId/edit"
          element={<OwnerDormitoryFormPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function renderPublicDetail() {
  return render(
    <MemoryRouter initialEntries={["/dorms/dorm-001"]}>
      <Routes>
        <Route path="/dorms/:id" element={<DormDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TC-DOR-08-2: แก้ไขหอพักที่อนุมัติแล้ว", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_08_2_edit_approved_dormitory_pending_q02", async () => {
    getOwnerDormitory.mockResolvedValue({
      dormitory_id: "dorm-001",
      name: "หอพักเดิมที่อนุมัติ",
      location: "ทำเลเดิม",
      type: "หอพักรวม",
      contact_info: "ติดต่อเดิม",
      amenities: [],
      rules: "",
      approval_status: "Approved",
    });
    updateOwnerDormitory.mockResolvedValue({
      dormitory_id: "dorm-001",
      name: "หอพักใหม่ที่รออนุมัติ",
      location: "ทำเลใหม่",
      type: "หอพักหญิง",
      contact_info: "ติดต่อใหม่",
      amenities: [],
      rules: "",
      approval_status: "Pending",
    });
    getDormitoryDetail.mockRejectedValue(
      new Error("ไม่สามารถโหลดข้อมูลหอพักได้ (404)"),
    );

    // Given เจ้าของกำลังแก้ไขหอพักที่อนุมัติแล้ว
    renderOwnerForm();
    fireEvent.change(await screen.findByLabelText("ชื่อหอพัก"), {
      target: { value: "หอพักใหม่ที่รออนุมัติ" },
    });

    // When เจ้าของบันทึกข้อมูลที่แก้ไขแล้วเปิดมุมมองสาธารณะ
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));
    await waitFor(() => {
      expect(updateOwnerDormitory).toHaveBeenCalledWith(
        "dorm-001",
        expect.objectContaining({ name: "หอพักใหม่ที่รออนุมัติ" }),
      );
    });

    // Then เจ้าของเห็นข้อมูลล่าสุดและ Pending
    expect(await screen.findByText("สถานะ: รออนุมัติ")).toBeTruthy();
    expect(screen.getByLabelText("ชื่อหอพัก").value).toBe(
      "หอพักใหม่ที่รออนุมัติ",
    );

    cleanup();
    renderPublicDetail();

    // และผู้ใช้ทั่วไปไม่เห็นข้อมูลเดิมหรือข้อมูลที่กำลังรออนุมัติ
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("หอพักเดิมที่อนุมัติ")).toBeNull();
    expect(screen.queryByText("หอพักใหม่ที่รออนุมัติ")).toBeNull();
    expect(getDormitoryDetail).toHaveBeenCalledWith("dorm-001");
  });
});
