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
  createOwnerDormitoryRoom,
  getOwnerDormitories,
  getOwnerDormitory,
  getOwnerDormitoryRooms,
  updateOwnerDormitoryRoom,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
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

describe("AC-DOR-08", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_AC_DOR_08_room_management_page_is_separate_and_linked", async () => {
    const dormitory = {
      dormitory_id: "dorm-001",
      name: "หอพัก owner-1",
      location: "ทำเล owner-1",
    };
    const firstRoom = {
      room_id: "room-001",
      dormitory_id: "dorm-001",
      monthly_rent: "5000",
    };
    const secondRoom = {
      room_id: "room-002",
      dormitory_id: "dorm-001",
      monthly_rent: "6000",
    };
    const createdRoom = {
      room_id: "room-003",
      dormitory_id: "dorm-001",
      monthly_rent: "7000",
    };
    const updatedRoom = { ...firstRoom, monthly_rent: "5500" };
    getOwnerDormitories.mockResolvedValue([dormitory]);
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryRooms.mockResolvedValue([firstRoom, secondRoom]);
    createOwnerDormitoryRoom.mockResolvedValue(createdRoom);
    updateOwnerDormitoryRoom.mockResolvedValue(updatedRoom);

    // Given เจ้าของเลือกหอพักของตนจากรายการจัดการห้องพัก
    renderApp("/owner/rooms");
    fireEvent.click(await screen.findByRole("link", { name: "จัดการห้องพัก" }));

    // When เปิดหน้าจัดการห้องพักของหอพักที่เลือก
    expect(
      await screen.findByRole("heading", { name: "หอพัก owner-1" }),
    ).toBeTruthy();
    expect(screen.getByText("รหัสหอพัก: dorm-001")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "จัดการข้อมูลห้องพัก" })).toBeTruthy();
    expect(screen.getByText("รหัสห้องพัก: room-001")).toBeTruthy();
    expect(screen.getByText("ราคาปัจจุบัน: 5000 บาท/เดือน")).toBeTruthy();
    expect(screen.getByText("รหัสห้องพัก: room-002")).toBeTruthy();
    expect(screen.getByText("ราคาปัจจุบัน: 6000 บาท/เดือน")).toBeTruthy();
    expect(getOwnerDormitoryRooms).toHaveBeenCalledWith("dorm-001");

    // Then เพิ่มห้องหลายห้องและแก้ไขราคาในหน้าที่แยก โดยผูกกับหอพักที่เลือก
    fireEvent.change(screen.getByLabelText("ราคาต่อห้อง (บาท/เดือน)"), {
      target: { value: "7000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "เพิ่มห้องพัก" }));
    await waitFor(() => {
      expect(createOwnerDormitoryRoom).toHaveBeenCalledWith("dorm-001", {
        monthly_rent: "7000",
      });
    });
    expect(await screen.findByText("รหัสห้องพัก: room-003")).toBeTruthy();

    fireEvent.change(
      screen.getByLabelText("ราคาใหม่ ห้องพัก room-001 (บาท/เดือน)"),
      { target: { value: "5500" } },
    );
    const firstRoomForm = screen.getByRole("form", {
      name: "แบบฟอร์มราคาห้อง room-001",
    });
    fireEvent.click(
      within(firstRoomForm).getByRole("button", { name: "บันทึกราคา" }),
    );
    await waitFor(() => {
      expect(updateOwnerDormitoryRoom).toHaveBeenCalledWith(
        "dorm-001",
        "room-001",
        { monthly_rent: "5500" },
      );
    });
    expect(await screen.findByText("ราคาปัจจุบัน: 5500 บาท/เดือน")).toBeTruthy();
  });

  it("test_AC_DOR_08_room_client_uses_owner_api_and_selected_ids", async () => {
    const room = {
      room_id: "room-001",
      dormitory_id: "dorm-001",
      monthly_rent: "5000",
    };
    const updatedRoom = { ...room, monthly_rent: "5500" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [room] })
      .mockResolvedValueOnce({ ok: true, json: async () => room })
      .mockResolvedValueOnce({ ok: true, json: async () => updatedRoom });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const {
        getOwnerDormitoryRooms: fetchRooms,
        createOwnerDormitoryRoom: createRoom,
        updateOwnerDormitoryRoom: updateRoom,
      } = await vi.importActual("../api/client.js");

      // When อ่าน เพิ่ม และแก้ไขข้อมูลห้องของหอพักที่เลือก
      await fetchRooms("dorm-001");
      await createRoom("dorm-001", { monthly_rent: "5000" });
      await updateRoom("dorm-001", "room-001", { monthly_rent: "5500" });

      // Then ใช้ ID ที่เลือก, ตัวตนเจ้าของ และฟิลด์ตามข้อกำหนดเท่านั้น
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "/owners/dormitories/dorm-001/rooms",
        { headers: { "X-Owner-Id": "owner-1" } },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/owners/dormitories/dorm-001/rooms",
        {
          method: "POST",
          headers: {
            "X-Owner-Id": "owner-1",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ monthly_rent: "5000" }),
        },
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "/owners/dormitories/dorm-001/rooms/room-001",
        {
          method: "PUT",
          headers: {
            "X-Owner-Id": "owner-1",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ monthly_rent: "5500" }),
        },
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
