# รายการงาน: ดูสถิติหอพัก

- Feature: ดูสถิติหอพัก (View Dormitory Statistics)
- Spec ID: `SPEC-STAT-001`
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-11-12

สรุป:
- มี 2 เฟสหลักพร้อม 5 tasks
- มี 0 tasks ที่รอ Open Questions เนื่องจาก spec และ plan ได้ตอบคำถามหลักครบแล้ว
- เฟสแรกเป็นพื้นฐานการเข้าถึงข้อมูลและ API; เฟสสองเป็น UI + export + validation

## เฟส 0: ฐานรากข้อมูลและสิทธิ์เข้าถึง

### T-01 กำหนด contract ข้อมูลสถิติและตรวจสิทธิ์เจ้าของหอพัก
- รองรับ: `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-05`, `CON-AUTH-01`, `CON-UI-01`
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐาน
- ไฟล์ที่แตะ: `backend/app/statistics_contract.py` หรือ path ที่ทีมกำหนดภายหลัง
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: มีสัญญาข้อมูลสำหรับ summary cards, room status, date range metrics และ definitions ของเจ้าของหอพักที่มีสิทธิ์เข้าถึง
- สถานะ: เสร็จ รอทีมตรวจ

### T-02 สร้าง API ดึงข้อมูลสถิติหอพักตามช่วงวันที่
- รองรับ: `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-06`, `CON-AUTH-01`
- ตรวจด้วย: `AC-STAT-01`, `AC-STAT-02`, `AC-STAT-03`, `AC-STAT-04`
- ไฟล์ที่แตะ: `backend/app/statistics.py`, `backend/app/main.py` (path ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: API คืน summary metrics, room status, และ date-range statistics ตาม `dormitoryId`, `startDate`, `endDate` โดยต้องปฏิเสธช่วงวันที่ที่ไม่ถูกต้องและคืน empty state ให้ชัดเจนเมื่อไม่มีข้อมูล
- สถานะ: เสร็จ รอทีมตรวจ

## เฟส 1: หน้า dashboard และรายงาน

### T-03 สร้างหน้า dashboard สำหรับเจ้าของหอพัก
- รองรับ: `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-05`, `CON-UI-01`, `NFR-USE-01`
- ตรวจด้วย: `AC-STAT-01`, `AC-STAT-02`, `AC-STAT-03`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/style.css` (paths ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: dashboard สำหรับเจ้าของหอพัก, form เลือกช่วงวันที่, summary cards, chart, room status
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: เจ้าของหอพักเปิดหน้า dashboard และเห็น summary cards, room status, form เลือกช่วงวันที่ และกราฟ/แท่งประเมินตามช่วงวันที่ที่เลือก โดยไม่มีสิทธิ์ข้ามเจ้าของหอพักคนอื่น
- สถานะ: เสร็จ รอทีมตรวจ

### T-04 เพิ่ม empty state และฟังก์ชันดาวน์โหลดรายงาน CSV
- รองรับ: `FR-STAT-06`, `FR-STAT-07`, `ASM-06`, `ASM-08`, `AC-STAT-05`
- ตรวจด้วย: `AC-STAT-04`, `AC-STAT-05`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `backend/app/report.py` หรือ path ที่ทีมยืนยันระหว่าง implement
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: เมื่อไม่มีข้อมูลแสดงข้อความ “ยังไม่มีข้อมูลสถิติในรอบเวลานี้”; เมื่อมีข้อมูลและค่าเป็น 0 แสดง 0 ได้; เมื่อกดดาวน์โหลดรายงานจะสร้างไฟล์ CSV ตามช่วงวันที่ที่เลือก
- สถานะ: เสร็จ รอทีมตรวจ

### T-05 ตรวจ Acceptance Criteria และประสิทธิภาพ
- รองรับ: `AC-STAT-01` ถึง `AC-STAT-05`, `NFR-PERF-01`
- ตรวจด้วย: `AC-STAT-01` ถึง `AC-STAT-05`
- ไฟล์ที่แตะ: `backend/tests/test_statistics.py`, `frontend/src/App.test.jsx` (paths ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: รัน test ครบตาม AC และตรวจวัดเวลาการตอบกลับไม่เกิน 3 วินาทีจากกดยืนยันช่วงวันที่จนระบบแสดงผลสถิติครบถ้วน
- สถานะ: เสร็จ รอทีมตรวจ

## จุดตรวจสิ้นสุด
- ต้องผ่าน `AC-STAT-01` ถึง `AC-STAT-05` และตรวจประสิทธิภาพ `NFR-PERF-01`
- ต้องปฏิบัติตาม `CON-AUTH-01` และ `CON-UI-01` อย่างเคร่งครัด
- ไม่เพิ่มงานนอก scope เช่น การจัดการข้อมูลหอพัก การอัปเดตสถานะห้องพัก การจองห้องพัก หรือการชำระเงิน
- ไม่มี Open Questions ค้างใน `spec.md` หลังจากได้ข้อสรุปตามคำตอบทีมแล้ว
- หมายเหตุการตรวจ regression: ชุดทดสอบ backend ทั้งหมดมี 2 failures ใน tests คำแนะนำหอพัก (`test_AC_DOR_03_2_recommendations_are_limited_to_five`, `test_AC_DOR_03_empty_search_returns_recommendations`) ซึ่งไม่เกี่ยวกับสถิติหอพัก; tests สถิติที่เลือกตรวจผ่าน
