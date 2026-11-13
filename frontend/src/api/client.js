// รองรับ CON-ACC-01 และ CON-AUTH-01; ตัวตนจำลองตามมติทีมจนกว่า 007 จะพร้อม
const prototypeOwnerHeaders = { "X-Owner-Id": "owner-1" };

const dormitoryFieldLabels = {
  name: "ชื่อหอพัก",
  location: "ที่อยู่/ทำเล",
  type: "ประเภทหอพัก",
  contact_info: "ช่องทางติดต่อ",
  amenities: "สิ่งอำนวยความสะดวก",
  rules: "กฎระเบียบ",
};

const requiredFieldLabels = {
  name: "ชื่อหอพัก",
  location: "ที่อยู่/ทำเล",
  type: "ประเภทหอพัก",
  contact_info: "ช่องทางติดต่อ",
};

// รองรับ FR-DOR-13, FR-DOR-17 และ AC-DOR-09
export class OwnerDormitoryValidationError extends Error {
  constructor(fieldErrors) {
    super("กรุณาตรวจสอบข้อมูลที่กรอก");
    this.name = "OwnerDormitoryValidationError";
    this.fieldErrors = fieldErrors;
  }
}

// รองรับ FR-DOR-13, FR-DOR-17 และ AC-DOR-09
function parseDormitoryFieldErrors(payload) {
  if (!Array.isArray(payload?.detail)) return null;

  const fieldErrors = {};
  for (const detail of payload.detail) {
    const field =
      Array.isArray(detail?.loc) && detail.loc[0] === "body"
        ? detail.loc[1]
        : null;
    if (
      typeof field !== "string" ||
      !Object.prototype.hasOwnProperty.call(dormitoryFieldLabels, field)
    ) {
      continue;
    }

    const isRequiredFieldError =
      Object.prototype.hasOwnProperty.call(requiredFieldLabels, field) &&
      ["missing", "string_too_short"].includes(detail.type);
    const message = isRequiredFieldError
      ? `กรุณากรอก${requiredFieldLabels[field]}`
      : detail.msg;
    if (typeof message !== "string" || !message.trim()) return null;
    fieldErrors[field] = message;
  }
  return fieldErrors;
}

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

// รองรับ CON-DATA-01, CON-BUS-01, FR-DOR-10, FR-DOR-13, FR-DOR-15 และ FR-DOR-17
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
    if (response.status === 422) {
      const payload = await response.json();
      const fieldErrors = parseDormitoryFieldErrors(payload);
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        throw new OwnerDormitoryValidationError(fieldErrors);
      }
    }
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

// รองรับ CON-ACC-01, CON-DATA-01, CON-BUS-01, FR-DOR-10, FR-DOR-13,
// FR-DOR-15 และ FR-DOR-17
export async function createOwnerDormitory(dormitory) {
  return saveOwnerDormitory("/owners/dormitories", "POST", dormitory);
}

// รองรับ CON-ACC-01, CON-AUTH-01, CON-BUS-01, FR-DOR-12, FR-DOR-13,
// FR-DOR-15 และ FR-DOR-17
export async function updateOwnerDormitory(dormitoryId, dormitory) {
  return saveOwnerDormitory(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}`,
    "PUT",
    dormitory,
  );
}

// รองรับ CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
async function uploadOwnerImages(path, files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(path, {
    method: "POST",
    headers: prototypeOwnerHeaders,
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้ (${response.status})`);
  }

  const data = await response.json();
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.accepted) ||
    !Array.isArray(data.rejected) ||
    data.accepted.some(
      (image) =>
        !image ||
        typeof image !== "object" ||
        typeof image.image_id !== "string" ||
        typeof image.filename !== "string" ||
        typeof image.file_type !== "string" ||
        typeof image.file_size_bytes !== "number",
    ) ||
    data.rejected.some(
      (image) =>
        !image ||
        typeof image !== "object" ||
        typeof image.filename !== "string" ||
        typeof image.reason !== "string",
    )
  ) {
    throw new Error("รูปแบบผลการอัปโหลดรูปภาพไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-AUTH-01, CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
export async function uploadOwnerDormitoryImages(dormitoryId, files) {
  return uploadOwnerImages(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/images`,
    files,
  );
}

// รองรับ CON-AUTH-01, FR-DOR-12, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
export async function uploadOwnerRoomImages(dormitoryId, roomId, files) {
  return uploadOwnerImages(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms/${encodeURIComponent(roomId)}/images`,
    files,
  );
}

// รองรับ CON-AUTH-01, CON-FILE-01 และ FR-DOR-12
async function getOwnerImages(path) {
  const response = await fetch(path, { headers: prototypeOwnerHeaders });
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดรูปภาพที่บันทึกแล้วได้ (${response.status})`);
  }

  const data = await response.json();
  if (
    !Array.isArray(data) ||
    data.some(
      (image) =>
        !image ||
        typeof image !== "object" ||
        typeof image.image_id !== "string" ||
        typeof image.file_type !== "string" ||
        typeof image.file_size_bytes !== "number" ||
        typeof image.approval_status !== "string",
    )
  ) {
    throw new Error("รูปแบบรายการรูปภาพที่บันทึกแล้วไม่ถูกต้อง");
  }
  return data;
}

// รองรับ CON-AUTH-01 และ FR-DOR-12
async function getOwnerImage(path) {
  const response = await fetch(path, { headers: prototypeOwnerHeaders });
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดรูปภาพได้ (${response.status})`);
  }
  return response.blob();
}

// รองรับ CON-AUTH-01 และ FR-DOR-12
async function deleteOwnerImage(path) {
  const response = await fetch(path, {
    method: "DELETE",
    headers: prototypeOwnerHeaders,
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถลบรูปภาพได้ (${response.status})`);
  }
}

// รองรับ CON-AUTH-01, CON-FILE-01 และ FR-DOR-12
export async function getOwnerDormitoryImages(dormitoryId) {
  return getOwnerImages(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/images`,
  );
}

// รองรับ CON-AUTH-01, CON-FILE-01 และ FR-DOR-12
export async function getOwnerRoomImages(dormitoryId, roomId) {
  return getOwnerImages(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms/${encodeURIComponent(roomId)}/images`,
  );
}

// รองรับ CON-AUTH-01 และ FR-DOR-12
export async function getOwnerDormitoryImage(dormitoryId, imageId) {
  return getOwnerImage(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/images/${encodeURIComponent(imageId)}`,
  );
}

// รองรับ CON-AUTH-01 และ FR-DOR-12
export async function getOwnerRoomImage(dormitoryId, roomId, imageId) {
  return getOwnerImage(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms/${encodeURIComponent(roomId)}/images/${encodeURIComponent(imageId)}`,
  );
}

// รองรับ CON-AUTH-01 และ FR-DOR-12
export async function deleteOwnerDormitoryImage(dormitoryId, imageId) {
  return deleteOwnerImage(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/images/${encodeURIComponent(imageId)}`,
  );
}

// รองรับ CON-AUTH-01 และ FR-DOR-12
export async function deleteOwnerRoomImage(dormitoryId, roomId, imageId) {
  return deleteOwnerImage(
    `/owners/dormitories/${encodeURIComponent(dormitoryId)}/rooms/${encodeURIComponent(roomId)}/images/${encodeURIComponent(imageId)}`,
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
  if (response.status === 422) {
    // รองรับ CON-DATA-01, FR-DOR-13 และ AC-DOR-09 (ASM-21)
    throw new Error("ราคาค่าเช่าต่อห้องต่อเดือนต้องเป็นตัวเลขมากกว่า 0");
  }
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

// รองรับ FR-DOR-03, FR-DOR-04, FR-DOR-05, CON-ACC-01, NFR-DATA-02 และ AC-DOR-12
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
export async function getDormitoryStatistics({ dormitoryId, startDate, endDate }) {
  const params = new URLSearchParams({
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
  startDate,
  endDate,
}) {
  const params = new URLSearchParams({
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
