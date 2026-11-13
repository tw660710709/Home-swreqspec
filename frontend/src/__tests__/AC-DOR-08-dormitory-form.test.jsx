import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import {
  createOwnerDormitory,
  getOwnerDormitory,
  updateOwnerDormitory,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerDormitories: vi.fn(),
  getOwnerDormitory: vi.fn(),
  createOwnerDormitory: vi.fn(),
  updateOwnerDormitory: vi.fn(),
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

  it("test_AC_DOR_08_dormitory_form_saves_valid_data", async () => {
    const savedDormitory = {
      dormitory_id: "dorm-created",
      name: "หอพักใหม่",
      location: "เชียงใหม่",
      type: "หอพักรวม",
      contact_info: "โทรศัพท์ 0800000000",
      amenities: ["Wi-Fi", "ที่จอดรถ"],
      rules: "ห้ามสูบบุหรี่",
      approval_status: "Pending",
    };
    createOwnerDormitory.mockResolvedValue(savedDormitory);
    getOwnerDormitory.mockResolvedValue(savedDormitory);

    // Given เจ้าของอยู่ในฟอร์มเพิ่มหอพักและกรอกข้อมูลที่จำเป็นครบ
    renderApp("/owner/dormitories/new");
    fireEvent.change(screen.getByLabelText("ชื่อหอพัก"), {
      target: { value: "หอพักใหม่" },
    });
    fireEvent.change(screen.getByLabelText("ที่อยู่/ทำเล"), {
      target: { value: "เชียงใหม่" },
    });
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักรวม" },
    });
    fireEvent.change(screen.getByLabelText("ช่องทางติดต่อ"), {
      target: { value: "โทรศัพท์ 0800000000" },
    });
    fireEvent.change(screen.getByLabelText("สิ่งอำนวยความสะดวก"), {
      target: { value: "Wi-Fi, ที่จอดรถ" },
    });
    fireEvent.change(screen.getByLabelText("กฎระเบียบ"), {
      target: { value: "ห้ามสูบบุหรี่" },
    });

    // When เจ้าของยืนยันการบันทึกข้อมูลหอพัก
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then ส่งเฉพาะฟิลด์หอพัก ไม่มี ID หรือราคาห้อง และแสดงข้อมูลล่าสุดกับสถานะ
    await waitFor(() => {
      expect(createOwnerDormitory).toHaveBeenCalledWith({
        name: "หอพักใหม่",
        location: "เชียงใหม่",
        type: "หอพักรวม",
        contact_info: "โทรศัพท์ 0800000000",
        amenities: ["Wi-Fi", "ที่จอดรถ"],
        rules: "ห้ามสูบบุหรี่",
      });
    });
    expect(await screen.findByText("รหัสหอพัก: dorm-created")).toBeTruthy();
    expect(screen.getByText("สถานะ: รออนุมัติ")).toBeTruthy();
    expect(screen.queryByLabelText("รหัสหอพัก")).toBeNull();
    expect(screen.queryByLabelText("ราคาค่าเช่าต่อห้องต่อเดือน")).toBeNull();
    expect(getOwnerDormitory).toHaveBeenCalledWith("dorm-created");
  });

  it("test_AC_DOR_08_edit_form_sends_only_editable_fields", async () => {
    getOwnerDormitory.mockResolvedValue({
      dormitory_id: "dorm-001",
      name: "ชื่อเดิม",
      location: "ทำเลเดิม",
      type: "หอพักหญิง",
      contact_info: "โทรศัพท์เดิม",
      amenities: ["Wi-Fi"],
      rules: "กฎเดิม",
      approval_status: "Approved",
    });
    updateOwnerDormitory.mockResolvedValue({
      dormitory_id: "dorm-001",
      name: "ชื่อใหม่",
      location: "ทำเลเดิม",
      type: "หอพักหญิง",
      contact_info: "โทรศัพท์เดิม",
      amenities: ["Wi-Fi"],
      rules: "กฎเดิม",
      approval_status: "Pending",
    });

    // Given เจ้าของเปิดข้อมูลเดิมและแก้ไขชื่อหอพัก
    renderApp("/owner/dormitories/dorm-001/edit");
    fireEvent.change(await screen.findByLabelText("ชื่อหอพัก"), {
      target: { value: "ชื่อใหม่" },
    });

    // When เจ้าของยืนยันการบันทึก
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then ส่งรหัสเดิมแยกจาก payload และรหัสไม่ใช่ฟิลด์แก้ไขได้
    await waitFor(() => {
      expect(updateOwnerDormitory).toHaveBeenCalledWith("dorm-001", {
        name: "ชื่อใหม่",
        location: "ทำเลเดิม",
        type: "หอพักหญิง",
        contact_info: "โทรศัพท์เดิม",
        amenities: ["Wi-Fi"],
        rules: "กฎเดิม",
      });
    });
    expect(screen.getByText("รหัสหอพัก: dorm-001")).toBeTruthy();
    expect(screen.getByText("สถานะ: รออนุมัติ")).toBeTruthy();
    expect(screen.queryByLabelText("ราคาค่าเช่าต่อห้องต่อเดือน")).toBeNull();
  });

  it("test_AC_DOR_08_save_requests_use_owner_api", async () => {
    const payload = {
      name: "หอพักใหม่",
      location: "เชียงใหม่",
      type: "หอพักรวม",
      contact_info: "โทรศัพท์ 0800000000",
      amenities: ["Wi-Fi"],
      rules: null,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dormitory_id: "dorm-001" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const {
        createOwnerDormitory: createDormitory,
        updateOwnerDormitory: updateDormitory,
      } = await vi.importActual("../api/client.js");

      // When ส่งคำขอเพิ่มและแก้ไขผ่าน client
      await createDormitory(payload);
      await updateDormitory("dorm-001", payload);

      // Then ทั้งสองคำขอใช้ตัวตนเจ้าของจำลองและส่งเฉพาะข้อมูลที่แก้ไขได้
      expect(fetchMock).toHaveBeenNthCalledWith(1, "/owners/dormitories", {
        method: "POST",
        headers: {
          "X-Owner-Id": "owner-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/owners/dormitories/dorm-001",
        {
          method: "PUT",
          headers: {
            "X-Owner-Id": "owner-1",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
