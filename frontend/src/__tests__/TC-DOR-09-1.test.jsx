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
  OwnerDormitoryValidationError,
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

describe("TC-DOR-09-1", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it(
    "test_TC_DOR_09_1_missing_required_fields_shows_reasons_without_saving",
    async () => {
      createOwnerDormitory.mockRejectedValue(
        new OwnerDormitoryValidationError({
          name: "กรุณากรอกชื่อหอพัก",
          location: "กรุณากรอกที่อยู่/ทำเล",
          type: "สาเหตุการตรวจสอบประเภท",
          contact_info: "สาเหตุการตรวจสอบช่องทางติดต่อ",
        }),
      );

      // Given เจ้าของกรอกข้อมูลหอพักโดยเว้นชื่อ ทำเล ประเภท และช่องทางติดต่อ
      renderApp("/owner/dormitories/new");

      // When เจ้าของกดยืนยันการบันทึก
      fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

      // Then แสดงเหตุผลรายช่องและไม่แสดงผลสำเร็จ
      await waitFor(() => {
        expect(createOwnerDormitory).toHaveBeenCalledTimes(1);
      });
      expect(await screen.findByText("กรุณากรอกชื่อหอพัก")).toBeTruthy();
      expect(screen.getByText("กรุณากรอกที่อยู่/ทำเล")).toBeTruthy();
      expect(screen.getAllByRole("alert")).toHaveLength(4);
      for (const label of [
        "ชื่อหอพัก",
        "ที่อยู่/ทำเล",
        "ประเภทหอพัก",
        "ช่องทางติดต่อ",
      ]) {
        const field = screen.getByLabelText(label);
        expect(field.getAttribute("aria-invalid")).toBe("true");
        const describedBy = field.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();
        expect(document.getElementById(describedBy).textContent.trim()).not.toBe(
          "",
        );
      }
      expect(screen.queryByText("บันทึกข้อมูลหอพักสำเร็จ")).toBeNull();
    },
  );
});
