// รองรับ CON-ACC-01 และ CON-AUTH-01; ตัวตนจำลองตามมติทีมจนกว่า 007 จะพร้อม
const prototypeOwnerHeaders = { "X-Owner-Id": "owner-1" };

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

// รองรับ CON-ACC-01, CON-AUTH-01, FR-DOR-09 และ AC-DOR-07
export async function getOwnerDormitories() {
  const response = await fetch("/owners/dormitories", {
    headers: prototypeOwnerHeaders,
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดรายการหอพักของเจ้าของได้ (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("รูปแบบข้อมูลรายการหอพักของเจ้าของไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-ACC-01, CON-AUTH-01, FR-DOR-11 และ AC-DOR-07
export async function getOwnerDormitory(dormitoryId) {
  const response = await fetch(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}`,
    { headers: prototypeOwnerHeaders },
  );
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลหอพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("รูปแบบข้อมูลหอพักไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-DATA-01, CON-BUS-01, FR-DOR-10 และ FR-DOR-15
async function saveOwnerDormitory(path, method, dormitory) {
  const response = await fetch(path, {
    method,
    headers: {
      ...prototypeOwnerHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dormitory),
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถบันทึกข้อมูลหอพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data.dormitory_id !== "string"
  ) {
    throw new Error("รูปแบบข้อมูลหอพักที่บันทึกไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-ACC-01, CON-DATA-01, CON-BUS-01, FR-DOR-10 และ FR-DOR-15
export async function createOwnerDormitory(dormitory) {
  return saveOwnerDormitory("/owners/dormitories", "POST", dormitory);
}

// รองรับ CON-ACC-01, CON-AUTH-01, CON-BUS-01, FR-DOR-12 และ FR-DOR-15
export async function updateOwnerDormitory(dormitoryId, dormitory) {
  return saveOwnerDormitory(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}`,
    "PUT",
    dormitory,
  );
}

// รองรับ CON-AUTH-01, FR-DOR-12 และ ASM-17
export async function getOwnerDormitoryRooms(dormitoryId) {
  const response = await fetch(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms`,
    { headers: prototypeOwnerHeaders },
  );
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลห้องพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (
    !Array.isArray(data) ||
    data.some(
      (room) =>
        !room ||
        typeof room !== "object" ||
        typeof room.room_id !== "string" ||
        room.dormitory_id !== dormitoryId ||
        !["string", "number"].includes(typeof room.monthly_rent),
    )
  ) {
    throw new Error("รูปแบบข้อมูลห้องพักไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-16
async function saveOwnerDormitoryRoom(path, method, room) {
  const response = await fetch(path, {
    method,
    headers: {
      ...prototypeOwnerHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(room),
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถบันทึกข้อมูลห้องพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data.room_id !== "string" ||
    typeof data.dormitory_id !== "string" ||
    !["string", "number"].includes(typeof data.monthly_rent)
  ) {
    throw new Error("รูปแบบข้อมูลห้องพักที่บันทึกไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-ACC-01, CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-16
export async function createOwnerDormitoryRoom(dormitoryId, room) {
  const data = await saveOwnerDormitoryRoom(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms`,
    "POST",
    room,
  );
  if (data.dormitory_id !== dormitoryId) {
    throw new Error("ห้องพักที่บันทึกไม่เชื่อมโยงกับหอพักที่เลือก");
  }
  return data;
}

// รองรับ CON-ACC-01, CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-16
export async function updateOwnerDormitoryRoom(
  dormitoryId,
  roomId,
  room,
) {
  const data = await saveOwnerDormitoryRoom(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms/${encodeURIComponent(roomId)}`,
    "PUT",
    room,
  );
  if (data.dormitory_id !== dormitoryId || data.room_id !== roomId) {
    throw new Error("ข้อมูลห้องพักที่บันทึกไม่ตรงกับหอพักหรือห้องที่เลือก");
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

// รองรับ FR-STAT-01, FR-STAT-02, FR-STAT-04, FR-STAT-05 และ AC-STAT-01
export async function getDormitoryStatistics({ dormitoryId, ownerId, startDate, endDate }) {
  const params = new URLSearchParams({
    owner_id: ownerId,
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(
    `/dormitories/${encodeURIComponent(dormitoryId)}/statistics?${params.toString()}`,
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail?.message || `ไม่สามารถโหลดสถิติหอพักได้ (${response.status})`);
  }

  const data = await response.json();
  if (!data || typeof data !== "object" || !data.summary || !data.date_range) {
    throw new Error("รูปแบบข้อมูลสถิติหอพักไม่ถูกต้อง");
  }
  return data;
}

// รองรับ FR-STAT-07 และ AC-STAT-05
export async function downloadDormitoryStatisticsReport({
  dormitoryId,
  ownerId,
  startDate,
  endDate,
}) {
  const params = new URLSearchParams({
    owner_id: ownerId,
    start_date: startDate,
    end_date: endDate,
  });
  const response = await fetch(
    `/dormitories/${encodeURIComponent(dormitoryId)}/statistics/report?${params.toString()}`,
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      payload?.detail?.message ||
        `ไม่สามารถดาวน์โหลดรายงานสถิติได้ (${response.status})`,
    );
  }
  return response.blob();
}
