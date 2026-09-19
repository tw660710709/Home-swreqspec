# แผนทางเทคนิค: ค้นหาและดูข้อมูลหอพัก

ไฟล์ข้อกำหนดอ้างอิง: `spec.md`  
Spec ID: `SPEC-DOR-001` | สถานะข้อกำหนด: `Draft v2`

## 1. สรุปแนวทาง

1. สร้างหน้าค้นหาสาธารณะที่ Guest ใช้ค้นหาด้วยชื่อหรือทำเล และกรองตามประเภทหอพักกับช่วงราคา (`CON-ACC-01`, `FR-DOR-01`)
2. แสดงผลเฉพาะหอพักที่ Approved พร้อมสถานะห้องว่าง/เต็มและช่วงราคา Min-Max (`CON-BUS-01`, `FR-DOR-02`)
3. สร้างหน้ารายละเอียดที่แสดงข้อมูลตาม `FR-DOR-03` และ `FR-DOR-04` พร้อม Verified Badge ตาม `CON-BUS-02` และ `FR-DOR-05`
4. รองรับการล้างตัวกรอง, fallback หอพักแนะนำไม่เกิน 5 รายการ และ retry เมื่อโหลดรายละเอียดล้มเหลว (`FR-DOR-06` ถึง `FR-DOR-08`)
5. วางโครง API และการทดสอบให้ตรวจสอบ Acceptance Criteria ทุกข้อ รวมถึง p95 ไม่เกิน 3 วินาที (`NFR-PERF-01`)

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้างหน้าค้นหาและหน้ารายละเอียด รองรับ Responsive Web Design ตาม `CON-UI-01` |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้าง API สำหรับค้นหา รายละเอียด และรายการแนะนำ |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บหอพัก ห้องพัก รูปภาพ และข้อมูลรายละเอียด โดยต้องอ่านเฉพาะข้อมูลที่ Approved ตาม `CON-BUS-01` |
| HTTPS/TLS 1.2 ขึ้นไป | `NFR-SEC-01` | ตั้งค่าที่ขอบเขตการรับส่งระหว่าง Browser กับระบบ |
| เครื่องมือทดสอบของ stack ที่ทีมตั้งค่า | ทีมเลือกเอง ไม่ได้มาจาก spec | ต้องตั้งชื่อ test ตาม AC ID และทดสอบ behavior ตามข้อกำหนดเท่านั้น |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `Dormitory` | `id`, `name`, `location`, `type`, `approval_status`, `verified_status`, `security_info`, `contact_info`, `rules` | `CON-BUS-01`, `CON-BUS-02`, `FR-DOR-01`, `FR-DOR-03`, `FR-DOR-05` |
| `RoomType` | `id`, `dormitory_id`, `name`, `monthly_rent`, `water_fee`, `electricity_fee`, `deposit`, `availability_status` | `FR-DOR-01`, `FR-DOR-02`, `FR-DOR-03`, `DOM-RULE-01` |
| `DormitoryImage` | `id`, `dormitory_id`, `url`, `caption` | `FR-DOR-04`, `NFR-ACC-01` |
| `Facility` | `id`, `dormitory_id`, `name`, `distance_text` | `FR-DOR-03`, `FR-DOR-04` |
| `SearchResult` (ผลคำนวณ) | `dormitory_id`, `min_rent`, `max_rent`, `availability_status` | `FR-DOR-01`, `FR-DOR-02`, `ASM-03` |

กติกาข้อมูล:

- ทุก query สาธารณะต้องกรอง `approval_status = Approved` (`CON-BUS-01`)
- `Verified Badge` ต้องคำนวณจาก `approval_status = Approved` และ `verified_status = true` (`CON-BUS-02`, `FR-DOR-05`)
- `min_rent` และ `max_rent` คำนวณจากห้องของหอพักเดียวกัน (`ASM-03`)
- สถานะหอพักคำนวณจากสถานะห้องล่าสุด (`ASM-02`, `FR-DOR-02`)
- ข้อมูลกฎ ค่าใช้จ่าย และเงื่อนไขต้องส่งให้หน้า detail แสดงครบ (`DOM-RULE-01`, `FR-DOR-03`)

## 4. API / หน้าจอ

| รายการ | Input หลัก | Output หลัก | รองรับ |
|---|---|---|---|
| `GET /dormitories` | `q`, `dormitory_type`, `min_price`, `max_price` | รายการ Approved พร้อม `min_rent`, `max_rent`, สถานะห้อง และ badge state | `FR-DOR-01`, `FR-DOR-02`, `CON-BUS-01` |
| `GET /dormitories/{id}` | `id` | รายละเอียดราคา/ค่าใช้จ่าย/สิ่งอำนวยความสะดวก/กฎ/ความปลอดภัย/ติดต่อ/รูปภาพ/สถานที่ใกล้เคียง/badge | `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `DOM-RULE-01` |
| `GET /dormitories/recommendations` | เงื่อนไขค้นหาเดิม | หอพัก Approved ที่ทำเลหรือช่วงราคาใกล้เคียง สูงสุด 5 รายการ | `FR-DOR-07`, `ASM-05` |
| หน้าค้นหา | คำค้นหา ประเภท ช่วงราคา ปุ่มค้นหา/ล้างตัวกรอง | รายการผลลัพธ์, empty-state พร้อม recommendations, loading/error state | `FR-DOR-01`, `FR-DOR-02`, `FR-DOR-06`, `FR-DOR-07`, `NFR-USE-01` |
| หน้ารายละเอียด | `dormitory_id`, ปุ่มลองใหม่ | ข้อมูลรายละเอียด หรือข้อความผิดพลาดพร้อม retry | `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `FR-DOR-08` |

หมายเหตุ: path และชื่อฟิลด์เป็นสัญญาเชิงตรรกะสำหรับการวางแผน ทีมต้องยืนยันรายละเอียด API ก่อนลงมือสร้างจริง โดยไม่เพิ่มพฤติกรรมนอก `spec.md`

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-ACC-01` | API และหน้าค้นหา/รายละเอียดไม่ต้องมี authentication | ใช้แล้ว |
| `CON-BUS-01` | Filter Approved ในทุก query สาธารณะและโมเดล `approval_status` | ใช้แล้ว |
| `CON-BUS-02` | เงื่อนไขคำนวณ Verified Badge จาก Approved + verified status | ใช้แล้ว |
| `CON-UI-01` | React UI และแผนทดสอบ responsive ของหน้าค้นหา/รายละเอียด | ใช้แล้ว |
| `DOM-RULE-01` | ฟิลด์กฎ ค่าใช้จ่าย และเงื่อนไขใน detail response/UI | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-DOR-01` | `test_AC_DOR_01_search_female_available_dormitories` | เตรียม Approved หอพักหญิงที่มีห้องว่าง เรียกค้นหาด้วยประเภทหญิง ตรวจเฉพาะรายการหญิงและป้าย “ห้องว่าง” ตรงกับข้อมูล |
| `AC-DOR-02` | `test_AC_DOR_02_detail_verified_dormitory` | เตรียมหอพัก Approved และ Verified เปิด detail ตรวจข้อมูลทุกส่วน รูปภาพ สถานที่ใกล้เคียง และ badge |
| `AC-DOR-03` | `test_AC_DOR_03_empty_search_returns_recommendations` | ค้นหาด้วยเงื่อนไขที่ไม่มีผล ตรวจข้อความที่กำหนดและ recommendations ที่แสดงเป็นทางเลือก ไม่เกิน 5 รายการ |
| `AC-DOR-04` | `test_AC_DOR_04_clear_filter_loads_all_dormitories` | ตั้ง filter แล้วกด Clear Filter ตรวจว่า filter กลับค่าเริ่มต้นและรายการ Approved ทั้งหมดถูกโหลด |
| `AC-DOR-05` | `test_AC_DOR_05_detail_load_error_has_retry` | จำลองฐานข้อมูลล้มเหลวระหว่างเปิด detail ตรวจข้อความผิดพลาด ปุ่ม retry และไม่ค้าง |
| `AC-DOR-06` | `test_AC_DOR_06_search_and_detail_p95_under_three_seconds` | ยิง workload ค้นหาและ detail ในสภาวะเครือข่ายปกติ เก็บ response time และตรวจ p95 <= 3 วินาที |

การทดสอบเพิ่มเติมที่ผูกกับข้อกำหนดคุณภาพ:

- ตรวจ responsive layout บน viewport คอมพิวเตอร์และอุปกรณ์พกพา (`CON-UI-01`)
- ตรวจ HTTPS/TLS 1.2 ขึ้นไปใน deployment/integration environment (`NFR-SEC-01`)
- ตรวจข้อมูลราคา รูปภาพ กฎ ค่าใช้จ่าย และเงื่อนไขที่แสดงตรงกับ fixture/data source (`NFR-ACC-01`, `DOM-RULE-01`)

## 7. ลำดับงาน

1. กำหนด contract ของข้อมูล `Dormitory`, `RoomType`, รูปภาพ และสถานที่ใกล้เคียงตาม `FR-DOR-01` ถึง `FR-DOR-05`
2. สร้าง query/service สำหรับ Approved เท่านั้น พร้อมคำนวณราคา Min-Max และสถานะห้องตาม `CON-BUS-01`, `ASM-02`, `ASM-03`
3. สร้าง API ค้นหา รายละเอียด และ recommendations ตาม `FR-DOR-01`, `FR-DOR-03`, `FR-DOR-07`
4. สร้างหน้าค้นหาและ filter พร้อม clear-filter flow ตาม `FR-DOR-01`, `FR-DOR-06`, `NFR-USE-01`
5. สร้าง result card ที่แสดงราคา สถานะห้อง และ Verified Badge ตาม `FR-DOR-02`, `FR-DOR-05`
6. สร้างหน้ารายละเอียด แกลเลอรี รายการสถานที่ใกล้เคียง และข้อมูลกฎ/ค่าใช้จ่ายตาม `FR-DOR-03`, `FR-DOR-04`, `DOM-RULE-01`
7. เพิ่ม empty-state recommendations และ detail error/retry ตาม `FR-DOR-07`, `FR-DOR-08`
8. เพิ่ม automated tests ตาม `AC-DOR-01` ถึง `AC-DOR-05` และตรวจ responsive/ข้อมูลจริงตาม NFR
9. ทำ performance test สำหรับ `AC-DOR-06` และตรวจ HTTPS ตาม `NFR-PERF-01`, `NFR-SEC-01`

## 8. สิ่งที่ยังไม่ทำ

จาก `spec.md` ฉบับปัจจุบันไม่มีรายการ Open Questions ที่ยังค้างอยู่ จึงไม่มีส่วนของฟีเจอร์ที่ต้องหยุดรอคำตอบตามหัวข้อนี้

การนัดหมายดูห้องพัก การจอง การจัดการข้อมูลโดยเจ้าของหอพัก และการอนุมัติโดย Admin จะไม่สร้างในแผนนี้ เพราะอยู่ใน Out of scope (`UC-06`, `UC-12`, `UC-03`, `UC-04`, `UC-13`)

