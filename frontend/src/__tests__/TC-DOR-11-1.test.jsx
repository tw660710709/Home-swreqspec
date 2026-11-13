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

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
  createOwnerDormitory: vi.fn(),
  updateOwnerDormitory: vi.fn(),
  getOwnerDormitoryRooms: vi.fn(),
  createOwnerDormitoryRoom: vi.fn(),
  updateOwnerDormitoryRoom: vi.fn(),
  uploadOwnerDormitoryImages: vi.fn(),
  uploadOwnerRoomImages: vi.fn(),
}));

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TC-DOR-11-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it(
    "test_TC_DOR_11_1_cancel_discards_changes_and_returns_to_list",
    async () => {
      const originalDormitory = {
        dormitory_id: "dorm-tc-11-1",
        name: "หอพักเดิม",
        location: "ทำเลเดิม",
        type: "หอพักรวม",
        contact_info: "ช่องทางติดต่อเดิม",
        amenities: ["อินเทอร์เน็ต"],
        rules: "กฎเดิม",
        approval_status: "Approved",
      };
      getOwnerDormitories.mockResolvedValue([originalDormitory]);
      getOwnerDormitory.mockResolvedValue(originalDormitory);

      // Given เจ้าของแก้ไขข้อมูลหอพักและเปลี่ยนค่าในฟอร์มโดยยังไม่บันทึก
      renderApp(
        `/owner/dormitories/${originalDormitory.dormitory_id}/edit`,
      );
      const nameInput = await screen.findByLabelText("ชื่อหอพัก");
      fireEvent.change(nameInput, { target: { value: "ชื่อที่แก้แต่ไม่บันทึก" } });
      fireEvent.change(screen.getByLabelText("ที่อยู่/ทำเล"), {
        target: { value: "ทำเลที่แก้แต่ไม่บันทึก" },
      });

      // When เจ้าของกดปุ่ม “ยกเลิก”
      fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));

      // Then ไม่บันทึกการเปลี่ยนแปลง กลับรายการ และเมื่อเปิดใหม่ใช้ข้อมูลเดิม
      expect(await screen.findByText(originalDormitory.name)).toBeTruthy();
      await waitFor(() => {
        expect(getOwnerDormitories).toHaveBeenCalledOnce();
      });
      expect(createOwnerDormitory).not.toHaveBeenCalled();
      expect(updateOwnerDormitory).not.toHaveBeenCalled();
      expect(uploadOwnerDormitoryImages).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("link", { name: "แก้ไข" }));

      expect(await screen.findByDisplayValue(originalDormitory.name)).toBeTruthy();
      expect(screen.getByDisplayValue(originalDormitory.location)).toBeTruthy();
      expect(getOwnerDormitory).toHaveBeenCalledTimes(2);
    },
  );
});
