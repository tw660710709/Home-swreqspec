import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { createOwnerDormitory, getOwnerDormitory } from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
  createOwnerDormitory: vi.fn(),
  updateOwnerDormitory: vi.fn(),
}));

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TC-DOR-08-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_08_1_save_and_show_pending_data", async () => {
    const savedDormitory = {
      dormitory_id: "dorm-tc-08-1",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
      type: "หอพักรวม",
      contact_info: "ช่องทางติดต่อทดสอบ",
      amenities: null,
      rules: null,
      approval_status: "Pending",
    };
    createOwnerDormitory.mockResolvedValue(savedDormitory);
    getOwnerDormitory.mockResolvedValue(savedDormitory);

    // Given เจ้าของอยู่ในฟอร์มและกรอกข้อมูลหอพักใหม่ที่ถูกต้อง
    renderApp("/owner/dormitories/new");
    fireEvent.change(screen.getByLabelText("ชื่อหอพัก"), {
      target: { value: savedDormitory.name },
    });
    fireEvent.change(screen.getByLabelText("ที่อยู่/ทำเล"), {
      target: { value: savedDormitory.location },
    });
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: savedDormitory.type },
    });
    fireEvent.change(screen.getByLabelText("ช่องทางติดต่อ"), {
      target: { value: savedDormitory.contact_info },
    });

    // When เจ้าของยืนยันการบันทึกข้อมูลหอพักใหม่
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then แสดงข้อมูลล่าสุดแก่เจ้าของพร้อมสถานะ “รออนุมัติ”
    await waitFor(() => {
      expect(createOwnerDormitory).toHaveBeenCalledWith({
        name: savedDormitory.name,
        location: savedDormitory.location,
        type: savedDormitory.type,
        contact_info: savedDormitory.contact_info,
        amenities: null,
        rules: null,
      });
      expect(getOwnerDormitory).toHaveBeenCalledWith(
        savedDormitory.dormitory_id,
      );
    });
    expect(await screen.findByText("สถานะ: รออนุมัติ")).toBeTruthy();
    expect(screen.getByDisplayValue(savedDormitory.name)).toBeTruthy();
    expect(screen.getByText(`รหัสหอพัก: ${savedDormitory.dormitory_id}`)).toBeTruthy();
  });
});
