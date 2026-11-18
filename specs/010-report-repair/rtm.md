# RTM: แจ้งซ่อมและรายงานปัญหา (Report Repair & Issues)
อ้างอิง: [spec.md](./spec.md) `SPEC-REP-010` `Draft v2` | [plan.md](./plan.md) | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
วันที่: 2569-11-19

## 1. ตามรอยไปข้างหน้า (Requirement → Acceptance Criteria → Task → Test Case)

| ID | AC ที่เกี่ยวข้อง | Task | Test Case | รายละเอียด | สถานะ |
|---|---|---|---|---|---|
| `FR-REP-01` | `AC-REP-01` | `T-01`, `T-02`, `T-04`, `T-05` | `TC-REP-01-1`, `TC-REP-01-2`, `TC-REP-01-3`, `TC-REP-01-5` | แสดงฟอร์มแจ้งซ่อม (ประเภทปัญหา, รายละเอียด, อัปโหลดรูปภาพ) และส่งคำขอแจ้งซ่อม | ครบ |
| `FR-REP-02` | `AC-REP-02` | `T-01`, `T-02`, `T-06`, `T-07` | `TC-REP-02-1`, `TC-REP-02-2`, `TC-REP-02-3`, `TC-REP-02-4` | แนบรูปภาพประกอบ `.jpg`/`.jpeg`/`.png` สูงสุด 3 รูป ขนาดไม่เกิน 5MB ต่อไฟล์ | ครบ |
| `FR-REP-03` | `AC-REP-05` | `T-10` | `TC-REP-05-1`, `TC-REP-05-2` | ยกเลิกการกรอกฟอร์มและนำทางกลับหน้าก่อนหน้า (หรือ `/`) โดยไม่บันทึกข้อมูล | ครบ |
| `FR-REP-04` | `AC-REP-01`, `AC-REP-03` | `T-01`, `T-04`, `T-08` | `TC-REP-01-3`, `TC-REP-03-1`, `TC-REP-03-2`, `TC-REP-03-3` | ตรวจสอบข้อมูลบังคับกรอก (ประเภทปัญหา และรายละเอียด 1–1,000 ตัวอักษร) | ครบ |
| `FR-REP-05` | `AC-REP-02`, `AC-REP-04` | `T-01`, `T-06`, `T-09` | `TC-REP-04-1`, `TC-REP-04-2`, `TC-REP-04-3`, `TC-REP-04-4` | ตรวจสอบไฟล์ภาพผิดเงื่อนไข และ Rollback DB พร้อมลบไฟล์ตกค้างเมื่อบันทึกพลาด | ครบ |
| `FR-REP-06` | `AC-REP-01` | `T-01`, `T-02`, `T-04`, `T-05` | `TC-REP-01-1`, `TC-REP-01-2` | บันทึกรายการผูกกับ `resident_id` และ `room_id`, ตั้งสถานะ `Pending` และแสดงรายการ | ครบ |
| `NFR-PERF-01` | `AC-REP-06` | `T-01`, `T-11` | `TC-REP-06-1` | เวลาตอบสนองของ API `POST /api/repairs` ค่า p95 ไม่เกิน 2.0 วินาที | ครบ |
| `NFR-SEC-01` | `AC-REP-02` | `T-06` | `TC-REP-02-1`, `TC-REP-02-3` | จัดเก็บไฟล์รูปภาพนอก public folder และจำกัดสิทธิ์เข้าถึงเฉพาะผู้มีสิทธิ์ | ครบ |
| `NFR-USE-01` | `AC-REP-01`, `AC-REP-02`, `AC-REP-03` | `T-05`, `T-07`, `T-08` | `TC-REP-01-2`, `TC-REP-01-5`, `TC-REP-03-3`, `TC-REP-04-4` | หน้าจอใช้งานชัดเจน แจ้งเตือนตรงจุด และรองรับ Responsive (`375px`, `768px`, `1280px`) | ครบ |
| `CON-SYS-01` | `AC-REP-01` | `T-03`, `T-04` | `TC-REP-01-1`, `TC-REP-01-4` | เชื่อมโยงตัวตนผู้พักอาศัย (`X-Resident-Id`) และดึง `room_id` อัตโนมัติ | ครบ |
| `CON-UI-01` | `AC-REP-01` | `T-01`, `T-05` | `TC-REP-01-2` | หน้าจอเรียก API ผ่าน `frontend/src/api/client.js` และใช้ค่าคงที่จาก `config.js` | ครบ |
| `AC-REP-01` | - | `T-03`, `T-04`, `T-05` | `TC-REP-01-1` ถึง `TC-REP-01-5` | ส่งแจ้งซ่อมสำเร็จ บันทึกผูกห้อง สถานะ `Pending` และแสดงรายการสถานะ | ครบ |
| `AC-REP-02` | - | `T-06`, `T-07` | `TC-REP-02-1` ถึง `TC-REP-02-4` | แนบรูปภาพประกอบถูกต้องและจำกัดสิทธิ์การเปิดดูภาพ | ครบ |
| `AC-REP-03` | - | `T-08` | `TC-REP-03-1` ถึง `TC-REP-03-3` | ปฏิเสธข้อมูลบังคับกรอกที่ไม่ครบถ้วนและแสดงแจ้งเตือนใต้ช่องที่ผิดพลาด | ครบ |
| `AC-REP-04` | - | `T-09` | `TC-REP-04-1` ถึง `TC-REP-04-4` | ปฏิเสธไฟล์ผิดเงื่อนไข และ Rollback ข้อมูล/ไฟล์เมื่อเกิดข้อผิดพลาด | ครบ |
| `AC-REP-05` | - | `T-10` | `TC-REP-05-1`, `TC-REP-05-2` | กดปุ่มยกเลิกแล้วไม่บันทึกข้อมูลและกลับหน้าก่อนหน้า (หรือ `/`) | ครบ |
| `AC-REP-06` | - | `T-11` | `TC-REP-06-1` | ค่าเปอร์เซ็นไทล์ที่ 95 (p95) ของเวลาตอบสนอง API ไม่เกิน 2.0 วินาที | ครบ |

## 2. ตามรอยย้อนกลับ (Task → Requirement / Acceptance Criteria)

| Task | Requirement / AC ที่รองรับ | ไฟล์โค้ดและไฟล์ทดสอบที่เกี่ยวข้อง | สถานะ |
|---|---|---|---|
| `T-01` | `FR-REP-01`, `FR-REP-02`, `FR-REP-04` ถึง `FR-REP-06`, `NFR-PERF-01`, `CON-UI-01`, `ASM-02`, `ASM-03`, `ASM-06` | `backend/app/config.py`, `frontend/src/config.js` | เสร็จแล้ว |
| `T-02` | `FR-REP-01`, `FR-REP-02`, `FR-REP-06`, `ASM-01`, `ASM-02`, `ASM-08` | `backend/app/models.py`, `backend/app/database.py` | เสร็จแล้ว |
| `T-03` | `CON-SYS-01`, `ASM-01`, `ASM-05`, `AC-REP-01` | `backend/app/repairs.py`, `backend/tests/test_AC_REP_01.py` | เสร็จแล้ว |
| `T-04` | `FR-REP-01`, `FR-REP-04`, `FR-REP-06`, `CON-SYS-01`, `ASM-01`, `ASM-02`, `ASM-06`, `AC-REP-01` | `backend/app/repairs.py`, `backend/app/main.py`, `backend/tests/test_AC_REP_01.py` | เสร็จแล้ว |
| `T-05` | `FR-REP-01`, `FR-REP-06`, `CON-UI-01`, `NFR-USE-01`, `ASM-07`, `AC-REP-01` | `frontend/src/api/client.js`, `frontend/src/pages/ReportRepairPage.jsx`, `frontend/src/App.jsx`, `frontend/src/__tests__/TC-REP-01-2.test.jsx` | เสร็จแล้ว |
| `T-06` | `FR-REP-02`, `FR-REP-05`, `NFR-SEC-01`, `ASM-03`, `ASM-08`, `AC-REP-02` | `backend/app/repairs.py`, `backend/tests/test_AC_REP_02.py` | เสร็จแล้ว |
| `T-07` | `FR-REP-02`, `NFR-USE-01`, `ASM-03`, `AC-REP-02` | `frontend/src/api/client.js`, `frontend/src/pages/ReportRepairPage.jsx`, `frontend/src/__tests__/TC-REP-02-4.test.jsx` | เสร็จแล้ว |
| `T-08` | `FR-REP-04`, `NFR-USE-01`, `ASM-06`, `AC-REP-03` | `backend/app/repairs.py`, `frontend/src/pages/ReportRepairPage.jsx`, `backend/tests/test_AC_REP_03.py`, `frontend/src/__tests__/TC-REP-03-3.test.jsx` | เสร็จแล้ว |
| `T-09` | `FR-REP-05`, `ASM-03`, `ASM-08`, `AC-REP-04` | `backend/app/repairs.py`, `frontend/src/pages/ReportRepairPage.jsx`, `backend/tests/test_AC_REP_04.py`, `frontend/src/__tests__/TC-REP-04-4.test.jsx` | เสร็จแล้ว |
| `T-10` | `FR-REP-03`, `AC-REP-05` | `frontend/src/pages/ReportRepairPage.jsx`, `frontend/src/__tests__/TC-REP-05-1.test.jsx` | เสร็จแล้ว |
| `T-11` | `NFR-PERF-01`, `AC-REP-06` | `backend/tests/test_AC_REP_06.py` | เสร็จแล้ว |

## 3. ข้อค้นพบ

| F-ID | ประเภท | รายละเอียด | สถานะ |
|---|---|---|---|
| `F-01` | Traceability | ทุก FR (`FR-REP-01`–`06`), NFR (`NFR-PERF-01`, `NFR-SEC-01`, `NFR-USE-01`), Constraint และ AC (`AC-REP-01`–`06`) มี Task และ Test Case รองรับครบถ้วน | ผ่าน |
| `F-02` | Security & Storage | รูปภาพประกอบการแจ้งซ่อมถูกจัดเก็บในโฟลเดอร์นอก static public (`repair_images/`) และตรวจสอบสิทธิ์ผ่าน Endpoint `/api/repairs/{repair_id}/images/{image_id}` | ผ่าน |
| `F-03` | Data Integrity | การบันทึกข้อมูลแจ้งซ่อมและรูปภาพทำงานภายใต้ Database Transaction และลบไฟล์ที่เขียนค้างไว้ทันทีหากเกิดข้อผิดพลาด | ผ่าน |
| `F-04` | Regression | ชุดทดสอบอัตโนมัติทั้งหมดผ่านครบถ้วนทั้งฝั่ง Backend (`pytest`: 112 passed) และ Frontend (`vitest`: 52 test files / 78 tests passed) | ผ่าน |