# รายการงาน: ค้นหาและดูข้อมูลหอพัก

- Feature: ค้นหาและดูข้อมูลหอพัก (Dormitory Search & Details)
- Spec ID: `SPEC-DOR-001`
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-10-31

สรุป:
- มี 7 เฟส (เฟส 0 ฐานราก และเฟสผู้ใช้ 1–6) รวม 16 tasks
- มี 0 tasks ที่รอ Open Questions ซึ่งยังไม่มีระบุไว้ใน spec
- เฟสแรกที่ลองใช้งานได้จริงคือเฟส 1: ค้นหาและดูสถานะห้องว่าง

## เฟส 0: ฐานรากข้อมูล

### T-01 กำหนดโครงข้อมูลหอพักและห้องพัก
- รองรับ: `FR-DOR-01`, `FR-DOR-02`, `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `CON-BUS-01`, `CON-BUS-02`
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐาน
- ไฟล์ที่แตะ: `backend/app/models.py` (path ที่ทีมระบุระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: โครงข้อมูลมีฟิลด์ตาม Entity ใน `plan.md` และรองรับการกรอง Approved, สถานะ Verified และข้อมูลห้องพัก
- สถานะ: เสร็จ รอทีมตรวจ

### T-02 เตรียมข้อมูลตัวอย่างสำหรับตรวจเส้นทางค้นหาและรายละเอียด
- รองรับ: `FR-DOR-01`, `FR-DOR-02`, `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `FR-DOR-07`, `CON-BUS-01`, `CON-BUS-02`
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-01
- ไฟล์ที่แตะ: `backend/app/fixtures.py` (path ที่ทีมระบุระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: มีข้อมูลตัวอย่าง Approved และไม่ Approved, Verified และไม่ Verified, ห้องว่างและห้องเต็ม, ราคา, รูปภาพ และสถานที่ใกล้เคียงสำหรับทดสอบ
- สถานะ: เสร็จ รอทีมตรวจ

## เฟส 1: ค้นหาและดูสถานะห้อง (AC-DOR-01)

### T-03 สร้างบริการค้นหาหอพักตามเงื่อนไข
- รองรับ: `FR-DOR-01`, `FR-DOR-02`, `CON-BUS-01`, `ASM-02`, `ASM-03`
- ตรวจด้วย: `AC-DOR-01`
- ไฟล์ที่แตะ: `backend/app/search.py`, `backend/app/models.py` (รองรับข้อมูล nullable ตามคำยืนยันทีม), `backend/tests/test_search.py` (paths ที่ทีมระบุระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: การค้นหาส่งผลรายการ Approved ตามคำค้นหา ประเภทและช่วงราคา พร้อมช่วงราคา Min-Max และสถานะห้องตามข้อมูลล่าสุด
- สถานะ: เสร็จ รอทีมตรวจ

### T-04 ทดสอบผลลัพธ์บริการค้นหา
- รองรับ: `FR-DOR-01`, `FR-DOR-02`, `CON-BUS-01`
- ตรวจด้วย: `AC-DOR-01`
- ไฟล์ที่แตะ: `backend/tests/test_search.py`; ชื่อ test: `test_AC_DOR_01_search_female_available_dormitories` (path ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: `test_AC_DOR_01_search_female_available_dormitories` ผ่าน โดยยืนยันรายการหญิงและสถานะห้องว่างตรงกับข้อมูล
- สถานะ: เสร็จ รอทีมตรวจ

### T-05 สร้างหน้าค้นหาและรายการผลลัพธ์
- รองรับ: `FR-DOR-01`, `FR-DOR-02`, `CON-ACC-01`
- ตรวจด้วย: `AC-DOR-01`
- ไฟล์ที่แตะ: `frontend/package.json`, `frontend/package-lock.json`, `frontend/index.html`, `frontend/vite.config.js`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/style.css`, `frontend/src/api/client.js`, `frontend/src/App.test.jsx` (paths ที่ทีมอนุญาตให้กำหนดระหว่าง implement)
- แบบหน้าจอ: ไม่มี UI ID หรือ mockup ระบุใน spec/plan
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: Guest ค้นหาและกรองตามเงื่อนไขที่กำหนดได้ และเห็นรายการพร้อมสถานะห้องว่างตามผลจาก API
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_AC_DOR_01_search_female_available_dormitories` และ test ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: ยังไม่มีคำสั่งเปิด backend/frontend ใน `plan.md` ต้องเติมก่อนลองระบบจริง
- คนลองเองตาม AC-DOR-01:
  Given มีหอพักหญิงที่ Approved และมีห้องว่างอยู่ในระบบ
  When ผู้ใช้เลือกกรองเฉพาะหอพักหญิงและกดค้นหา
  Then ระบบแสดงเฉพาะรายการหอพักหญิงพร้อมป้ายสถานะห้องว่างที่ตรงกับข้อมูล
- ยังขาด: ไม่มี

## เฟส 2: ดูรายละเอียดหอพักที่ยืนยันแล้ว (AC-DOR-02)

### T-06 สร้างบริการอ่านรายละเอียดหอพัก
- รองรับ: `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `CON-BUS-01`, `CON-BUS-02`, `DOM-RULE-01`
- ตรวจด้วย: `AC-DOR-02`
- ไฟล์ที่แตะ: `backend/app/details.py`, `backend/app/main.py`, `backend/app/models.py`, `backend/app/fixtures.py`, `backend/tests/test_details.py`, `backend/requirements.txt` (paths ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: API ส่งข้อมูลรายละเอียดที่ระบุใน FR-DOR-03/04 และส่งสถานะ Badge ตาม Approved + verified status
- สถานะ: เสร็จ รอทีมตรวจ

### T-07 สร้างหน้ารายละเอียดและแสดง Verified Badge
- รองรับ: `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `CON-ACC-01`, `CON-BUS-02`, `DOM-RULE-01`
- ตรวจด้วย: `AC-DOR-02`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/App.test.jsx` (paths ที่ทีมอนุมัติระหว่าง implement)
- แบบหน้าจอ: ไม่มี UI ID หรือ mockup ระบุใน spec/plan
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: Guest เปิดรายละเอียดและเห็นข้อมูล ราคา/ค่าใช้จ่าย/สิ่งอำนวยความสะดวก/กฎ/รูปภาพ/สถานที่/ความปลอดภัย/ช่องทางติดต่อ พร้อม Badge ตามเงื่อนไข
- สถานะ: เสร็จ รอทีมตรวจ

### T-08 ตรวจความตรงกันของข้อมูลรายละเอียดกับข้อมูลต้นทาง
- รองรับ: `NFR-ACC-01`, `DOM-RULE-01`, `FR-DOR-03`, `FR-DOR-04`
- ตรวจด้วย: `AC-DOR-02`
- ไฟล์ที่แตะ: `backend/tests/test_details.py`, `frontend/src/App.test.jsx` (paths ที่ทีมอนุมัติระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: test ยืนยันว่าราคา รูปภาพ กฎ ค่าใช้จ่าย และข้อมูลรายละเอียดที่แสดงตรงกับข้อมูลตัวอย่างที่เตรียมไว้
- สถานะ: เสร็จ รอทีมตรวจ

### T-09 ตรวจ Responsive Web Design
- รองรับ: `CON-UI-01`, `NFR-USE-01`
- ตรวจด้วย: ไม่มี AC ตรง ๆ
- ไฟล์ที่แตะ: ตรวจหน้า search/detail ด้วย browser ที่ viewport desktop 1280×800 และ mobile 375×812; ไม่ต้องแก้ไฟล์แอป
- แบบหน้าจอ: ไม่มี UI ID หรือ mockup ระบุใน spec/plan
- ต้องทำหลัง: T-07
- เสร็จเมื่อ: หน้าค้นหาและรายละเอียดแสดงผลได้บน viewport คอมพิวเตอร์และอุปกรณ์พกพาตาม CON-UI-01; เกณฑ์วัด NFR-USE-01 ยังไม่มีระบุ
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_AC_DOR_02_detail_verified_dormitory`, test ตรวจข้อมูลรายละเอียด และ test responsive; test ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: ยังไม่มีคำสั่งเปิด backend/frontend ใน `plan.md` ต้องเติมก่อนลองระบบจริง
- คนลองเองตาม AC-DOR-02:
  Given หอพักผ่านการอนุมัติและมีสถานะ Verified
  When ผู้ใช้คลิกดูรายละเอียดของหอพักดังกล่าว
  Then ระบบแสดงข้อมูลรายละเอียดครบทุกส่วนและแสดง Verified Badge
- ยังขาด: เกณฑ์ตรวจรับ NFR-USE-01 ยังไม่มีระบุ

## เฟส 3: ล้างตัวกรอง (AC-DOR-04)

### T-10 เพิ่มการล้างตัวกรองและโหลดผลลัพธ์ใหม่
- รองรับ: `FR-DOR-06`, `CON-BUS-01`
- ตรวจด้วย: `AC-DOR-04`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/App.test.jsx` (paths ที่ทีมอนุมัติระหว่าง implement)
- แบบหน้าจอ: ไม่มี UI ID หรือ mockup ระบุใน spec/plan
- ต้องทำหลัง: T-05
- เสร็จเมื่อ: เมื่อกด Clear Filter ค่าตัวกรองกลับค่าเริ่มต้นและโหลดรายการ Approved ทั้งหมดตามพฤติกรรม FR-DOR-06/CON-BUS-01
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_AC_DOR_04_clear_filter_loads_all_dormitories`; test ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: ยังไม่มีคำสั่งเปิด backend/frontend ใน `plan.md` ต้องเติมก่อนลองระบบจริง
- คนลองเองตาม AC-DOR-04:
  Given มีการตั้งค่าตัวกรองการค้นหาค้างไว้
  When ผู้ใช้กดปุ่ม “ล้างตัวกรอง”
  Then ค่าตัวกรองถูกรีเซ็ตและรายการหอพักทั้งหมดกลับมาแสดงผลทันที
- ยังขาด: ไม่มี

## เฟส 4: แสดงรายการแนะนำเมื่อไม่พบผลลัพธ์ (AC-DOR-03)

### T-11 สร้างบริการค้นหารายการหอพักแนะนำ
- รองรับ: `FR-DOR-07`, `CON-BUS-01`, `ASM-05`
- ตรวจด้วย: `AC-DOR-03`
- ไฟล์ที่แตะ: `backend/app/recommendations.py`, `backend/tests/test_recommendations.py` (paths และ policy ที่ทีมอนุมัติระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: เมื่อไม่พบผลตามเงื่อนไข ระบบคืนรายการ Approved ที่มีทำเลหรือช่วงราคาใกล้เคียงไม่เกิน 5 รายการตาม ASM-05
- สถานะ: เสร็จ รอทีมตรวจ

### T-12 แสดง empty state และรายการแนะนำ
- รองรับ: `FR-DOR-07`, `CON-BUS-01`
- ตรวจด้วย: `AC-DOR-03`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/App.test.jsx`, `backend/app/main.py`, `backend/app/search_api.py`, `backend/tests/test_search_api.py` (paths ที่ทีมอนุมัติระหว่าง implement)
- แบบหน้าจอ: ไม่มี UI ID หรือ mockup ระบุใน spec/plan
- ต้องทำหลัง: T-11
- เสร็จเมื่อ: `test_AC_DOR_03_empty_search_returns_recommendations` ผ่าน โดยหน้าจอแสดงข้อความที่ระบุและรายการแนะนำเป็นทางเลือก
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 4
- test ที่ต้องผ่านทั้งหมด: `test_AC_DOR_03_empty_search_returns_recommendations`; test ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: ยังไม่มีคำสั่งเปิด backend/frontend ใน `plan.md` ต้องเติมก่อนลองระบบจริง
- คนลองเองตาม AC-DOR-03:
  Given ไม่มีหอพักที่ตรงกับเงื่อนไขการค้นหา
  When ผู้ใช้กดค้นหา
  Then ระบบแสดงข้อความ “ไม่พบหอพักตามเงื่อนไขที่คุณระบุ” พร้อมรายการหอพักแนะนำ
- ยังขาด: ไม่มี Open Question ใน spec; เกณฑ์ “พื้นที่เดียวกัน/ราคาใกล้เคียง” ยังอาศัยข้อความและ ASM-05 ตาม spec ปัจจุบัน

## เฟส 5: ลองโหลดรายละเอียดใหม่เมื่อผิดพลาด (AC-DOR-05)

### T-13 ส่งต่อข้อผิดพลาดจากการโหลดรายละเอียด
- รองรับ: `FR-DOR-08`
- ตรวจด้วย: `AC-DOR-05`
- ไฟล์ที่แตะ: `backend/app/details.py`, `backend/tests/test_details.py` (paths และ error policy ที่ทีมอนุมัติระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: เมื่อแหล่งข้อมูลรายละเอียดล้มเหลว API ส่งผลผิดพลาดให้หน้าจอแสดงสถานะโหลดข้อมูลไม่สำเร็จได้
- สถานะ: เสร็จ รอทีมตรวจ

### T-14 เพิ่มข้อความผิดพลาดและปุ่มลองใหม่
- รองรับ: `FR-DOR-08`
- ตรวจด้วย: `AC-DOR-05`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/App.test.jsx` (paths ที่ทีมอนุมัติระหว่าง implement; `frontend/src/api/client.js` ที่มีอยู่แล้วส่งต่อ HTTP error เป็น exception)
- แบบหน้าจอ: ไม่มี UI ID หรือ mockup ระบุใน spec/plan
- ต้องทำหลัง: T-13
- เสร็จเมื่อ: `test_AC_DOR_05_detail_load_error_has_retry` ผ่าน โดยแสดงข้อความ “ไม่สามารถโหลดข้อมูลได้” และปุ่ม “ลองใหม่”
- สถานะ: เสร็จ รอทีมตรวจ

#### จุดตรวจเฟส 5
- test ที่ต้องผ่านทั้งหมด: `test_AC_DOR_05_detail_load_error_has_retry`; test ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: ยังไม่มีคำสั่งเปิด backend/frontend ใน `plan.md` ต้องเติมก่อนลองระบบจริง
- คนลองเองตาม AC-DOR-05:
  Given การเชื่อมต่อฐานข้อมูลล้มเหลวระหว่างเปิดดูรายละเอียดหอพัก
  When ผู้ใช้เข้าหน้ารายละเอียด
  Then ระบบแสดงข้อความแจ้งเตือนพร้อมปุ่ม “ลองใหม่” และหน้าจอไม่ค้าง
- ยังขาด: ไม่มี

## เฟส 6: ตรวจเวลาตอบสนองและ HTTPS (AC-DOR-06)

### T-15 ทดสอบเวลาตอบสนอง p95
- รองรับ: `NFR-PERF-01`
- ตรวจด้วย: `AC-DOR-06`
- ไฟล์ที่แตะ: `backend/tests/test_performance.py` (path ที่ทีมมอบหมายให้กำหนดระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03, T-06
- เสร็จเมื่อ: `test_AC_DOR_06_search_and_detail_p95_under_three_seconds` ผ่านโดยวัด p95 ไม่เกิน 3 วินาที
- สถานะ: เสร็จ รอทีมตรวจ

### T-16 ตรวจ HTTPS/TLS
- รองรับ: `NFR-SEC-01`
- ตรวจด้วย: ไม่มี AC ตรง ๆ
- ไฟล์ที่แตะ: ตำแหน่งไฟล์/configuration สำหรับ deployment ยังไม่ระบุใน `plan.md`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-05, T-07
- เสร็จเมื่อ: การตรวจใน integration/deployment environment ยืนยันว่า Browser รับส่งข้อมูลผ่าน HTTPS/TLS 1.2 ขึ้นไป
- สถานะ: blocked — รอทีมระบุ integration/deployment environment หรือ URL สำหรับตรวจ HTTPS/TLS 1.2 ขึ้นไป

#### จุดตรวจเฟส 6
- test ที่ต้องผ่านทั้งหมด: `test_AC_DOR_06_search_and_detail_p95_under_three_seconds`, test HTTPS/TLS และ test ของทุกเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: ยังไม่มีคำสั่งเปิด backend/frontend หรือ environment สำหรับ integration ใน `plan.md` ต้องเติมก่อนทดสอบ
- คนลองเองตาม AC-DOR-06:
  Given มีรายการหอพักในระบบ
  When ผู้ใช้ค้นหาหรือเปิดหน้ารายละเอียดหอพัก
  Then เวลาตอบสนอง p95 เสร็จสิ้นภายใน 3 วินาที
- ยังขาด: ไม่มี integration/deployment environment หรือ URL สำหรับตรวจ HTTPS/TLS; T-16 ถูก block จนกว่าจะมีข้อมูลดังกล่าว

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| `AC-DOR-01` | T-04, T-05 |
| `AC-DOR-02` | T-07, T-08 |
| `AC-DOR-03` | T-12 |
| `AC-DOR-04` | T-10 |
| `AC-DOR-05` | T-14 |
| `AC-DOR-06` | T-15 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| `CON-ACC-01` | T-05, T-07 |
| `CON-BUS-01` | T-03, T-06, T-10, T-11, T-12 |
| `CON-BUS-02` | T-06, T-07 |
| `CON-UI-01` | T-09 |
| `DOM-RULE-01` | T-06, T-07, T-08 |

### Functional Requirements

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| `FR-DOR-01` | `AC-DOR-01` | เฟส 1 |
| `FR-DOR-02` | `AC-DOR-01` | เฟส 1 |
| `FR-DOR-03` | `AC-DOR-02` | เฟส 2 |
| `FR-DOR-04` | `AC-DOR-02` | เฟส 2 |
| `FR-DOR-05` | `AC-DOR-02` | เฟส 2 |
| `FR-DOR-06` | `AC-DOR-04` | เฟส 3 |
| `FR-DOR-07` | `AC-DOR-03` | เฟส 4 |
| `FR-DOR-08` | `AC-DOR-05` | เฟส 5 |

## สิ่งที่ยังไม่ทำ

- Open Questions: ไม่มีรายการ Open Questions ใน `spec.md`
- `NFR-USE-01` ไม่มีเกณฑ์ตรวจรับที่วัดผลได้หรือ AC โดยตรง
- `NFR-PERF-01` ยังไม่กำหนด workload และนิยามสภาวะเครือข่ายปกติสำหรับการวัด
- `plan.md` ยังไม่ระบุ path ของไฟล์ backend/frontend และคำสั่งเปิดระบบ จึงต้องกำหนดก่อนเริ่มทำ tasks
- ห้ามเริ่มทำ task ใด ๆ จนกว่าทีมจะสั่งแยกต่างหาก
