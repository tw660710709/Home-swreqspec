import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";
import {
  downloadDormitoryStatisticsReport,
  getDormitoryDetail,
  getDormitoryStatistics,
  getRecommendedDormitories,
  searchDormitories,
} from "./api/dormApi.js";

vi.mock("./api/dormApi.js", () => ({
  downloadDormitoryStatisticsReport: vi.fn(),
  getDormitoryDetail: vi.fn(),
  getDormitoryStatistics: vi.fn(),
  getRecommendedDormitories: vi.fn(),
  searchDormitories: vi.fn(),
}));

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

describe("dormitory search and details", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    getRecommendedDormitories.mockResolvedValue([]);
  });

  it("test_AC_DOR_01_search_female_available_dormitories", async () => {
    searchDormitories.mockResolvedValue([
      {
        id: "dorm-approved-verified",
        name: "หอพักตัวอย่าง A",
        location: "ทำเลตัวอย่าง A",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "7000",
        availability_status: "ห้องว่าง",
      },
    ]);

    renderApp();
    await screen.findByText("หอพักตัวอย่าง A");
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักหญิง" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "",
        dormitoryType: "หอพักหญิง",
        minPrice: "",
        maxPrice: "",
      });
    });
    expect(await screen.findByText(/สถานะห้อง:\s*ห้องว่าง/)).toBeTruthy();
    expect(screen.getByText(/ประเภท:\s*หอพักหญิง/)).toBeTruthy();
  });

  it("test_AC_DOR_02_detail_verified_dormitory", async () => {
    searchDormitories.mockResolvedValue([
      {
        id: "dorm-approved-verified",
        name: "หอพักตัวอย่าง A",
        location: "ทำเลตัวอย่าง A",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "7000",
        availability_status: "ห้องว่าง",
      },
    ]);
    getDormitoryDetail.mockResolvedValue({
      id: "dorm-approved-verified",
      name: "หอพักตัวอย่าง A",
      location: "ทำเลตัวอย่าง A",
      type: "หอพักหญิง",
      rooms: [
        {
          id: "room-a-available",
          name: "ห้องตัวอย่าง A1",
          monthly_rent: "5000",
          water_fee: "100",
          electricity_fee: "200",
          deposit: "5000",
        },
        {
          id: "room-a-full",
          name: "ห้องตัวอย่าง A2",
          monthly_rent: "7000",
          water_fee: "100",
          electricity_fee: "200",
          deposit: "7000",
        },
      ],
      amenities: ["อินเทอร์เน็ตไร้สาย", "ที่จอดรถ"],
      rules: "กฎระเบียบตัวอย่าง",
      security_info: "ข้อมูลความปลอดภัยตัวอย่าง",
      contact_info: "ช่องทางติดต่อตัวอย่าง",
      images: [
        {
          url: "/fixtures/dormitory-a-room-1.jpg",
          caption: "รูปห้องตัวอย่าง A1",
        },
      ],
      nearby_places: [
        {
          name: "สถานที่ใกล้เคียงตัวอย่าง A",
          distance_text: "ระยะทางตัวอย่าง A",
        },
      ],
      verified_badge: true,
    });

    renderApp();
    await screen.findByText("หอพักตัวอย่าง A");
    fireEvent.click(screen.getByRole("button", { name: "ดูรายละเอียด" }));

    expect(
      await screen.findByRole("heading", {
        name: "ราคาค่าเช่าและค่าใช้จ่าย",
      }),
    ).toBeTruthy();
    expect(getDormitoryDetail).toHaveBeenCalledWith("dorm-approved-verified");
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("ห้องตัวอย่าง A1")).toBeTruthy();
    expect(screen.getByText("ค่าเช่า: 5,000 บาท")).toBeTruthy();
    expect(screen.getAllByText("ค่าน้ำ: 100 บาท")).toHaveLength(2);
    expect(screen.getAllByText("ค่าไฟ: 200 บาท")).toHaveLength(2);
    expect(screen.getByText("ค่ามัดจำ: 5,000 บาท")).toBeTruthy();
    expect(screen.getByText("ห้องตัวอย่าง A2")).toBeTruthy();
    expect(screen.getByText("ค่าเช่า: 7,000 บาท")).toBeTruthy();
    expect(screen.getByText("ค่ามัดจำ: 7,000 บาท")).toBeTruthy();
    expect(screen.getByText("- อินเทอร์เน็ตไร้สาย")).toBeTruthy();
    expect(screen.getByText("- ที่จอดรถ")).toBeTruthy();
    expect(screen.getByText("กฎระเบียบตัวอย่าง")).toBeTruthy();
    expect(screen.getByText("ข้อมูลความปลอดภัยตัวอย่าง")).toBeTruthy();
    expect(screen.getByText("ช่องทางติดต่อตัวอย่าง")).toBeTruthy();
    expect(screen.getByRole("img", { name: "รูปห้องตัวอย่าง A1" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "รูปห้องตัวอย่าง A1" }).getAttribute("src")).toBe(
      "/fixtures/dormitory-a-room-1.jpg",
    );
    expect(
      screen.getByText(/สถานที่ใกล้เคียงตัวอย่าง A — ระยะทางตัวอย่าง A/),
    ).toBeTruthy();
  });

  it("test_AC_DOR_04_clear_filter_loads_all_dormitories", async () => {
    searchDormitories
      .mockResolvedValueOnce([
        {
          id: "dorm-all",
          name: "หอพักที่โหลดทั้งหมด",
          location: "ทำเลตัวอย่าง",
          type: "หอพักหญิง",
          min_rent: "5000",
          max_rent: "5000",
          availability_status: "ห้องว่าง",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "dorm-filtered",
          name: "ผลการค้นหาที่กรอง",
          location: "ทำเลเป้าหมาย",
          type: "หอพักชาย",
          min_rent: "8000",
          max_rent: "8000",
          availability_status: "ห้องเต็ม",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "dorm-all",
          name: "หอพักที่โหลดทั้งหมด",
          location: "ทำเลตัวอย่าง",
          type: "หอพักหญิง",
          min_rent: "5000",
          max_rent: "5000",
          availability_status: "ห้องว่าง",
        },
      ]);

    renderApp();
    await screen.findByText("หอพักที่โหลดทั้งหมด");
    fireEvent.change(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล"), {
      target: { value: "เป้าหมาย" },
    });
    fireEvent.change(screen.getByLabelText("ประเภทหอพัก"), {
      target: { value: "หอพักชาย" },
    });
    fireEvent.change(screen.getByLabelText("ราคาต่ำสุด"), {
      target: { value: "8000" },
    });
    fireEvent.change(screen.getByLabelText("ราคาสูงสุด"), {
      target: { value: "9000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    expect(await screen.findByText("ผลการค้นหาที่กรอง")).toBeTruthy();
    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "เป้าหมาย",
        dormitoryType: "หอพักชาย",
        minPrice: "8000",
        maxPrice: "9000",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));

    await waitFor(() => {
      expect(searchDormitories).toHaveBeenLastCalledWith({
        query: "",
        dormitoryType: "",
        minPrice: "",
        maxPrice: "",
      });
    });
    expect(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล").value).toBe("");
    expect(screen.getByLabelText("ประเภทหอพัก").value).toBe("");
    expect(screen.getByLabelText("ราคาต่ำสุด").value).toBe("");
    expect(screen.getByLabelText("ราคาสูงสุด").value).toBe("");
    expect(await screen.findByText("หอพักที่โหลดทั้งหมด")).toBeTruthy();
  });

  it("test_AC_DOR_03_empty_search_returns_recommendations", async () => {
    searchDormitories.mockResolvedValue([]);
    getRecommendedDormitories.mockResolvedValue([
      {
        id: "dorm-approved-verified",
        name: "หอพักแนะนำตัวอย่าง",
        location: "ทำเลตัวอย่าง",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "7000",
        availability_status: "ห้องว่าง",
      },
    ]);

    renderApp();
    await screen.findByText("ไม่พบหอพักตามเงื่อนไขที่คุณระบุ");

    fireEvent.change(screen.getByLabelText("ค้นหาชื่อหอพักหรือทำเล"), {
      target: { value: "สถานที่ใกล้เคียง" },
    });
    fireEvent.change(screen.getByLabelText("ราคาต่ำสุด"), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByLabelText("ราคาสูงสุด"), {
      target: { value: "7000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ค้นหา" }));

    expect(await screen.findByText("หอพักแนะนำตัวอย่าง")).toBeTruthy();
    expect(
      screen.getByText("ไม่พบหอพักตามเงื่อนไขที่คุณระบุ"),
    ).toBeTruthy();
    expect(getRecommendedDormitories).toHaveBeenLastCalledWith({
      query: "สถานที่ใกล้เคียง",
      dormitoryType: "",
      minPrice: "5000",
      maxPrice: "7000",
    });
    expect(
      screen.getByRole("list", { name: "หอพักแนะนำ" }),
    ).toBeTruthy();
  });

  it("test_AC_DOR_05_detail_load_error_has_retry", async () => {
    searchDormitories.mockResolvedValue([
      {
        id: "dorm-approved-verified",
        name: "หอพักตัวอย่าง A",
        location: "ทำเลตัวอย่าง A",
        type: "หอพักหญิง",
        min_rent: "5000",
        max_rent: "7000",
        availability_status: "ห้องว่าง",
      },
    ]);
    getDormitoryDetail
      .mockRejectedValueOnce(new Error("Server error"))
      .mockResolvedValueOnce({
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

    renderApp();
    await screen.findByText("หอพักตัวอย่าง A");
    fireEvent.click(screen.getByRole("button", { name: "ดูรายละเอียด" }));

    expect(await screen.findByText("ไม่สามารถโหลดข้อมูลได้")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "ลองใหม่" }),
    ).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }));

    expect(
      await screen.findByRole("heading", { name: "ราคาค่าเช่าและค่าใช้จ่าย" }),
    ).toBeTruthy();
    expect(getDormitoryDetail).toHaveBeenNthCalledWith(
      1,
      "dorm-approved-verified",
    );
    expect(getDormitoryDetail).toHaveBeenNthCalledWith(
      2,
      "dorm-approved-verified",
    );
  });

  it("test_AC_STAT_01_dashboard_displays_summary_metrics", async () => {
    getDormitoryStatistics.mockResolvedValue({
      empty_data: false,
      summary: {
        dormitory_id: "dorm-approved-verified",
        owner_id: "owner-1",
        vacant_rooms: 4,
        occupied_rooms: 6,
        detail_page_views: 28,
        appointments_count: 11,
      },
      date_range: {
        start_date: "2026-01-01",
        end_date: "2026-01-07",
        detail_page_views: 28,
        appointments_count: 11,
      },
    });

    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "สถิติหอพัก" })).toBeTruthy();
    expect(screen.getAllByText("ห้องว่าง").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ผู้เข้าชม").length).toBeGreaterThan(0);
    expect(screen.getAllByText("28").length).toBeGreaterThan(0);
    expect(screen.getAllByText("การนัดหมาย").length).toBeGreaterThan(0);
    expect(screen.getAllByText("11").length).toBeGreaterThan(0);
    expect(getDormitoryStatistics).toHaveBeenCalledWith({
      dormitoryId: "dorm-approved-verified",
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
  });

  it("test_AC_STAT_02_dashboard_displays_current_room_status_counts", async () => {
    getDormitoryStatistics.mockResolvedValue({
      empty_data: false,
      summary: {
        vacant_rooms: 4,
        occupied_rooms: 6,
        detail_page_views: 0,
        appointments_count: 0,
      },
      date_range: {
        start_date: "2026-01-03",
        end_date: "2026-01-03",
        detail_page_views: 0,
        appointments_count: 0,
      },
    });

    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "กราฟสรุป" })).toBeTruthy();
    expect(screen.getByText("จำนวนห้องทั้งหมด")).toBeTruthy();
    expect(screen.getAllByText("ห้องว่าง").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ห้องเต็ม").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("6").length).toBeGreaterThan(0);
  });

  it("test_AC_STAT_04_no_statistics_data_shows_message", async () => {
    getDormitoryStatistics.mockResolvedValue({
      empty_data: true,
      summary: {
        total_rooms: 10,
        vacant_rooms: 4,
        occupied_rooms: 6,
        detail_page_views: 0,
        appointments_count: 0,
      },
      date_range: {
        start_date: "2026-02-01",
        end_date: "2026-02-02",
        detail_page_views: 0,
        appointments_count: 0,
      },
    });

    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("ยังไม่มีข้อมูลสถิติในรอบเวลานี้")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ดาวน์โหลดรายงาน CSV" })).toBeTruthy();
    expect(screen.getByText("จำนวนห้องทั้งหมด")).toBeTruthy();
    expect(screen.getAllByText("ห้องว่าง").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ห้องเต็ม").length).toBeGreaterThan(0);
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.queryByText("ผู้เข้าชม")).toBeNull();
  });

  it("test_AC_STAT_04_zero_metrics_with_data_are_displayed", async () => {
    getDormitoryStatistics.mockResolvedValue({
      empty_data: false,
      summary: {
        vacant_rooms: 0,
        occupied_rooms: 0,
        detail_page_views: 0,
        appointments_count: 0,
      },
      date_range: {
        start_date: "2026-01-03",
        end_date: "2026-01-03",
        detail_page_views: 0,
        appointments_count: 0,
      },
    });

    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "กราฟสรุป" })).toBeTruthy();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "ดาวน์โหลดรายงาน CSV" })).toBeTruthy();
    expect(downloadDormitoryStatisticsReport).not.toHaveBeenCalled();
  });

  it("test_AC_STAT_03_invalid_date_range_is_rejected_without_search", async () => {
    getDormitoryStatistics.mockResolvedValue({
      empty_data: false,
      summary: {
        vacant_rooms: 4,
        occupied_rooms: 6,
        detail_page_views: 8,
        appointments_count: 2,
      },
      date_range: {
        start_date: "2026-01-01",
        end_date: "2026-01-07",
        detail_page_views: 8,
        appointments_count: 2,
      },
    });

    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "กราฟสรุป" });

    const callsBeforeSubmit = getDormitoryStatistics.mock.calls.length;
    fireEvent.change(screen.getByLabelText("วันที่เริ่มต้น"), {
      target: { value: "2026-01-10" },
    });
    fireEvent.change(screen.getByLabelText("วันที่สิ้นสุด"), {
      target: { value: "2026-01-09" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันช่วงเวลา" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
    );
    expect(getDormitoryStatistics).toHaveBeenCalledTimes(callsBeforeSubmit);
  });

  it("test_AC_STAT_05_downloads_csv_for_selected_range", async () => {
    getDormitoryStatistics.mockResolvedValue({
      empty_data: false,
      summary: {
        vacant_rooms: 4,
        occupied_rooms: 6,
        detail_page_views: 8,
        appointments_count: 2,
      },
      date_range: {
        start_date: "2026-01-01",
        end_date: "2026-01-07",
        detail_page_views: 8,
        appointments_count: 2,
      },
    });
    downloadDormitoryStatisticsReport.mockResolvedValue(new Blob(["csv"]));
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:test-report");
    URL.revokeObjectURL = vi.fn();

    try {
      render(
        <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
          <App />
        </MemoryRouter>,
      );
      await screen.findByRole("heading", { name: "กราฟสรุป" });
      fireEvent.click(screen.getByRole("button", { name: "ดาวน์โหลดรายงาน CSV" }));

      await waitFor(() => {
        expect(downloadDormitoryStatisticsReport).toHaveBeenCalledWith({
          dormitoryId: "dorm-approved-verified",
          startDate: expect.any(String),
          endDate: expect.any(String),
        });
      });
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    } finally {
      anchorClick.mockRestore();
      if (originalCreateObjectURL) {
        URL.createObjectURL = originalCreateObjectURL;
      } else {
        delete URL.createObjectURL;
      }
      if (originalRevokeObjectURL) {
        URL.revokeObjectURL = originalRevokeObjectURL;
      } else {
        delete URL.revokeObjectURL;
      }
    }
  });

  it("test_NFR_PERF_01_statistics_render_within_three_seconds", async () => {
    getDormitoryStatistics
      .mockResolvedValueOnce({
        empty_data: false,
        summary: {
          vacant_rooms: 4,
          occupied_rooms: 6,
          detail_page_views: 8,
          appointments_count: 2,
        },
        date_range: {
          start_date: "2026-01-01",
          end_date: "2026-01-07",
          detail_page_views: 8,
          appointments_count: 2,
        },
      })
      .mockResolvedValueOnce({
        empty_data: false,
        summary: {
          vacant_rooms: 4,
          occupied_rooms: 6,
          detail_page_views: 31,
          appointments_count: 7,
        },
        date_range: {
          start_date: "2026-01-08",
          end_date: "2026-01-14",
          detail_page_views: 31,
          appointments_count: 7,
        },
      });

    render(
      <MemoryRouter initialEntries={["/dorms/dorm-approved-verified/statistics"]}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "กราฟสรุป" });
    fireEvent.change(screen.getByLabelText("วันที่เริ่มต้น"), {
      target: { value: "2026-01-08" },
    });
    fireEvent.change(screen.getByLabelText("วันที่สิ้นสุด"), {
      target: { value: "2026-01-14" },
    });

    const startedAt = performance.now();
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันช่วงเวลา" }));
    await screen.findAllByText("31");
    const elapsedMilliseconds = performance.now() - startedAt;

    expect(elapsedMilliseconds).toBeLessThanOrEqual(3000);
    expect(getDormitoryStatistics).toHaveBeenLastCalledWith({
      dormitoryId: "dorm-approved-verified",
      startDate: "2026-01-08",
      endDate: "2026-01-14",
    });
  });
});
