import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import {
  getOwnerDormitory,
  getOwnerDormitoryRooms,
  updateOwnerDormitory,
  uploadOwnerDormitoryImages,
  uploadOwnerRoomImages,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
  getOwnerDormitoryRooms: vi.fn(),
  createOwnerDormitory: vi.fn(),
  updateOwnerDormitory: vi.fn(),
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

function acceptedImages(prefix) {
  return Array.from({ length: 10 }, (_, index) => ({
    image_id: `${prefix}-${index}`,
    filename: `${prefix}-${index}.jpg`,
    file_type: "JPG",
    file_size_bytes: 10,
  }));
}

function imageFiles(prefix) {
  return Array.from(
    { length: 10 },
    (_, index) =>
      new File(["image"], `${prefix}-${index}.jpg`, { type: "image/jpeg" }),
  );
}

describe("TC-DOR-10-5", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_10_5_reject_only_image_over_limit", async () => {
    const dormitory = {
      dormitory_id: "dorm-tc-10-5",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
      type: "หอพักรวม",
      contact_info: "ช่องทางติดต่อทดสอบ",
      amenities: null,
      rules: null,
      approval_status: "Pending",
    };
    const room = {
      room_id: "room-tc-10-5",
      dormitory_id: dormitory.dormitory_id,
      monthly_rent: "5000",
    };
    const dormitoryFiles = imageFiles("dormitory");
    const roomFiles = imageFiles("room");
    const extraDormitoryFile = new File(["extra"], "dormitory-extra.jpg", {
      type: "image/jpeg",
    });
    const extraRoomFile = new File(["extra"], "room-extra.jpg", {
      type: "image/jpeg",
    });
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryRooms.mockResolvedValue([room]);
    updateOwnerDormitory.mockResolvedValue(dormitory);
    uploadOwnerDormitoryImages
      .mockResolvedValueOnce({
        accepted: acceptedImages("dormitory"),
        rejected: [],
      })
      .mockResolvedValueOnce({
        accepted: [],
        rejected: [
          {
            filename: extraDormitoryFile.name,
            reason: "อัปโหลดได้ไม่เกิน 10 รูป",
          },
        ],
      });
    uploadOwnerRoomImages
      .mockResolvedValueOnce({
        accepted: acceptedImages("room"),
        rejected: [],
      })
      .mockResolvedValueOnce({
        accepted: [],
        rejected: [
          {
            filename: extraRoomFile.name,
            reason: "อัปโหลดได้ไม่เกิน 10 รูป",
          },
        ],
      });

    // Given หอพักและห้องพักแต่ละรายการมีรูปที่รับไว้แล้ว 10 รูป
    const dormitoryPage = renderApp(
      `/owner/dormitories/${dormitory.dormitory_id}/edit`,
    );
    const dormitoryImageInput = await screen.findByLabelText("รูปภาพหอพัก");

    // When แสดงรูปเดิม 10 รูปของหอพักก่อนเลือกไฟล์เพิ่ม
    fireEvent.change(dormitoryImageInput, {
      target: { files: dormitoryFiles },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));
    await waitFor(() => {
      expect(uploadOwnerDormitoryImages).toHaveBeenCalledWith(
        dormitory.dormitory_id,
        dormitoryFiles,
      );
    });

    // When เจ้าของเลือกไฟล์ที่ถูกต้องเพิ่มอีก 1 รูปสำหรับหอพัก
    fireEvent.change(dormitoryImageInput, {
      target: { files: [extraDormitoryFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then ปฏิเสธเฉพาะไฟล์เกินจำนวนพร้อมสาเหตุและคงรูปเดิมไว้
    await waitFor(() => {
      expect(uploadOwnerDormitoryImages).toHaveBeenLastCalledWith(
        dormitory.dormitory_id,
        [extraDormitoryFile],
      );
    });
    expect(
      await screen.findByText(
        "dormitory-extra.jpg: อัปโหลดได้ไม่เกิน 10 รูป",
      ),
    ).toBeTruthy();
    const dormitoryAcceptedList = screen.getByRole("list", {
      name: "รูปภาพหอพักที่อัปโหลดแล้ว",
    });
    expect(within(dormitoryAcceptedList).getAllByRole("listitem")).toHaveLength(
      10,
    );

    dormitoryPage.unmount();
    renderApp(
      `/owner/dormitories/${dormitory.dormitory_id}/rooms`,
    );
    const roomImageInput = await screen.findByLabelText(
      `รูปภาพห้องพัก ${room.room_id}`,
    );

    // When แสดงรูปเดิม 10 รูปของห้องพักก่อนเลือกไฟล์เพิ่ม
    fireEvent.change(roomImageInput, {
      target: { files: roomFiles },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "อัปโหลดรูปภาพห้องพัก" }),
    );
    await waitFor(() => {
      expect(uploadOwnerRoomImages).toHaveBeenCalledWith(
        dormitory.dormitory_id,
        room.room_id,
        roomFiles,
      );
    });

    // When เจ้าของเลือกไฟล์ที่ถูกต้องเพิ่มอีก 1 รูปสำหรับห้องพัก
    fireEvent.change(roomImageInput, {
      target: { files: [extraRoomFile] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "อัปโหลดรูปภาพห้องพัก" }),
    );

    // Then ปฏิเสธเฉพาะไฟล์เกินจำนวนพร้อมสาเหตุและคงรูปเดิมไว้
    await waitFor(() => {
      expect(uploadOwnerRoomImages).toHaveBeenLastCalledWith(
        dormitory.dormitory_id,
        room.room_id,
        [extraRoomFile],
      );
    });
    expect(
      await screen.findByText("room-extra.jpg: อัปโหลดได้ไม่เกิน 10 รูป"),
    ).toBeTruthy();
    const roomAcceptedList = screen.getByRole("list", {
      name: `รูปห้อง ${room.room_id} ที่อัปโหลดแล้ว`,
    });
    expect(within(roomAcceptedList).getAllByRole("listitem")).toHaveLength(10);
  });
});
