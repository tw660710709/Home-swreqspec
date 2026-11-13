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

describe("TC-DOR-09-2", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it(
    "test_TC_DOR_09_2_single_missing_location_shows_error_without_saving",
    async () => {
      createOwnerDormitory.mockRejectedValue(
        new OwnerDormitoryValidationError({
          location: "กรุณากรอกที่อยู่/ทำเล",
        }),
      );

      // Given เจ้าของกรอกข้อมูลจำเป็นครบ ยกเว้นที่อยู่/ทำเล
      renderApp("/owner/dormitories/new");
      fireEvent.change(screen.getByLabelText("ชื่อหอพัก"), {
        target: { value: "หอพัก TC-DOR-09-2" },
      });
      fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
        target: { value: "หอพักรวม" },
      });
      fireEvent.change(screen.getByLabelText("ช่องทางติดต่อ"), {
        target: { value: "ช่องทางติดต่อทดสอบ" },
      });

      // When เจ้าของกดยืนยันการบันทึก
      fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูลหอพัก" }));

      // Then แจ้งเฉพาะช่องที่อยู่/ทำเลและไม่แสดงผลสำเร็จ
      await waitFor(() => {
        expect(createOwnerDormitory).toHaveBeenCalledTimes(1);
      });
      expect(
        await screen.findByText("กรุณากรอกที่อยู่/ทำเล"),
      ).toBeTruthy();
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(
        screen.getByLabelText("ที่อยู่/ทำเล").getAttribute("aria-invalid"),
      ).toBe("true");
      expect(screen.queryByText("บันทึกข้อมูลหอพักสำเร็จ")).toBeNull();
    },
  );
});
