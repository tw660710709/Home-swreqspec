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

describe("TC-DOR-08-3", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_TC_DOR_08_3_room_management_is_separate_and_linked", async () => {
    const dormitory = {
      dormitory_id: "dorm-tc-08-3",
      name: "หอพักทดสอบ",
      location: "ทำเลทดสอบ",
    };
    const rooms = [
      {
        room_id: "room-tc-08-3-1",
        dormitory_id: dormitory.dormitory_id,
        monthly_rent: "5000",
      },
      {
        room_id: "room-tc-08-3-2",
        dormitory_id: dormitory.dormitory_id,
        monthly_rent: "6000",
      },
    ];
    const addedRoom = {
      room_id: "room-tc-08-3-3",
      dormitory_id: dormitory.dormitory_id,
      monthly_rent: "7000",
    };
    getOwnerDormitories.mockResolvedValue([dormitory]);
    getOwnerDormitory.mockResolvedValue(dormitory);
    getOwnerDormitoryRooms.mockResolvedValue(rooms);
    createOwnerDormitoryRoom.mockResolvedValue(addedRoom);

    // Given เจ้าของเลือกจัดการหอพักที่มีห้องหลายห้องเชื่อมโยงอยู่
    renderApp("/owner/rooms");
    fireEvent.click(await screen.findByRole("link", { name: "จัดการห้องพัก" }));

    // When เจ้าของเปิดหน้าจัดการห้องพักและเพิ่มห้องพร้อมราคาต่อเดือน
    expect(
      await screen.findByRole("heading", { name: "จัดการข้อมูลห้องพัก" }),
    ).toBeTruthy();
    expect(
      await screen.findByRole("heading", { name: dormitory.name }),
    ).toBeTruthy();
    expect(screen.getByText(`รหัสหอพัก: ${dormitory.dormitory_id}`)).toBeTruthy();
    expect(screen.getByText("รหัสห้องพัก: room-tc-08-3-1")).toBeTruthy();
    expect(screen.getByText("ราคาปัจจุบัน: 5000 บาท/เดือน")).toBeTruthy();
    expect(screen.getByText("รหัสห้องพัก: room-tc-08-3-2")).toBeTruthy();
    expect(screen.getByText("ราคาปัจจุบัน: 6000 บาท/เดือน")).toBeTruthy();
    expect(getOwnerDormitoryRooms).toHaveBeenCalledWith(
      dormitory.dormitory_id,
    );

    fireEvent.change(screen.getByLabelText("ราคาต่อห้อง (บาท/เดือน)"), {
      target: { value: "7000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "เพิ่มห้องพัก" }));

    // Then หน้าจอแยกแสดงห้องที่ผูกกับหอพักที่เลือก รองรับหลายห้องและราคา
    await waitFor(() => {
      expect(createOwnerDormitoryRoom).toHaveBeenCalledWith(
        dormitory.dormitory_id,
        { monthly_rent: "7000" },
      );
    });
    expect(await screen.findByText("รหัสห้องพัก: room-tc-08-3-3")).toBeTruthy();
    expect(screen.getByText("ราคาปัจจุบัน: 7000 บาท/เดือน")).toBeTruthy();
    const roomList = screen.getByRole("list", {
      name: "รายการห้องพักของหอพักนี้",
    });
    expect(within(roomList).getAllByRole("listitem")).toHaveLength(3);
  });
});
