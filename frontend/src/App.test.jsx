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
  getDormitoryDetail,
  getRecommendedDormitories,
  searchDormitories,
} from "./api/dormApi.js";

vi.mock("./api/dormApi.js", () => ({
  getDormitoryDetail: vi.fn(),
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
});
