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
  getOwnerDormitory,
  updateOwnerDormitory,
  uploadOwnerDormitoryImages,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
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

describe("TC-DOR-10-3", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_10_3_reject_only_oversized_file", async () => {
    const dormitory = {
      dormitory_id: "dorm-tc-10-3",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
      type: "หอพักรวม",
      contact_info: "ช่องทางติดต่อทดสอบ",
      amenities: null,
      rules: null,
      approval_status: "Pending",
    };
    const validFile = new File(["valid"], "valid.jpg", { type: "image/jpeg" });
    const oversizedFile = new File(
      [new Uint8Array(5_242_881)],
      "oversized.jpg",
      { type: "image/jpeg" },
    );
    getOwnerDormitory.mockResolvedValue(dormitory);
    updateOwnerDormitory.mockResolvedValue(dormitory);
    uploadOwnerDormitoryImages.mockResolvedValue({
      accepted: [
        {
          image_id: "valid-image",
          filename: validFile.name,
          file_type: "JPG",
          file_size_bytes: validFile.size,
        },
      ],
      rejected: [
        {
          filename: oversizedFile.name,
          reason: "ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
        },
      ],
    });

    // Given เจ้าของเลือก JPG เกิน 5 MB ร่วมกับ JPG ที่ถูกต้อง
    renderApp("/owner/dormitories/dorm-tc-10-3/edit");
    const imageInput = await screen.findByLabelText("รูปภาพหอพัก");
    fireEvent.change(imageInput, {
      target: { files: [validFile, oversizedFile] },
    });

    // When ระบบตรวจไฟล์รูปภาพ
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then ปฏิเสธเฉพาะไฟล์เกิน 5 MB พร้อมสาเหตุและรับไฟล์ถูกต้อง
    await waitFor(() => {
      expect(uploadOwnerDormitoryImages).toHaveBeenCalledWith(
        dormitory.dormitory_id,
        [validFile, oversizedFile],
      );
    });
    expect(await screen.findByText(validFile.name)).toBeTruthy();
    expect(
      screen.getByText(
        "oversized.jpg: ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
      ),
    ).toBeTruthy();
  });
});
