// รองรับ FR-DOR-01, FR-DOR-02 และ CON-ACC-01
export async function searchDormitories(filters = {}) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.dormitoryType) params.set("dormitory_type", filters.dormitoryType);
  if (filters.minPrice !== "") params.set("min_price", filters.minPrice);
  if (filters.maxPrice !== "") params.set("max_price", filters.maxPrice);

  const query = params.toString();
  const response = await fetch(`/dormitories${query ? `?${query}` : ""}`);
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดรายการหอพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("รูปแบบข้อมูลรายการหอพักไม่ถูกต้อง");
  }
  return data;
}

// รองรับ FR-DOR-07, CON-BUS-01 และ ASM-05
export async function getRecommendedDormitories(filters = {}) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.minPrice !== "") params.set("min_price", filters.minPrice);
  if (filters.maxPrice !== "") params.set("max_price", filters.maxPrice);

  const query = params.toString();
  const response = await fetch(
    `/dormitories/recommendations${query ? `?${query}` : ""}`,
  );
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดรายการหอพักแนะนำได้ (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("รูปแบบข้อมูลรายการหอพักแนะนำไม่ถูกต้อง");
  }
  return data;
}

// รองรับ FR-DOR-03, FR-DOR-04, FR-DOR-05 และ CON-ACC-01
export async function getDormitoryDetail(dormitoryId) {
  const response = await fetch(
    `/dormitories/${encodeURIComponent(dormitoryId)}`,
  );
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลหอพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (!data || typeof data !== "object" || !Array.isArray(data.rooms)) {
    throw new Error("รูปแบบข้อมูลรายละเอียดหอพักไม่ถูกต้อง");
  }
  return data;
}
