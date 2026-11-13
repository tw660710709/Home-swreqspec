import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getOwnerDormitories, getOwnerDormitory } from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
}));

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("AC-DOR-07", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_AC_DOR_07_owner_list_renders_only_owner_rows", async () => {
    getOwnerDormitories.mockResolvedValue([
      {
        dormitory_id: "dorm-001",
        name: "หอพักของ owner-1",
        location: "ทำเล owner-1",
        type: "หอพักรวม",
      },
      {
        dormitory_id: "dorm-003",
        name: "หอพักอีกแห่งของ owner-1",
        location: "ทำเล owner-1",
        type: "หอพักหญิง",
      },
    ]);

    // Given API คืนเฉพาะรายการที่ถูกกรองตาม X-Owner-Id
    // When เจ้าของเปิดเมนูจัดการข้อมูลหอพัก
    renderApp("/owner/dormitories");

    // Then เห็นเฉพาะรายการของตน พร้อมทางเลือกเพิ่มและแก้ไข
    expect(await screen.findByText("หอพักของ owner-1")).toBeTruthy();
    expect(screen.getByText("หอพักอีกแห่งของ owner-1")).toBeTruthy();
    expect(screen.getByRole("link", { name: "เพิ่มหอพักใหม่" }).getAttribute("href"))
      .toBe("/owner/dormitories/new");
    expect(screen.getAllByRole("link", { name: "แก้ไข" })).toHaveLength(2);
    expect(getOwnerDormitories).toHaveBeenCalledOnce();
  });

  it("test_AC_DOR_07_edit_form_shows_existing_data", async () => {
    getOwnerDormitory.mockResolvedValue({
      dormitory_id: "dorm-001",
      name: "หอพักของ owner-1",
      location: "ทำเลเดิม",
      type: "หอพักรวม",
      contact_info: "โทรศัพท์เดิม",
      approval_status: "Pending",
      amenities: ["Wi-Fi", "ที่จอดรถ"],
      rules: "ห้ามสูบบุหรี่",
    });

    // Given เจ้าของเลือกรายการหอพักของตนเพื่อแก้ไข
    // When เปิดแบบฟอร์มของรายการนั้น
    renderApp("/owner/dormitories/dorm-001/edit");

    // Then แสดงข้อมูลเดิมในแบบฟอร์ม
    expect(await screen.findByDisplayValue("หอพักของ owner-1")).toBeTruthy();
    expect(screen.getByDisplayValue("ทำเลเดิม")).toBeTruthy();
    expect(screen.getByDisplayValue("หอพักรวม")).toBeTruthy();
    expect(screen.getByDisplayValue("โทรศัพท์เดิม")).toBeTruthy();
    expect(screen.getByDisplayValue("Wi-Fi, ที่จอดรถ")).toBeTruthy();
    expect(screen.getByDisplayValue("ห้ามสูบบุหรี่")).toBeTruthy();
    expect(getOwnerDormitory).toHaveBeenCalledWith("dorm-001");
  });

  it("test_CON_ACC_01_owner_client_sends_prototype_identity_header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dormitory_id: "dorm-001" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const { getOwnerDormitories: fetchOwnerList, getOwnerDormitory: fetchOwnerDormitory } =
        await vi.importActual("../api/client.js");
      await fetchOwnerList();
      await fetchOwnerDormitory("dorm-001");

      expect(fetchMock).toHaveBeenNthCalledWith(1, "/owners/dormitories", {
        headers: { "X-Owner-Id": "owner-1" },
      });
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/owners/dormitories/dorm-001",
        { headers: { "X-Owner-Id": "owner-1" } },
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
