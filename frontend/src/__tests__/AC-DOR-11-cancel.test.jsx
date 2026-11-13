import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import {
  createOwnerDormitory,
  getOwnerDormitories,
  getOwnerDormitory,
  updateOwnerDormitory,
  uploadOwnerDormitoryImages,
} from "../api/client.js";

vi.mock("../api/client.js", () => {
  class OwnerDormitoryValidationError extends Error {
    constructor(fieldErrors) {
      super("กรุณาตรวจสอบข้อมูลที่กรอก");
      this.name = "OwnerDormitoryValidationError";
      this.fieldErrors = fieldErrors;
    }
  }

  return {
    getOwnerDormitories: vi.fn(),
    getOwnerDormitory: vi.fn(),
    createOwnerDormitory: vi.fn(),
    updateOwnerDormitory: vi.fn(),
    getOwnerDormitoryRooms: vi.fn(),
    createOwnerDormitoryRoom: vi.fn(),
    updateOwnerDormitoryRoom: vi.fn(),
    uploadOwnerDormitoryImages: vi.fn(),
    uploadOwnerRoomImages: vi.fn(),
    OwnerDormitoryValidationError,
  };
});

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("AC-DOR-11", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_AC_DOR_11_cancel_discards_unsaved_changes", async () => {
    const originalDormitory = {
      dormitory_id: "dorm-001",
      name: "หอพักเดิม",
      location: "ทำเลเดิม",
      type: "หอพักรวม",
      contact_info: "ช่องทางติดต่อเดิม",
      amenities: ["อินเทอร์เน็ต"],
      rules: "กฎเดิม",
      approval_status: "Approved",
    };
    const image = new File(["image"], "unsaved.jpg", {
      type: "image/jpeg",
    });
    getOwnerDormitories.mockResolvedValue([originalDormitory]);
    getOwnerDormitory.mockResolvedValue(originalDormitory);

    // Given เจ้าของเปิดข้อมูลจากฐานข้อมูลและเปลี่ยนค่าโดยยังไม่บันทึก
    renderApp("/owner/dormitories/dorm-001/edit");
    const nameInput = await screen.findByLabelText("ชื่อหอพัก");
    fireEvent.change(nameInput, { target: { value: "ชื่อที่แก้แต่ไม่บันทึก" } });
    fireEvent.change(screen.getByLabelText("รูปภาพหอพัก"), {
      target: { files: [image] },
    });

    // When เจ้าของกดปุ่มยกเลิก
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

    // Then กลับรายการโดยไม่เรียก API บันทึกข้อมูลหรืออัปโหลดรูป
    expect(await screen.findByText("หอพักเดิม")).toBeTruthy();
    await waitFor(() => {
      expect(getOwnerDormitories).toHaveBeenCalledOnce();
    });
    expect(createOwnerDormitory).not.toHaveBeenCalled();
    expect(updateOwnerDormitory).not.toHaveBeenCalled();
    expect(uploadOwnerDormitoryImages).not.toHaveBeenCalled();

    // When เจ้าของเปิดรายการเดิมอีกครั้ง
    fireEvent.click(screen.getByRole("link", { name: "แก้ไข" }));

    // Then โหลดข้อมูลเดิมจาก API แทนค่าที่แก้ไว้ใน state ของฟอร์ม
    expect(await screen.findByDisplayValue("หอพักเดิม")).toBeTruthy();
    expect(screen.getByDisplayValue("ทำเลเดิม")).toBeTruthy();
    expect(getOwnerDormitory).toHaveBeenCalledTimes(2);
  });
});
