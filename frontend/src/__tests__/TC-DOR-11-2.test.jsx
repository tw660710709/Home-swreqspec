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

describe("TC-DOR-11-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_11_2_cancel_without_form_changes", async () => {
    const originalDormitory = {
      dormitory_id: "dorm-tc-11-2",
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

    // Given เจ้าของกำลังแก้ไขข้อมูลหอพักโดยยังไม่ได้เปลี่ยนค่าในฟอร์ม
    renderApp(
      `/owner/dormitories/${originalDormitory.dormitory_id}/edit`,
    );
    expect(await screen.findByDisplayValue(originalDormitory.name)).toBeTruthy();
    expect(screen.getByDisplayValue(originalDormitory.location)).toBeTruthy();

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
  });
});
