# รายการงาน: ดูสถิติหอพัก

- Feature: ดูสถิติหอพัก (View Dormitory Statistics)
- Spec ID: `SPEC-STAT-001`
- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)
- วันที่: 2569-11-12

สรุป:
- มี 2 เฟสหลักพร้อม 5 tasks
- กรณี `empty_data: true` ซ่อน Summary Cards ทั้งหมด กราฟ ปุ่ม CSV และ mock notice; แสดงเฉพาะ Empty State พร้อมคำแนะนำ
- หน้า UC005 เริ่มต้นด้วยฟอร์มช่วงวันที่เท่านั้น และโหลดสถิติเมื่อกดปุ่ม `แสดงสถิติ`
- การเปลี่ยนวันที่ล้างสถิติและช่วงที่ส่งออก CSV เดิมทันทีจนกว่าจะกดแสดงใหม่
- Task T-01 ถึง T-04 ตรวจงาน prototype แล้วผ่านชุด test ที่เกี่ยวข้อง
- Mock ผู้เข้าชม/นัดหมายเป็นรายการตามวันจริงที่กำหนดไว้เท่านั้น; วันที่ไม่มี record ไม่ถูกสร้างเป็น 0 หรือสร้างตัวเลขอัตโนมัติ
- Mock ถูกแยกตาม dormitory_id: `dorm-approved-verified` และ `dorm-approved-unverified` ต้องทดสอบด้วยช่วงข้อมูลของหอแต่ละตัว
- Task T-05 ผ่าน UI/performance mock และ responsive test; ยังวัด NFR-PERF-01 จาก API จริง/ระบบ auth เต็มรูปไม่ได้
- เฟสแรกเป็นพื้นฐานการเข้าถึงข้อมูลและ API; เฟสสองเป็น UI + export + validation

## เฟส 0: ฐานรากข้อมูลและสิทธิ์เข้าถึง

### T-01 กำหนด contract ข้อมูลสถิติและตรวจสิทธิ์เจ้าของหอพัก
- รองรับ: `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-05`, `CON-AUTH-01`, `CON-UI-01`
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐาน
- ไฟล์ที่แตะ: `backend/app/statistics_contract.py` หรือ path ที่ทีมกำหนดภายหลัง
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: มีสัญญาข้อมูลสำหรับ summary cards, room status, date range metrics และ definitions ของเจ้าของหอพักที่มีสิทธิ์เข้าถึง
- สถานะ: เสร็จ

### T-02 สร้าง API ดึงข้อมูลสถิติหอพักตามช่วงวันที่
- รองรับ: `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-06`, `CON-AUTH-01`
- ตรวจด้วย: `AC-STAT-01`, `AC-STAT-02`, `AC-STAT-03`, `AC-STAT-04`
- ไฟล์ที่แตะ: `backend/app/statistics.py`, `backend/app/main.py` (path ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01
- เสร็จเมื่อ: API คืน summary metrics, room status, และ date-range statistics ตาม `dormitoryId`, `startDate`, `endDate` โดยต้องปฏิเสธช่วงวันที่ที่ไม่ถูกต้องและคืน empty state ให้ชัดเจนเมื่อไม่มีข้อมูล
- สถานะ: เสร็จ

## เฟส 1: หน้า dashboard และรายงาน

### T-03 สร้างหน้า dashboard สำหรับเจ้าของหอพัก
- รองรับ: `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-05`, `CON-UI-01`, `NFR-USE-01`
- ตรวจด้วย: `AC-STAT-01`, `AC-STAT-02`, `AC-STAT-03`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/style.css` (paths ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: dashboard สำหรับเจ้าของหอพัก, form เลือกช่วงวันที่, summary cards, chart, room status
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: เจ้าของหอพักเปิดหน้า dashboard แล้วเห็นเฉพาะ form เลือกช่วงวันที่; เมื่อกด `แสดงสถิติ` จึงเห็น summary cards, room status และกราฟตามช่วงที่ยืนยัน โดยไม่มีสิทธิ์ข้ามเจ้าของหอพักคนอื่น
- สถานะ: เสร็จ

### T-04 เพิ่ม empty state และฟังก์ชันดาวน์โหลดรายงาน CSV
- รองรับ: `FR-STAT-06`, `FR-STAT-07`, `ASM-06`, `ASM-08`, `AC-STAT-05`
- ตรวจด้วย: `AC-STAT-04`, `AC-STAT-05`
- ไฟล์ที่แตะ: `frontend/src/App.jsx`, `frontend/src/api/client.js`, `backend/app/report.py` หรือ path ที่ทีมยืนยันระหว่าง implement
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-03
- เสร็จเมื่อ: เมื่อไม่มีข้อมูลแสดงข้อความ “ยังไม่มีข้อมูลสถิติในรอบเวลานี้”; เมื่อมีข้อมูลและค่าเป็น 0 แสดง 0 ได้; เมื่อกดดาวน์โหลดรายงานจะสร้างไฟล์ CSV ตามช่วงวันที่ที่เลือก
- สถานะ: เสร็จ

### T-05 ตรวจ Acceptance Criteria และประสิทธิภาพ
- รองรับ: `AC-STAT-01` ถึง `AC-STAT-05`, `NFR-PERF-01`
- ตรวจด้วย: `AC-STAT-01` ถึง `AC-STAT-05`
- ไฟล์ที่แตะ: `backend/tests/test_statistics.py`, `frontend/src/App.test.jsx` (paths ที่ทีมยืนยันระหว่าง implement)
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: รัน test ครบตาม AC และตรวจวัดเวลาการตอบกลับไม่เกิน 3 วินาทีจากกดยืนยันช่วงวันที่จนระบบแสดงผลสถิติครบถ้วน
- สถานะ: ผ่านชุด UI/mock และ responsive; ยังไม่ผ่าน end-to-end performance จาก API/source จริง

## จุดตรวจสิ้นสุด
- `AC-STAT-01` ถึง `AC-STAT-05` ตรวจแล้วด้วย Vitest/Playwright และ backend unittest ที่เกี่ยวข้อง
- `NFR-PERF-01` ตรวจใน UI/mock ได้ภายใน 3 วินาที; ยังไม่ได้วัดจาก API และแหล่งข้อมูลผู้เข้าชม/นัดหมายจริง
- Prototype ปฏิบัติตามรูปแบบ auth ด้วย `X-Owner-Id: owner-1` และตรวจ ownership ฝั่ง backend; ยังไม่ได้เชื่อม Login/Manage Account เต็มรูปตาม `CON-AUTH-01`
- ไม่เพิ่มงานนอก scope เช่น การจัดการข้อมูลหอพัก การอัปเดตสถานะห้องพัก การจองห้องพัก หรือการชำระเงิน
- ไม่มี Open Questions ค้างใน `spec.md` หลังจากได้ข้อสรุปตามคำตอบทีมแล้ว
- หมายเหตุการตรวจ regression:
  - frontend Vitest: 82 tests ผ่าน
  - UC005 frontend: 16/16 tests ใน `App.test.jsx` ผ่าน
  - Playwright responsive: 3/3 tests ผ่าน
  - backend statistics unittest: 14/14 tests ผ่าน
  - backend suite เดิมมี findings 2 รายการใน tests คำแนะนำหอพักที่ไม่เกี่ยวกับ UC005; ใช้ผลดังกล่าวเป็นข้อจำกัดของ regression เท่านั้น
