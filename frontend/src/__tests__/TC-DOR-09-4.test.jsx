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
  createOwnerDormitoryRoom,
  getOwnerDormitory,
  getOwnerDormitoryRooms,
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
    getOwnerDormitoryRooms: vi.fn(),
    createOwnerDormitory: vi.fn(),
    updateOwnerDormitory: vi.fn(),
    createOwnerDormitoryRoom: vi.fn(),
    updateOwnerDormitoryRoom: vi.fn(),
    uploadOwnerDormitoryImages: vi.fn(),
    uploadOwnerRoomImages: vi.fn(),
    getOwnerDormitoryImages: vi.fn(),
    getOwnerDormitoryImage: vi.fn(),
    getOwnerRoomImages: vi.fn(),
    getOwnerRoomImage: vi.fn(),
    deleteOwnerDormitoryImage: vi.fn(),
    deleteOwnerRoomImage: vi.fn(),
    OwnerDormitoryValidationError,
  };
});

vi.mock("../components/OwnerSavedImages.jsx", () => ({
  default: () => null,
}));

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TC-DOR-09-4: ข้อมูลไม่ถูกต้อง", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_09_4_invalid_value_shows_reason_without_saving", async () => {
    const dormitory = {
      dormitory_id: "dorm-tc-09-4",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
    };
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryRooms.mockResolvedValue([]);
    createOwnerDormitoryRoom.mockRejectedValue(
      new Error("ราคาค่าเช่าต่อห้องต่อเดือนต้องเป็นตัวเลขมากกว่า 0"),
    );

    // Given หอพักมีอยู่และเจ้าของกรอกราคาห้องเป็น 0
    renderApp(`/owner/dormitories/${dormitory.dormitory_id}/rooms`);
    expect(
      await screen.findByRole("heading", { name: "จัดการข้อมูลห้องพัก" }),
    ).toBeTruthy();
    const rentInput = screen.getByLabelText("ราคาต่อห้อง (บาท/เดือน)");
    fireEvent.change(rentInput, { target: { value: "0" } });

    // When เจ้าของยืนยันการบันทึกห้องพัก
    fireEvent.click(screen.getByRole("button", { name: "เพิ่มห้องพัก" }));
    await waitFor(() => {
      expect(createOwnerDormitoryRoom).toHaveBeenCalledWith(
        dormitory.dormitory_id,
        { monthly_rent: "0" },
      );
    });

    // Then แจ้งข้อผิดพลาดที่ช่องราคาและไม่แสดงว่าบันทึกสำเร็จ
    expect(rentInput.getAttribute("aria-invalid")).toBe("true");
    expect(rentInput.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.queryByText("เพิ่มข้อมูลห้องพักแล้ว")).toBeNull();
    expect(screen.queryByText(/^รหัสห้องพัก:/)).toBeNull();
  });
});
