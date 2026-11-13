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
import { createOwnerDormitory, getOwnerDormitory } from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
  createOwnerDormitory: vi.fn(),
  updateOwnerDormitory: vi.fn(),
  getOwnerDormitoryRooms: vi.fn(),
  createOwnerDormitoryRoom: vi.fn(),
  updateOwnerDormitoryRoom: vi.fn(),
}));

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TC-DOR-09-3", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_09_3_valid_data_proceeds_to_save", async () => {
    const savedDormitory = {
      dormitory_id: "dorm-tc-09-3",
      name: "หอพัก TC-DOR-09-3",
      location: "ทำเลทดสอบ",
      type: "หอพักรวม",
      contact_info: "ช่องทางติดต่อทดสอบ",
      amenities: null,
      rules: null,
      approval_status: "Pending",
    };
    createOwnerDormitory.mockResolvedValue(savedDormitory);
    getOwnerDormitory.mockResolvedValue(savedDormitory);

    // Given เจ้าของกรอกข้อมูลครบและผ่านการตรวจสอบที่กำหนด
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

    // When เจ้าของกดยืนยันการบันทึก
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then แสดงข้อมูลล่าสุดแก่เจ้าของและสถานะ “รออนุมัติ”
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
    expect(
      screen.getByDisplayValue(savedDormitory.name),
    ).toBeTruthy();
    expect(
      screen.getByText(`รหัสหอพัก: ${savedDormitory.dormitory_id}`),
    ).toBeTruthy();
  });
});
