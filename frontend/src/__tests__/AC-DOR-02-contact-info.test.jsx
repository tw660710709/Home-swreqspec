import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { getDormitoryDetail } from "../api/dormApi.js";

vi.mock("../api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

describe("AC-DOR-02 contact information", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it(
    "test_AC_DOR_02_contact_info_displays_without_an_unsupported_call_action",
    async () => {
      getDormitoryDetail.mockResolvedValue({
        id: "dorm-approved-verified",
        name: "หอพักตัวอย่าง A",
        location: "ทำเลตัวอย่าง A",
        type: "หอพักหญิง",
        rooms: [],
        amenities: [],
        rules: "กฎระเบียบตัวอย่าง",
        security_info: "ข้อมูลความปลอดภัยตัวอย่าง",
        contact_info: "ช่องทางติดต่อตัวอย่าง",
        images: [],
        nearby_places: [],
        verified_badge: true,
      });

      render(
        <MemoryRouter initialEntries={["/dorms/dorm-approved-verified"]}>
          <App />
        </MemoryRouter>,
      );

      expect(await screen.findByText("ช่องทางติดต่อตัวอย่าง")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "โทร/ไลน์" })).toBeNull();
    },
  );
});
