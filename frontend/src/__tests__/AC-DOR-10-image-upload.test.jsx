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
  getOwnerDormitory,
  getOwnerDormitoryRooms,
  updateOwnerDormitory,
  uploadOwnerDormitoryImages,
  uploadOwnerRoomImages,
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

describe("AC-DOR-10", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_AC_DOR_10_rejected_files_keep_valid_files", async () => {
    const dormitory = {
      dormitory_id: "dorm-001",
      name: "หอพักของ owner-1",
      location: "ทำเล owner-1",
      type: "หอพักรวม",
      contact_info: "ติดต่อ owner-1",
      amenities: [],
      rules: null,
      approval_status: "Pending",
    };
    const validImage = new File(["valid"], "valid.jpg", {
      type: "image/jpeg",
    });
    const rejectedImage = new File(["invalid"], "rejected.gif", {
      type: "image/gif",
    });
    const replacementImage = new File(["replacement"], "replacement.png", {
      type: "image/png",
    });
    getOwnerDormitory.mockResolvedValue(dormitory);
    updateOwnerDormitory.mockResolvedValue(dormitory);
    uploadOwnerDormitoryImages
      .mockResolvedValueOnce({
        accepted: [
          {
            image_id: "image-valid",
            filename: "valid.jpg",
            file_type: "JPG",
            file_size_bytes: 5,
          },
        ],
        rejected: [
          {
            filename: "rejected.gif",
            reason: "ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
          },
        ],
      })
      .mockResolvedValueOnce({
        accepted: [
          {
            image_id: "image-replacement",
            filename: "replacement.png",
            file_type: "PNG",
            file_size_bytes: 11,
          },
        ],
        rejected: [],
      });

    // Given เจ้าของเปิดฟอร์มแก้ไขและเลือกไฟล์ที่ถูกต้องปนไฟล์ที่ถูกปฏิเสธ
    renderApp("/owner/dormitories/dorm-001/edit");
    const imageInput = await screen.findByLabelText("รูปภาพหอพัก");
    fireEvent.change(imageInput, {
      target: { files: [validImage, rejectedImage] },
    });

    // When บันทึกข้อมูลหอพักพร้อมอัปโหลดไฟล์ที่เลือก
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then แสดงไฟล์ที่รับไว้และสาเหตุของไฟล์ที่ถูกปฏิเสธ
    await waitFor(() => {
      expect(uploadOwnerDormitoryImages).toHaveBeenCalledWith("dorm-001", [
        validImage,
        rejectedImage,
      ]);
    });
    expect(await screen.findByText("valid.jpg")).toBeTruthy();
    expect(
      screen.getByText(
        "rejected.gif: ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
      ),
    ).toBeTruthy();

    // When เจ้าของเลือกไฟล์ใหม่แทนไฟล์ที่ถูกปฏิเสธและบันทึกอีกครั้ง
    fireEvent.change(imageInput, {
      target: { files: [replacementImage] },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then รับไฟล์ใหม่โดยคงไฟล์ที่เคยรับไว้และล้างผลปฏิเสธเดิม
    await waitFor(() => {
      expect(uploadOwnerDormitoryImages).toHaveBeenLastCalledWith("dorm-001", [
        replacementImage,
      ]);
    });
    expect(await screen.findByText("replacement.png")).toBeTruthy();
    expect(screen.getByText("valid.jpg")).toBeTruthy();
    expect(screen.queryByText(/rejected\.gif:/)).toBeNull();
  });

  it("test_AC_DOR_10_new_dormitory_uploads_images_after_save", async () => {
    const savedDormitory = {
      dormitory_id: "dorm-created",
      name: "หอพักใหม่",
      location: "ทำเลใหม่",
      type: "หอพักรวม",
      contact_info: "ติดต่อใหม่",
      amenities: null,
      rules: null,
      approval_status: "Pending",
    };
    const image = new File(["image"], "new-dormitory.jpg", {
      type: "image/jpeg",
    });
    createOwnerDormitory.mockResolvedValue(savedDormitory);
    getOwnerDormitory.mockResolvedValue(savedDormitory);
    uploadOwnerDormitoryImages.mockResolvedValue({
      accepted: [
        {
          image_id: "image-created",
          filename: "new-dormitory.jpg",
          file_type: "JPG",
          file_size_bytes: 5,
        },
      ],
      rejected: [],
    });

    // Given เจ้าของเลือกไฟล์ในฟอร์มสร้างหอพักที่ยังไม่มี ID
    renderApp("/owner/dormitories/new");
    fireEvent.change(screen.getByLabelText("รูปภาพหอพัก"), {
      target: { files: [image] },
    });

    // When บันทึกข้อมูลหอพักใหม่
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then สร้างหอพักก่อน แล้วอัปโหลดรูปด้วย ID ที่ได้
    await waitFor(() => {
      expect(uploadOwnerDormitoryImages).toHaveBeenCalledWith("dorm-created", [
        image,
      ]);
    });
    expect(createOwnerDormitory.mock.invocationCallOrder[0]).toBeLessThan(
      uploadOwnerDormitoryImages.mock.invocationCallOrder[0],
    );
    expect(await screen.findByText("new-dormitory.jpg")).toBeTruthy();
  });

  it("test_AC_DOR_10_room_upload_shows_per_file_results", async () => {
    const dormitory = {
      dormitory_id: "dorm-001",
      name: "หอพักของ owner-1",
      location: "ทำเล owner-1",
    };
    const room = {
      room_id: "room-001",
      dormitory_id: "dorm-001",
      monthly_rent: "5000",
    };
    const validImage = new File(["valid"], "room.jpg", { type: "image/jpeg" });
    const rejectedImage = new File(["invalid"], "room.gif", { type: "image/gif" });
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryRooms.mockResolvedValue([room]);
    uploadOwnerRoomImages.mockResolvedValue({
      accepted: [
        {
          image_id: "room-image",
          filename: "room.jpg",
          file_type: "JPG",
          file_size_bytes: 5,
        },
      ],
      rejected: [
        {
          filename: "room.gif",
          reason: "ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
        },
      ],
    });

    // Given เจ้าของเปิดหน้าห้องพักและเลือกไฟล์ที่ถูกต้องปนไฟล์ผิดชนิด
    renderApp("/owner/dormitories/dorm-001/rooms");
    const imageInput = await screen.findByLabelText("รูปภาพห้องพัก room-001");
    fireEvent.change(imageInput, {
      target: { files: [validImage, rejectedImage] },
    });

    // When อัปโหลดรูปห้องพัก
    fireEvent.click(
      screen.getByRole("button", {
        name: "อัปโหลดรูปภาพห้องพัก",
      }),
    );

    // Then ส่งทั้งไฟล์ของห้องที่เลือกและแสดงผลรายไฟล์
    await waitFor(() => {
      expect(uploadOwnerRoomImages).toHaveBeenCalledWith(
        "dorm-001",
        "room-001",
        [validImage, rejectedImage],
      );
    });
    expect(await screen.findByText("room.jpg")).toBeTruthy();
    expect(
      screen.getByText(
        "room.gif: ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
      ),
    ).toBeTruthy();
  });

  it("test_AC_DOR_10_upload_client_sends_multipart_files_with_owner_identity", async () => {
    const image = new File(["image"], "image.jpg", { type: "image/jpeg" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accepted: [], rejected: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const {
        uploadOwnerDormitoryImages: uploadDormitoryImages,
        uploadOwnerRoomImages: uploadRoomImages,
      } = await vi.importActual("../api/client.js");

      // When ส่งรูปผ่าน client ไปยังหอพักและห้องพัก
      await uploadDormitoryImages("dorm-001", [image]);
      await uploadRoomImages("dorm-001", "room-001", [image]);

      // Then ใช้ multipart, ตัวตนเจ้าของ และ endpoint ของ target ที่เลือก
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "/owners/dormitories/dorm-001/images",
        expect.objectContaining({
          method: "POST",
          headers: { "X-Owner-Id": "owner-1" },
        }),
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/owners/dormitories/dorm-001/rooms/room-001/images",
        expect.objectContaining({
          method: "POST",
          headers: { "X-Owner-Id": "owner-1" },
        }),
      );
      const dormitoryForm = fetchMock.mock.calls[0][1].body;
      const roomForm = fetchMock.mock.calls[1][1].body;
      expect(dormitoryForm).toBeInstanceOf(FormData);
      expect(roomForm).toBeInstanceOf(FormData);
      expect(dormitoryForm.getAll("files")).toEqual([image]);
      expect(roomForm.getAll("files")).toEqual([image]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
