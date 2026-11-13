import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

describe("AC-ACCOUNT-01 Manage Account page prototype", () => {
  it("test_AC_ACCOUNT_01_displays_separate_profile_and_password_sections", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "จัดการบัญชี" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "ข้อมูลส่วนตัว" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "เปลี่ยนรหัสผ่าน" })).toBeTruthy();
    expect(screen.getAllByText("ยังไม่มีข้อมูลในต้นแบบ")).toHaveLength(3);
    expect(
      screen.getByText("ต้นแบบนี้ยังไม่เชื่อมต่อข้อมูลบัญชีหรือระบบ Authentication"),
    ).toBeTruthy();
  });
});
