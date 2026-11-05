import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

describe("F-06 unsupported about navigation", () => {
  it("test_F_06_about_link_removed", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "หน้าแรก" }).getAttribute("href")).toBe(
      "/",
    );
    expect(screen.queryByRole("link", { name: "เกี่ยวกับเรา" })).toBeNull();
  });
});
