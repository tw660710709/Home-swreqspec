# แผนทางเทคนิค: แจ้งซ่อมและรายงานปัญหา (Report Repair & Issues)

อ้างอิง: `specs/010-report-repair/spec.md`  
Spec ID: `SPEC-REP-010` | Status: `Draft v2`

## 1. สรุปแนวทาง
1. สร้างหน้าจอแจ้งซ่อม `/repairs/new` ด้วย React รองรับ Responsive (375px, 768px, 1280px) ตาม `CON-UI-01` พร้อมรายการแสดงสถานะแจ้งซ่อมของห้องพักด้านล่างฟอร์มตาม `FR-REP-06`, `ASM-07`
2. ตรวจสอบความครบถ้วนของข้อมูลบังคับกรอก (ประเภทปัญหา 4 หมวด, รายละเอียด 1–1,000 ตัวอักษร) และไฟล์ภาพ (`.jpg/.jpeg/.png`, <= 5MB/ไฟล์, สูงสุด 3 ไฟล์) ทั้งฝั่งหน้าจอและหลังบ้านตาม `FR-REP-04`, `FR-REP-05`, `ASM-03`, `ASM-06`
3. ตรวจสอบสิทธิ์ผู้พักอาศัยผ่าน Header `X-Resident-Id` และดึง `room_id` จากฐานข้อมูลอัตโนมัติตาม `CON-SYS-01`, `ASM-01`, `ASM-05`
4. บันทึกข้อมูลการแจ้งซ่อมและรูปภาพภายใต้ Database Transaction เดียวกัน พร้อมจัดเก็บไฟล์ภาพในโฟลเดอร์เซิร์ฟเวอร์แบบ Non-public และกำหนดสถานะเริ่มต้นเป็น `Pending` ตาม `FR-REP-06`, `NFR-SEC-01`, `ASM-02`, `ASM-08`
5. จัดการปุ่มยกเลิกให้กลับสู่หน้าก่อนหน้า (หรือ `/`) โดยไม่บันทึกข้อมูลตาม `FR-REP-03` และควบคุมเวลาตอบสนองให้อยู่ในเกณฑ์ p95 <= 2 วินาทีตาม `NFR-PERF-01`

## 2. เทคโนโลยีที่ใช้
| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้โครงสร้างหลักของ `frontend/` สร้างฟอร์ม UI, Inline Validation และหน้ารายการสถานะ |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้โครงสร้างหลักของ `backend/app/` สร้าง REST API รับ `multipart/form-data` |
| SQLite (SQLAlchemy / Python sqlite3) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ตามไฟล์ `backend/app/database.py` และ `models.py` ของโปรเจกต์ รองรับ Transaction |
| Local Non-public Upload Directory + Authorized File Endpoint | `NFR-SEC-01` | เก็บไฟล์ภาพนอก Static Public Folder และตรวจสิทธิ์ผ่าน API ก่อนส่งไฟล์ภาพกลับ |
| HTTPS (TLS 1.2 ขึ้นไป) | `NFR-SEC-01` | ใช้สำหรับการรับส่งข้อมูลและไฟล์ภาพเมื่อ Deploy บนเซิร์ฟเวอร์จริง |

## 3. โมเดลข้อมูล

### 3.1 `RepairRequest` (ตาราง `repair_requests`)
| ฟิลด์หลัก | ประเภท | คำอธิบาย | รองรับ |
|---|---|---|---|
| `id` | Integer (PK) | รหัสรายการแจ้งซ่อม | `FR-REP-06` |
| `resident_id` | Integer / String (FK) | รหัสผู้พักอาศัย (ดึงจาก `X-Resident-Id`) | `CON-SYS-01`, `ASM-01`, `ASM-05` |
| `room_id` | Integer / String (FK) | รหัสห้องพักของผู้พักอาศัย (ดึงอัตโนมัติจากสิทธิ์ห้องพัก) | `CON-SYS-01`, `ASM-01` |
| `issue_type` | String | ประเภทปัญหา (`ไฟฟ้า`, `ประปา`, `เฟอร์นิเจอร์/อุปกรณ์`, `อื่นๆ`) | `FR-REP-01`, `ASM-06` |
| `description` | Text | รายละเอียดปัญหา (1–1,000 ตัวอักษร) | `FR-REP-01`, `FR-REP-04`, `ASM-06` |
| `status` | String | สถานะการซ่อม ค่าเริ่มต้นคือ `Pending` (แสดงผล "รอดำเนินการ") | `FR-REP-06`, `ASM-02` |
| `created_at` | DateTime | วันเวลาที่บันทึกแจ้งซ่อม | `FR-REP-06` |

### 3.2 `RepairImage` (ตาราง `repair_images`)
| ฟิลด์หลัก | ประเภท | คำอธิบาย | รองรับ |
|---|---|---|---|
| `id` | Integer (PK) | รหัสรูปภาพ | `FR-REP-02` |
| `repair_request_id` | Integer (FK) | อ้างอิง `RepairRequest.id` | `FR-REP-02`, `ASM-08` |
| `file_name` | String | ชื่อไฟล์ที่จัดเก็บบนเซิร์ฟเวอร์ | `FR-REP-02`, `NFR-SEC-01` |
| `mime_type` | String | ชนิดไฟล์ (`image/jpeg`, `image/png`) | `FR-REP-05`, `ASM-03` |
| `file_size` | Integer | ขนาดไฟล์ (bytes) ไม่เกิน `MAX_REPAIR_IMAGE_SIZE_BYTES` | `FR-REP-05`, `ASM-03` |
| `created_at` | DateTime | วันเวลาที่อัปโหลด | `FR-REP-02` |

กติกาข้อมูล:
- บังคับผูก `resident_id` และ `room_id` จากข้อมูลผู้ใช้ที่ผ่านการตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์เสมอ ห้ามรับ `room_id` จาก Request Body (`CON-SYS-01`, `ASM-01`)
- บันทึกข้อมูลลง `repair_requests` และ `repair_images` ภายใน Database Transaction เดียวกัน หากบันทึกไฟล์หรือฐานข้อมูลไม่สำเร็จให้ Rollback และลบไฟล์ที่สร้างขึ้น (`FR-REP-05`, `ASM-08`)

## 4. API / หน้าจอ

### 4.1 API Endpoints (`backend/app/repairs.py` เชื่อมกับ `main.py`)
- `POST /api/repairs` — รับ `multipart/form-data` (`issue_type`, `description`, `images[]`) และ Header `X-Resident-Id`, ตรวจสอบสิทธิ์ห้องพัก, ตรวจข้อมูลและไฟล์ภาพ, บันทึกข้อมูลใน Transaction และส่งคืน `201 Created` พร้อมข้อมูลรายการซ่อมสถานะ `Pending` (รองรับ `FR-REP-01`, `FR-REP-02`, `FR-REP-04`, `FR-REP-05`, `FR-REP-06`, `CON-SYS-01`)
- `GET /api/repairs` — รับ Header `X-Resident-Id` และส่งคืนรายการแจ้งซ่อมทั้งหมดของห้องพักผู้ใช้นั้นเรียงจากล่าสุดไปเก่าสุด พร้อมสถานะปัจจุบัน (รองรับ `FR-REP-06`, `CON-SYS-01`, `ASM-07`)
- `GET /api/repairs/{repair_id}/images/{image_id}` — ตรวจสอบสิทธิ์ว่าผู้เรียกเป็น Resident เจ้าของรายการซ่อมนั้น, เจ้าของหอพักของหอนั้น หรือ Admin ก่อนส่งไฟล์ภาพกลับแบบ Restricted Access (รองรับ `NFR-SEC-01`)

### 4.2 หน้าจอ (`frontend/src/pages/ReportRepairPage.jsx`)
- `ReportRepairPage` (`/repairs/new`, ไม่มี mockup ทีมออกแบบเอง) — แสดงแบบฟอร์มเลือกประเภทปัญหา, กรอกรายละเอียด, แนบไฟล์ภาพสูงสุด 3 รูป, Inline/Submit Validation, ปุ่มยืนยัน, ปุ่มยกเลิก (กลับหน้าก่อนหน้าหรือ `/`), ข้อความแจ้งเตือน และรายการประวัติแจ้งซ่อมพร้อมสถานะของห้องพักด้านล่างฟอร์ม รองรับ Responsive 375px / 768px / 1280px (รองรับ `FR-REP-01` ถึง `FR-REP-06`, `CON-UI-01`, `NFR-USE-01`)

## 5. ตารางตรวจ Constraints

### 5.1 การนำ Constraints ไปใช้
| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-SYS-01` | ฟังก์ชันตรวจสอบสิทธิ์ `get_current_resident` ใน `backend/app/repairs.py` ตรวจ `X-Resident-Id` และสิทธิ์ห้องพักก่อนเข้าถึง `POST /api/repairs` และ `GET /api/repairs` | ใช้แล้ว |
| `CON-UI-01` | สไตล์และ Layout ของ `frontend/src/pages/ReportRepairPage.jsx` รองรับความกว้างหน้าจอ `375px`, `768px`, `1280px` | ใช้แล้ว |

### 5.2 ค่าที่ตั้งได้ (Configurable Values)
| ค่า | มาจาก ID | ชื่อตัวแปรและไฟล์ |
|---|---|---|
| ประเภทปัญหา 4 หมวด (`ไฟฟ้า`, `ประปา`, `เฟอร์นิเจอร์/อุปกรณ์`, `อื่นๆ`) | `FR-REP-01`, `ASM-06` | `REPAIR_ISSUE_TYPES` ใน `backend/app/config.py` และ `frontend/src/config.js` |
| ความยาวรายละเอียดปัญหาขั้นต่ำ 1 และสูงสุด 1,000 ตัวอักษร | `FR-REP-01`, `FR-REP-04`, `ASM-06` | `REPAIR_DESC_MIN_LENGTH`, `REPAIR_DESC_MAX_LENGTH` ใน `backend/app/config.py` และ `frontend/src/config.js` |
| จำนวนรูปภาพสูงสุด 3 รูปต่อรายการ | `FR-REP-02`, `FR-REP-05`, `ASM-03` | `MAX_REPAIR_IMAGES_PER_REQUEST` ใน `backend/app/config.py` และ `frontend/src/config.js` |
| ขนาดไฟล์รูปภาพสูงสุด 5MB (`5 * 1024 * 1024` bytes) | `FR-REP-05`, `ASM-03` | `MAX_REPAIR_IMAGE_SIZE_BYTES` ใน `backend/app/config.py` และ `frontend/src/config.js` |
| นามสกุลและชนิดไฟล์ภาพที่รองรับ (`.jpg`, `.jpeg`, `.png` / `image/jpeg`, `image/png`) | `FR-REP-05`, `ASM-03` | `ALLOWED_REPAIR_IMAGE_EXTENSIONS`, `ALLOWED_REPAIR_IMAGE_MIME_TYPES` ใน `backend/app/config.py` และ `frontend/src/config.js` |
| สถานะเริ่มต้น `Pending` | `FR-REP-06`, `ASM-02` | `REPAIR_DEFAULT_STATUS` ใน `backend/app/config.py` |
| เกณฑ์เวลาตอบสนองสูงสุด 2.0 วินาที (p95) | `NFR-PERF-01`, `AC-REP-06` | `REPAIR_API_MAX_RESPONSE_SECONDS` ใน `backend/app/config.py` |
| Breakpoints หน้าจอ Responsive (`375`, `768`, `1280`) | `CON-UI-01` | `RESPONSIVE_BREAKPOINTS` ใน `frontend/src/config.js` |

## 6. แผนทดสอบจาก Acceptance Criteria
| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-REP-01` | `test_AC_REP_01_submit_valid_repair_request` | ส่งข้อมูลครบถ้วนด้วย `X-Resident-Id` ที่มีสิทธิ์ห้องพัก ตรวจสถานะ `201`, สถานะรายการเป็น `Pending`, ข้อมูลผูกกับ `resident_id` และ `room_id` ถูกต้อง และตรวจการแสดงผลหน้าจอ Responsive (`375px`, `768px`, `1280px`) |
| `AC-REP-02` | `test_AC_REP_02_upload_valid_images_and_access_control` | อัปโหลดรูป `.jpg`/`.png` ขนาดไม่เกิน 5MB (1–3 รูป) ตรวจว่าบันทึกสำเร็จ เรียกดูภาพผ่าน Endpoint ได้เมื่อมีสิทธิ์ และถูกปฏิเสธ (`403`) เมื่อผู้ไม่มีสิทธิ์เรียกดู |
| `AC-REP-03` | `test_AC_REP_03_missing_or_invalid_required_fields` | ส่งฟอร์มโดยไม่เลือกประเภทปัญหาหรือเว้นว่างรายละเอียด ตรวจว่าระบบปฏิเสธการบันทึก (`400`/`422`) และหน้าจอแสดงข้อความแจ้งเตือนใต้ช่องข้อมูลที่เกี่ยวข้อง |
| `AC-REP-04` | `test_AC_REP_04_reject_invalid_image_or_save_failure` | อัปโหลดไฟล์ `.pdf`, ไฟล์ขนาดเกิน 5MB, อัปโหลดเกิน 3 รูป และจำลองข้อผิดพลาดขณะบันทึก ตรวจว่าระบบปฏิเสธ แจ้งเตือน และไม่มีข้อมูลค้างในฐานข้อมูลหรือโฟลเดอร์ไฟล์ |
| `AC-REP-05` | `test_AC_REP_05_cancel_form_navigation` | จำลองการกรอกข้อมูลบนหน้าฟอร์มแล้วกดปุ่ม "ยกเลิก" ตรวจว่าไม่มีการยิง API บันทึกข้อมูล และเปลี่ยนเส้นทางกลับหน้าก่อนหน้า (หรือ `/`) |
| `AC-REP-06` | `test_AC_REP_06_response_p95_under_2_seconds` | ทดสอบเรียก `POST /api/repairs` หลายรอบในสภาวะปกติ และคำนวณค่า p95 ของเวลาตอบสนองว่าต้องไม่เกิน 2.0 วินาที |

## 7. ลำดับงาน
1. เพิ่มค่าคงที่ของฟีเจอร์แจ้งซ่อมใน `backend/app/config.py` และ `frontend/src/config.js` (`FR-REP-01` ถึง `FR-REP-06`, `NFR-PERF-01`, `CON-UI-01`)
2. สร้างตาราง/โมเดล `RepairRequest` และ `RepairImage` ใน `backend/app/models.py` และเชื่อมฐานข้อมูลใน `database.py` (`FR-REP-01`, `FR-REP-02`, `FR-REP-06`)
3. สร้างฟังก์ชันตรวจสอบสิทธิ์ผู้พักอาศัย (`X-Resident-Id`) และดึง `room_id` อัตโนมัติใน `backend/app/repairs.py` (`CON-SYS-01`, `ASM-01`, `ASM-05`)
4. สร้าง Endpoint `POST /api/repairs` พร้อม Validation ข้อมูลและไฟล์ภาพ และการบันทึกแบบ Transaction (`FR-REP-01` ถึง `FR-REP-06`, `AC-REP-01` ถึง `AC-REP-04`)
5. สร้าง Endpoint `GET /api/repairs` และ `GET /api/repairs/{repair_id}/images/{image_id}` พร้อมการจำกัดสิทธิ์เข้าถึงไฟล์ภาพ (`FR-REP-06`, `NFR-SEC-01`, `AC-REP-02`)
6. พัฒนาหน้าจอ `frontend/src/pages/ReportRepairPage.jsx` และเชื่อมต่อ API Client (`frontend/src/api/`) พร้อม Inline Validation, ปุ่มยกเลิก, รายการสถานะซ่อม และ Responsive Layout (`FR-REP-01` ถึง `FR-REP-06`, `CON-UI-01`, `NFR-USE-01`, `AC-REP-03`, `AC-REP-05`)
7. เขียนและรันชุดทดสอบอัตโนมัติทั้งฝั่ง Backend (`pytest`) และ Frontend (`vitest`) ครบทุก `AC-REP-01` ถึง `AC-REP-06`

## 8. สิ่งที่ยังไม่ทำ
- Open Questions: ไม่มีในขอบเขตของ UC-10 ณ เวอร์ชันนี้
- สิ่งที่อยู่ใน Out of scope (ไม่สร้างในฟีเจอร์นี้):
  - การจัดการและอัปเดตสถานะการซ่อมโดยเจ้าของหอพักหรือช่างซ่อม
  - การประเมินความพึงพอใจหลังการซ่อมแซม
  - การออกใบเสร็จหรือเก็บค่าใช้จ่ายเพิ่มเติมจากการซ่อมแซม