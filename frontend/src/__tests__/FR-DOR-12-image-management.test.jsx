import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  deleteOwnerDormitoryImage,
  deleteOwnerRoomImage,
  getOwnerDormitory,
  getOwnerDormitoryImage,
  getOwnerDormitoryImages,
  getOwnerDormitoryRooms,
  getOwnerRoomImage,
  getOwnerRoomImages,
  updateOwnerDormitory,
  uploadOwnerDormitoryImages,
  uploadOwnerRoomImages,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  createOwnerDormitory: vi.fn(),
  createOwnerDormitoryRoom: vi.fn(),
  deleteOwnerDormitoryImage: vi.fn(),
  deleteOwnerRoomImage: vi.fn(),
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
  getOwnerDormitoryImage: vi.fn(),
  getOwnerDormitoryImages: vi.fn(),
  getOwnerDormitoryRooms: vi.fn(),
  getOwnerRoomImage: vi.fn(),
  getOwnerRoomImages: vi.fn(),
  updateOwnerDormitory: vi.fn(),
  updateOwnerDormitoryRoom: vi.fn(),
  uploadOwnerDormitoryImages: vi.fn(),
  uploadOwnerRoomImages: vi.fn(),
}));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("FR-DOR-12 saved image management", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:owner-image");
    URL.revokeObjectURL = vi.fn();
    getOwnerDormitoryImages.mockResolvedValue([]);
    getOwnerRoomImages.mockResolvedValue([]);
    getOwnerDormitoryImage.mockResolvedValue(
      new Blob(["image"], { type: "image/jpeg" }),
    );
    getOwnerRoomImage.mockResolvedValue(
      new Blob(["image"], { type: "image/jpeg" }),
    );
  });

  afterEach(() => {
    cleanup();
    if (originalCreateObjectURL) {
      URL.createObjectURL = originalCreateObjectURL;
    } else {
      delete URL.createObjectURL;
    }
    if (originalRevokeObjectURL) {
      URL.revokeObjectURL = originalRevokeObjectURL;
    } else {
      delete URL.revokeObjectURL;
    }
  });

  it("test_FR_DOR_12_dormitory_form_displays_deletes_and_replaces_saved_images", async () => {
    const dormitory = {
      dormitory_id: "dorm-001",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
      type: "หอพักรวม",
      contact_info: "ติดต่อทดสอบ",
      amenities: [],
      rules: null,
      approval_status: "Pending",
    };
    const savedImages = [
      {
        image_id: "old-dorm-image",
        file_type: "JPG",
        file_size_bytes: 10,
        approval_status: "Pending",
      },
    ];
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryImages.mockImplementation(async () => [...savedImages]);
    deleteOwnerDormitoryImage.mockImplementation(async (_dormitoryId, imageId) => {
      const index = savedImages.findIndex((image) => image.image_id === imageId);
      if (index >= 0) savedImages.splice(index, 1);
    });
    updateOwnerDormitory.mockResolvedValue(dormitory);
    uploadOwnerDormitoryImages.mockImplementation(async () => {
      const image = {
        image_id: "new-dorm-image",
        filename: "replacement.jpg",
        file_type: "JPG",
        file_size_bytes: 11,
      };
      savedImages.push({ ...image, approval_status: "Pending" });
      return { accepted: [image], rejected: [] };
    });

    renderApp("/owner/dormitories/dorm-001/edit");
    expect(await screen.findByAltText("รูปภาพหอพัก 1")).toBeTruthy();
    expect(screen.getAllByText("สถานะ: รออนุมัติ")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "ลบรูปภาพหอพัก 1" }));
    await waitFor(() => {
      expect(deleteOwnerDormitoryImage).toHaveBeenCalledWith(
        "dorm-001",
        "old-dorm-image",
      );
    });
    await waitFor(() => {
      expect(screen.queryByAltText("รูปภาพหอพัก 1")).toBeNull();
    });

    fireEvent.change(screen.getByLabelText("รูปภาพหอพัก"), {
      target: {
        files: [new File(["replacement"], "replacement.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    expect(await screen.findByAltText("รูปภาพหอพัก 1")).toBeTruthy();
    expect(uploadOwnerDormitoryImages).toHaveBeenCalledWith(
      "dorm-001",
      [expect.objectContaining({ name: "replacement.jpg" })],
    );
  });

  it("test_FR_DOR_12_room_page_displays_deletes_and_replaces_saved_images", async () => {
    const dormitory = {
      dormitory_id: "dorm-001",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
    };
    const room = {
      room_id: "room-001",
      dormitory_id: "dorm-001",
      monthly_rent: "5000",
    };
    const savedImages = [
      {
        image_id: "old-room-image",
        file_type: "PNG",
        file_size_bytes: 10,
        approval_status: "Approved",
      },
    ];
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryRooms.mockResolvedValue([room]);
    getOwnerRoomImages.mockImplementation(async () => [...savedImages]);
    deleteOwnerRoomImage.mockImplementation(async (_dormitoryId, _roomId, imageId) => {
      const index = savedImages.findIndex((image) => image.image_id === imageId);
      if (index >= 0) savedImages.splice(index, 1);
    });
    uploadOwnerRoomImages.mockImplementation(async () => {
      const image = {
        image_id: "new-room-image",
        filename: "replacement.png",
        file_type: "PNG",
        file_size_bytes: 11,
      };
      savedImages.push({ ...image, approval_status: "Pending" });
      return { accepted: [image], rejected: [] };
    });

    renderApp("/owner/dormitories/dorm-001/rooms");
    expect(await screen.findByAltText("รูปภาพห้องพัก room-001 1")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "ลบรูปภาพห้องพัก room-001 1",
      }),
    );
    await waitFor(() => {
      expect(deleteOwnerRoomImage).toHaveBeenCalledWith(
        "dorm-001",
        "room-001",
        "old-room-image",
      );
    });
    await waitFor(() => {
      expect(screen.queryByAltText("รูปภาพห้องพัก room-001 1")).toBeNull();
    });

    fireEvent.change(screen.getByLabelText("รูปภาพห้องพัก room-001"), {
      target: {
        files: [new File(["replacement"], "replacement.png", { type: "image/png" })],
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "อัปโหลดรูปภาพห้องพัก" }),
    );

    expect(await screen.findByAltText("รูปภาพห้องพัก room-001 1")).toBeTruthy();
    expect(uploadOwnerRoomImages).toHaveBeenCalledWith(
      "dorm-001",
      "room-001",
      [expect.objectContaining({ name: "replacement.png" })],
    );
  });

  it("test_FR_DOR_12_image_api_sends_owner_identity_for_read_and_delete", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["image"]),
      })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const client = await vi.importActual("../api/client.js");
      await client.getOwnerRoomImages("dorm-001", "room-001");
      await client.getOwnerRoomImage("dorm-001", "room-001", "image-001");
      await client.deleteOwnerRoomImage("dorm-001", "room-001", "image-001");

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "/owners/dormitories/dorm-001/rooms/room-001/images",
        { headers: { "X-Owner-Id": "owner-1" } },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/owners/dormitories/dorm-001/rooms/room-001/images/image-001",
        { headers: { "X-Owner-Id": "owner-1" } },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "/owners/dormitories/dorm-001/rooms/room-001/images/image-001",
        {
          method: "DELETE",
          headers: { "X-Owner-Id": "owner-1" },
        },
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
