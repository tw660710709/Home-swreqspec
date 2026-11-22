import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

afterEach(cleanup);

describe("AC-ACCOUNT-01 Manage Account page prototype", () => {
  function renderPage() {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );
  }

  it("test_AC_ACCOUNT_01_displays_separate_editable_profile_and_password_sections", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "จัดการบัญชี" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "ข้อมูลส่วนตัว" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "เปลี่ยนรหัสผ่าน" })).toBeTruthy();
    expect(screen.getByLabelText("ชื่อ")).toBeTruthy();
    expect(screen.getByLabelText("เบอร์โทรศัพท์")).toBeTruthy();
    expect(screen.getByLabelText("อีเมล")).toBeTruthy();
    expect(screen.getByLabelText("รหัสผ่านเดิม")).toBeTruthy();
    expect(screen.getByLabelText("รหัสผ่านใหม่")).toBeTruthy();
    expect(screen.getByLabelText("ยืนยันรหัสผ่านใหม่")).toBeTruthy();
    expect(
      screen.getByText("การบังคับกรอกและเงื่อนไขการตรวจสอบชื่อรอข้อสรุปจากทีม"),
    ).toBeTruthy();
    expect(
      screen.getByText(/ไม่เชื่อมต่อฐานข้อมูลหรือ Authentication/),
    ).toBeTruthy();
  });

  it("test_AC_ACCOUNT_03_validates_profile_fields_before_mock_save_and_cancel", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("ชื่อ"), {
      target: { value: "ตัวอย่าง" },
    });
    fireEvent.change(screen.getByLabelText("เบอร์โทรศัพท์"), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText("อีเมล"), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูล" }));

    expect(screen.getByText("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก")).toBeTruthy();
    expect(screen.getByText("กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("เบอร์โทรศัพท์"), {
      target: { value: "0812345678" },
    });
    fireEvent.change(screen.getByLabelText("อีเมล"), {
      target: { value: "resident@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูล" }));

    expect(
      screen.getByText("บันทึกข้อมูลในต้นแบบแล้ว (ยังไม่ได้บันทึกลงฐานข้อมูล)"),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("ชื่อ"), {
      target: { value: "ชื่อที่แก้แล้ว" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(screen.getByLabelText("ชื่อ").value).toBe("ตัวอย่าง");
  });

  it("test_AC_ACCOUNT_03_validates_password_and_discloses_missing_auth_dependency", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("รหัสผ่านเดิม"), {
      target: { value: "old-password" },
    });
    fireEvent.change(screen.getByLabelText("รหัสผ่านใหม่"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("ยืนยันรหัสผ่านใหม่"), {
      target: { value: "different" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "ตรวจสอบข้อมูลในต้นแบบ" }),
    );

    expect(
      screen.getByText("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร"),
    ).toBeTruthy();
    expect(
      screen.getByText("รหัสผ่านใหม่และการยืนยันต้องตรงกัน"),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("รหัสผ่านใหม่"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("ยืนยันรหัสผ่านใหม่"), {
      target: { value: "new-password" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "ตรวจสอบข้อมูลในต้นแบบ" }),
    );

    expect(
      screen.getByText(/ยังเปลี่ยนรหัสผ่านไม่ได้จนกว่าจะเชื่อมระบบ Authentication ของ UC-07/),
    ).toBeTruthy();
  });
});
