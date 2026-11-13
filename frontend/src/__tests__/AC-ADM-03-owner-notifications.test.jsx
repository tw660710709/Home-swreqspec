import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import OwnerNotificationsPage from "../pages/OwnerNotificationsPage.jsx";
import {
  getOwnerNotifications,
  resubmitDormitoryForReview,
} from "../api/client.js";

vi.mock("../api/client.js", () => ({
  getOwnerNotifications: vi.fn(),
  resubmitDormitoryForReview: vi.fn(),
}));

describe("UC-13 Owner notifications", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getOwnerNotifications.mockResolvedValue([
      {
        notification_id: "notification-1",
        dormitory_id: "dorm-1",
        action: "Need Revision",
        message: "ผลการตรวจสอบหอพัก: ต้องแก้ไขข้อมูลหรือเอกสาร",
        reason: "กรุณาแก้ไขข้อมูล",
        created_at: "2026-11-13T21:00:00+00:00",
      },
      {
        notification_id: "notification-2",
        dormitory_id: "dorm-1",
        action: "Approved",
        message: "ผลการตรวจสอบหอพัก: ได้รับการอนุมัติ",
        reason: null,
        created_at: "2026-11-12T21:00:00+00:00",
      },
    ]);
    resubmitDormitoryForReview.mockResolvedValue({});
  });

  it("test_AC_ADM_03_owner_views_notification_reason_and_history", async () => {
    render(
      <MemoryRouter>
        <OwnerNotificationsPage />
      </MemoryRouter>,
    );

    expect((await screen.findByText(/เหตุผล:/)).textContent).toContain(
      "กรุณาแก้ไขข้อมูล",
    );
    expect(screen.getByText("Approved")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "แก้ไขข้อมูลหอพัก" }).getAttribute("href"),
    ).toBe("/owner/dormitories/dorm-1/edit");
  });

  it("test_FR_ADM_07_owner_resubmits_revision_for_review", async () => {
    render(
      <MemoryRouter>
        <OwnerNotificationsPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "ส่งตรวจสอบใหม่" }),
    );
    expect(resubmitDormitoryForReview).toHaveBeenCalledWith("dorm-1");
    expect((await screen.findByRole("status")).textContent).toContain(
      "ส่งตรวจสอบหอพักใหม่สำเร็จ",
    );
  });
});
