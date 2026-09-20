# แผนทางเทคนิค: แจ้งซ่อมและรายงานปัญหา (Report Repair & Issues)

อ้างอิง: `specs/010-report-repair/spec.md`  
Spec ID: `SPEC-REP-010` | Status: `Draft v2`

## 1. สรุปแนวทาง
1. สร้างหน้าฟอร์มแจ้งซ่อมสำหรับ Resident รองรับ Responsive ตาม `CON-UI-01` และดึง `room_id` จาก Token ผู้ใช้ตาม `ASM-01`
2. สร้าง Validation ตรวจสอบข้อมูลบังคับกรอกและไฟล์ภาพ (จำกัด 5MB, .jpg/.png) ตาม `FR-REP-04`, `FR-REP-05`, `ASM-03`
3. สร้าง API บันทึกข้อมูลและอัปโหลดไฟล์ผ่าน HTTPS ตาม `FR-REP-06`, `NFR-SEC-01`
4. จัดการปุ่มยกเลิกให้กลับไปหน้าก่อนหน้าโดยไม่บันทึกข้อมูลตาม `FR-REP-03`
5. ตอบผลสำเร็จพร้อมตั้งสถานะเป็น "รอดำเนินการ" ภายใน 2 วินาที ตาม `FR-REP-06`, `ASM-02`, `NFR-PERF-01`

## 2. เทคโนโลยีที่ใช้
| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | สร้างฟอร์ม UI และการจัดการ State / Validation |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | สร้าง API รับข้อมูล Multipart/form-data |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | เก็บข้อมูลการซ่อมโยงกับตารางห้องพักและผู้ใช้งาน |
| Cloud Storage / Local Secure Folder | ทีมเลือกเอง ไม่ได้มาจาก spec | เก็บไฟล์ภาพอย่างปลอดภัยและจำกัดสิทธิ์ตาม `NFR-SEC-01` |
| HTTPS (TLS 1.2 ขึ้นไป) | `NFR-SEC-01` | ใช้รับส่งข้อมูลไฟล์และฟอร์มทั้งหมด |

## 3. โมเดลข้อมูล
| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `RepairRequest` | `id`, `resident_id`, `room_id`, `issue_type`, `description`, `status`, `created_at` | `FR-REP-01`, `FR-REP-06`, `ASM-01`, `ASM-02` |
| `RepairImage` | `id`, `repair_request_id`, `image_url` | `FR-REP-02`, `NFR-SEC-01` |

กติกาข้อมูล:
- บังคับผูก `resident_id` และ `room_id` จาก Token ของ Session เสมอ ไม่รับจาก Client โดยตรง (`CON-SYS-01`, `ASM-01`)
- ค่าเริ่มต้นของ `status` บันทึกเป็น `Pending` (`ASM-02`)

## 4. API / หน้าจอ
- `POST /api/repairs` — รับข้อมูล FormData (ประเภทปัญหา, รายละเอียด, รูปภาพ), ตรวจขนาด/นามสกุลไฟล์, บันทึกลงฐานข้อมูล, และส่งผลสถานะตาม `FR-REP-01` ถึง `FR-REP-06`
- หน้าจอ `/repairs/new` — แสดงฟอร์มแจ้งซ่อม, Inline Validation ขนาดไฟล์, ปุ่มยืนยันและปุ่มยกเลิกตาม `FR-REP-01`, `FR-REP-03`, `FR-REP-04`
- หน้าจอ UI/UX — แสดงข้อความแจ้งเตือนใต้ช่องข้อมูลที่กรอกผิด หรือแจ้งอัปโหลดไฟล์ล้มเหลวตาม `NFR-USE-01` และ `FR-REP-05`

## 5. ตารางตรวจ Constraints
| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-SYS-01` | API `POST /api/repairs` ต้องมี Middleware เช็ค Token และดึง Role `Resident` | ใช้แล้ว |
| `CON-UI-01` | หน้าจอ `/repairs/new` ใช้หลักการ Responsive Design | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria
| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-REP-01` | `test_AC_REP_01_submit_valid_form` | ส่งข้อมูลครบด้วย Token Resident ตรวจสอบรหัส 201 และข้อมูลผูกกับห้องถูกต้อง |
| `AC-REP-02` | `test_AC_REP_02_upload_valid_image_secure` | อัปโหลด .png 2MB ตรวจว่าไฟล์ถูกบันทึกผ่าน HTTPS และ Storage ไม่เป็น Public access |
| `AC-REP-03` | `test_AC_REP_03_missing_required_fields` | ส่งฟอร์มเปล่า ตรวจว่าระบบแจ้งเตือนที่ช่องบังคับกรอกและไม่มีการบันทึก |
| `AC-REP-04` | `test_AC_REP_04_reject_invalid_image` | อัปโหลด .pdf หรือภาพขนาด 6MB ตรวจว่าระบบตีกลับ 400 Bad Request |
| `AC-REP-05` | `test_AC_REP_05_cancel_form_navigation` | จำลองการกดปุ่มยกเลิก ตรวจ History ว่า Navigate กลับหน้าที่แล้ว |
| `AC-REP-06` | `test_AC_REP_06_response_p95_under_2_seconds` | วัดเวลา Response ของ API บันทึกซ่อม ภายใต้สภาวะปกติ ตรวจค่า p95 <= 2 วินาที |

การทดสอบเพิ่มเติมที่ผูกกับข้อกำหนด:
- ทดสอบ Responsive ที่ขนาดหน้าจอโทรศัพท์ แท็บเล็ต และเดสก์ท็อป ตาม `CON-UI-01`
- ทดสอบการดึง `room_id` อัตโนมัติจาก Token แทนพารามิเตอร์ ตาม `ASM-01`

## 7. ลำดับงาน
1. สร้างโมเดล `RepairRequest` และ `RepairImage` ในฐานข้อมูล
2. สร้าง Endpoint `POST /api/repairs` และ Middleware ตรวจสอบ Auth/Role ตาม `CON-SYS-01`, `ASM-01`
3. เพิ่ม Logic ตรวจสอบชนิดไฟล์ (MIME Type) และข้อจำกัด 5MB ตาม `FR-REP-05`, `ASM-03`
4. เชื่อมต่อระบบ File Storage แบบเข้ารหัสผ่าน HTTPS ตาม `NFR-SEC-01`
5. พัฒนาหน้าฟอร์ม `/repairs/new` ด้วย React พร้อมทำ Inline Validation ตาม `FR-REP-01`, `FR-REP-04`, `NFR-USE-01`
6. เชื่อม Action ปุ่มยกเลิก และแจ้งเตือนสถานะสำเร็จ/ล้มเหลวตาม `FR-REP-03`, `FR-REP-06`
7. รันทดสอบ `AC-REP-01` ถึง `AC-REP-06` รวมทั้ง Performance Test

## 8. สิ่งที่ยังไม่ทำ
Spec ฉบับนี้ไม่มีรายการ Q-xx ในหัวข้อ Open Questions เนื่องจากถูกแปลงเป็น `ASM-01` ถึง `ASM-04` หมดแล้ว
ยังไม่สร้างสิ่งต่อไปนี้ตาม Out of scope:
- ฟีเจอร์อัปเดตสถานะจากฝั่งช่าง/เจ้าของหอ (คาดว่าเป็น UC ถัดไป)
- ระบบออกใบเสร็จหรือเก็บเงินค่าซ่อมแซม