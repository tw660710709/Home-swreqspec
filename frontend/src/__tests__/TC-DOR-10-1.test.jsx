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

describe("TC-DOR-10-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it(
    "test_TC_DOR_10_1_reject_only_unsupported_file_and_keep_valid_files",
    async () => {
      const dormitory = {
        dormitory_id: "dorm-tc-10-1",
        name: "หอพักทดสอบ",
        location: "ทำเลทดสอบ",
        type: "หอพักรวม",
        contact_info: "ช่องทางติดต่อทดสอบ",
        amenities: null,
        rules: null,
        approval_status: "Pending",
      };
      const validFiles = [
        new File(["jpg"], "valid.jpg", { type: "image/jpeg" }),
        new File(["jpeg"], "valid.jpeg", { type: "image/jpeg" }),
        new File(["png"], "valid.png", { type: "image/png" }),
      ];
      const unsupportedFile = new File(["gif"], "unsupported.gif", {
        type: "image/gif",
      });
      const replacementFile = new File(["replacement"], "replacement.png", {
        type: "image/png",
      });
      getOwnerDormitory.mockResolvedValue(dormitory);
      updateOwnerDormitory.mockResolvedValue(dormitory);
      uploadOwnerDormitoryImages
        .mockResolvedValueOnce({
          accepted: validFiles.map((file, index) => ({
            image_id: `accepted-${index}`,
            filename: file.name,
            file_type: file.name.split(".").pop().toUpperCase(),
            file_size_bytes: file.size,
          })),
          rejected: [
            {
              filename: unsupportedFile.name,
              reason: "ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
            },
          ],
        })
        .mockResolvedValueOnce({
          accepted: [
            {
              image_id: "replacement-image",
              filename: replacementFile.name,
              file_type: "PNG",
              file_size_bytes: replacementFile.size,
            },
          ],
          rejected: [],
        });

      // Given เจ้าของเลือก JPG, JPEG และ PNG ที่ถูกต้องร่วมกับ GIF
      renderApp("/owner/dormitories/dorm-tc-10-1/edit");
      const imageInput = await screen.findByLabelText("รูปภาพหอพัก");
      fireEvent.change(imageInput, {
        target: { files: [...validFiles, unsupportedFile] },
      });

      // When ระบบตรวจและรับชุดไฟล์ที่เลือก
      fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

      // Then ปฏิเสธเฉพาะ GIF พร้อมสาเหตุและรับไฟล์ที่ถูกต้องทั้งหมด
      await waitFor(() => {
        expect(uploadOwnerDormitoryImages).toHaveBeenCalledWith(
          dormitory.dormitory_id,
          [...validFiles, unsupportedFile],
        );
      });
      for (const file of validFiles) {
        expect(await screen.findByText(file.name)).toBeTruthy();
      }
      expect(
        screen.getByText(
          "unsupported.gif: ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
        ),
      ).toBeTruthy();

      // When เจ้าของเลือกไฟล์ใหม่แทนไฟล์ที่ถูกปฏิเสธ
      fireEvent.change(imageInput, { target: { files: [replacementFile] } });
      fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

      // Then รับไฟล์ใหม่ คงไฟล์ที่รับไว้ และล้างผลปฏิเสธเดิม
      await waitFor(() => {
        expect(uploadOwnerDormitoryImages).toHaveBeenLastCalledWith(
          dormitory.dormitory_id,
          [replacementFile],
        );
      });
      expect(await screen.findByText(replacementFile.name)).toBeTruthy();
      for (const file of validFiles) {
        expect(screen.getByText(file.name)).toBeTruthy();
      }
      expect(screen.queryByText(/unsupported\.gif:/)).toBeNull();
    },
  );
});
