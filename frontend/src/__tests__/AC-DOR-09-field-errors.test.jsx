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
  OwnerDormitoryValidationError,
  updateOwnerDormitory,
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
    createOwnerDormitory: vi.fn(),
    updateOwnerDormitory: vi.fn(),
    getOwnerDormitoryRooms: vi.fn(),
    createOwnerDormitoryRoom: vi.fn(),
    updateOwnerDormitoryRoom: vi.fn(),
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

describe("AC-DOR-09", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("test_AC_DOR_09_field_errors_display_without_saving", async () => {
    createOwnerDormitory.mockRejectedValue(
      new OwnerDormitoryValidationError({
        name: "กรุณากรอกชื่อหอพัก",
        location: "กรุณากรอกที่อยู่/ทำเล",
        type: "กรุณากรอกประเภทหอพัก",
        contact_info: "กรุณากรอกช่องทางติดต่อ",
      }),
    );

    // Given เจ้าของเปิดฟอร์มเพิ่มหอพักโดยเว้นข้อมูลจำเป็น
    renderApp("/owner/dormitories/new");

    // When เจ้าของยืนยันบันทึก
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then แสดงเหตุผลใต้แต่ละช่องและไม่แสดงผลสำเร็จ
    await waitFor(() => {
      expect(createOwnerDormitory).toHaveBeenCalledWith({
        name: "",
        location: "",
        type: "",
        contact_info: "",
        amenities: null,
        rules: null,
      });
    });
    expect(await screen.findByText("กรุณากรอกชื่อหอพัก")).toBeTruthy();
    expect(screen.getByText("กรุณากรอกที่อยู่/ทำเล")).toBeTruthy();
    expect(screen.getByText("กรุณากรอกประเภทหอพัก")).toBeTruthy();
    expect(screen.getByText("กรุณากรอกช่องทางติดต่อ")).toBeTruthy();
    expect(screen.getAllByRole("alert")).toHaveLength(4);
    expect(screen.getByLabelText("ชื่อหอพัก").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.queryByText("บันทึกข้อมูลหอพักสำเร็จ")).toBeNull();
  });

  it("test_AC_DOR_09_edit_field_error_clears_when_corrected", async () => {
    getOwnerDormitory.mockResolvedValue({
      dormitory_id: "dorm-001",
      name: "หอพักเดิม",
      location: "ทำเลเดิม",
      type: "หอพักรวม",
      contact_info: "โทรศัพท์เดิม",
      amenities: null,
      rules: null,
      approval_status: "Pending",
    });
    updateOwnerDormitory.mockRejectedValue(
      new OwnerDormitoryValidationError({
        name: "กรุณากรอกชื่อหอพัก",
      }),
    );

    // Given เจ้าของแก้ไขหอพักเดิมและเว้นชื่อหอพัก
    renderApp("/owner/dormitories/dorm-001/edit");
    const nameInput = await screen.findByLabelText("ชื่อหอพัก");
    fireEvent.change(nameInput, { target: { value: "" } });

    // When เจ้าของยืนยันบันทึก
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

    // Then API ไม่บันทึกและแสดงเหตุผลใต้ช่องชื่อ
    await waitFor(() => {
      expect(updateOwnerDormitory).toHaveBeenCalledWith("dorm-001", {
        name: "",
        location: "ทำเลเดิม",
        type: "หอพักรวม",
        contact_info: "โทรศัพท์เดิม",
        amenities: null,
        rules: null,
      });
    });
    expect(await screen.findByText("กรุณากรอกชื่อหอพัก")).toBeTruthy();
    expect(screen.getByText("รหัสหอพัก: dorm-001")).toBeTruthy();

    // When เจ้าของแก้ช่องชื่อให้มีข้อมูล
    fireEvent.change(nameInput, { target: { value: "ชื่อใหม่" } });

    // Then ล้างข้อผิดพลาดของช่องที่แก้ไขแล้ว
    await waitFor(() => {
      expect(screen.queryByText("กรุณากรอกชื่อหอพัก")).toBeNull();
    });
  });

  it("test_AC_DOR_09_client_maps_api_validation_details_to_fields", async () => {
    const payload = {
      name: "",
      location: "",
      type: "หอพักรวม",
      contact_info: "โทรศัพท์",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            type: "string_too_short",
            loc: ["body", "name"],
            msg: "String should have at least 1 character",
          },
          {
            type: "missing",
            loc: ["body", "location"],
            msg: "Field required",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const {
        createOwnerDormitory: createDormitory,
        OwnerDormitoryValidationError: ValidationError,
      } = await vi.importActual("../api/client.js");

      // When API ตอบ 422 พร้อมตำแหน่งและเหตุผลของแต่ละช่อง
      let validationError;
      try {
        await createDormitory(payload);
      } catch (error) {
        validationError = error;
      }

      // Then คำขอไปยัง API ยังคงผ่าน endpoint ของเจ้าของโดยไม่บันทึกสำเร็จ
      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError.fieldErrors).toEqual({
        name: "กรุณากรอกชื่อหอพัก",
        location: "กรุณากรอกที่อยู่/ทำเล",
      });
      expect(fetchMock).toHaveBeenCalledWith("/owners/dormitories", {
        method: "POST",
        headers: {
          "X-Owner-Id": "owner-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
