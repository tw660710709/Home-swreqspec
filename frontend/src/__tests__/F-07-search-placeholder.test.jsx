import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn().mockResolvedValue([]),
  searchDormitories: vi.fn().mockResolvedValue([]),
}));

describe("F-07 search placeholder", () => {
  it("test_F_07_search_hint_only_mentions_supported_search_fields", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const searchInput = screen.getByRole("searchbox", {
      name: "ค้นหาชื่อหอพักหรือทำเล",
    });
    expect(searchInput.getAttribute("placeholder")).toBe(
      "ระบุชื่อหอพักหรือทำเล",
    );
    expect(searchInput.getAttribute("placeholder")).not.toContain("สถานศึกษา");
  });
});
