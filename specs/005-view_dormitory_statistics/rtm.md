# RTM: ดูสถิติหอพัก
อ้างอิง: [spec.md](./spec.md) `Draft v2` | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
ตรวจด้วยการทดสอบ UC005 เมื่อ 2569-11-21 | test: backend statistics 14 ผ่าน, frontend UC005 16 ผ่าน, responsive 3 ผ่าน, frontend suite 82 ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| `FR-STAT-01` | `AC-STAT-01` | T-03 | `frontend/src/App.jsx`: route `/dorms/:id/statistics`; `frontend/src/pages/DormitoryStatisticsPage.jsx`: `DormitoryStatisticsPage` | หน้าแรกไม่โหลด/แสดงสถิติอัตโนมัติ; มี test initial-state และ submit — ผ่าน | ครบ |
| `FR-STAT-02` | `AC-STAT-01` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: `SummaryCard`, chart rendering; `backend/app/statistics.py`: `_build_statistics` | UI Vitest และ backend unittest ผ่าน; ผู้เข้าชม/นัดหมายแสดงเป็นข้อมูลจำลองพร้อมป้ายแหล่งข้อมูล (`F-05`) | ครบสำหรับ prototype |
| `FR-STAT-03` | `AC-STAT-02` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: room count cards; `backend/app/statistics.py`: `_room_status` อ่าน `room_types` จากฐานข้อมูล | backend unittest และ frontend tests ผ่านการนับห้องว่าง/ห้องเต็มจากข้อมูลฐานข้อมูล | ครบ |
| `FR-STAT-04` | `AC-STAT-03` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: date-range validation; `backend/app/statistics.py`: `_validate_range` | Vitest ปฏิเสธช่วงกลับหลัง UI; backend unittest ปฏิเสธช่วงกลับด้วย 422; รองรับวันเดียวและวันที่ทั้งสองข้าง | ครบ |
| `FR-STAT-05` | `AC-STAT-03` | T-02, T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: `loadStatistics`; `backend/app/statistics.py`: `_date_range_summary` | ระดับห้องใช้สถานะปัจจุบัน; ผู้เข้าชม/นัดหมายกรองตาม dormitory_id และช่วงวันที่; backend test ยืนยัน verified/unverified แยกกัน (`F-05`) | ครบสำหรับ prototype |
| `FR-STAT-06` | `AC-STAT-04` | T-04 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: empty-state UI; backend คืน `empty_data` แยกจากค่า 0 | Empty/Zero/Future/Missing Day tests ผ่าน; Empty ซ่อน Summary Cards, กราฟและปุ่ม CSV | ครบ |
| `FR-STAT-07` | `AC-STAT-05` | T-04 | `frontend/src/api/client.js`: `downloadDormitoryStatisticsReport`; `backend/app/statistics.py`: `download_dormitory_statistics_report` | CSV ใช้ช่วงวันที่ยืนยัน; Empty CSV ไม่มี room/person metric rows; frontend/Backend test ผ่าน | ครบสำหรับ prototype |
| `NFR-USE-01` | ไม่มี AC | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: responsive header, summary cards, chart; `frontend/tests/browser/statistics-responsive.e2e.js` | `test_NFR_USE_01_dashboard_is_readable_at_phone`, `_tablet`, `_desktop` — ผ่าน; ตรวจการล้นแนวนอน การจัดคอลัมน์ ขนาดตัวอักษรกราฟ และการมองเห็นตัวควบคุมใน Chromium | ครบ |
| `NFR-PERF-01` | `AC-STAT-03` | T-05 | `backend/app/statistics.py`: statistics endpoints; `frontend/src/pages/DormitoryStatisticsPage.jsx`: submit flow | `test_NFR_PERF_01_statistics_render_within_three_seconds` วัด UI ที่ใช้ mock ได้ไม่เกิน 3 วินาที; ยังไม่ได้วัด API/source จริง (`F-04`) | Mock ผ่าน / E2E ยังไม่ถึง |
| `CON-UI-01` | `AC-STAT-01` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: summary cards, chart, date inputs, alerts | browser tests ตรวจการมองเห็นของข้อมูล/ตัวควบคุม ขนาดตัวอักษรกราฟ และการไม่ล้นจอที่ 375, 768 และ 1440 px — ผ่าน | ครบ |
| `CON-AUTH-01` | `AC-STAT-01` | T-01, T-02 | `backend/app/statistics.py`: `_require_owner`; `frontend/src/api/client.js`: ส่ง `X-Owner-Id` ใน prototype | ไม่มี header หรือ owner ไม่ตรงถูกปฏิเสธ; prototype ใช้ `owner-1` สำหรับ `dorm-approved-*`; ยังไม่เชื่อม login จริง (`F-02`) | Prototype ครบ / production auth ยังไม่ถึง |

**สรุปสถานะ:** Prototype ครบ FR/NFR ที่ทดสอบได้; Auth production และ source ผู้เข้าชม/นัดหมายจริงยังไม่ถึง; ไม่มี Q ค้างใน spec

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/statistics.py`: `_require_owner`, `_room_status`, `_build_statistics`, report endpoint | `CON-AUTH-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-06`, `FR-STAT-07` | Prototype ตรงกับข้อกำหนดส่วนที่ทดสอบได้ | รายการห้องอ่านจากฐานข้อมูล; ไม่มี header ถูก 401; owner mismatch ถูก 403; ผู้เข้าชม/นัดหมายเป็น mock พร้อมระบุแหล่งข้อมูล |
| `frontend/src/pages/DormitoryStatisticsPage.jsx`: `DormitoryStatisticsPage` | `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-06`, `FR-STAT-07`, `CON-UI-01`, `NFR-USE-01` | ตรง/ทดสอบผ่าน | รองรับ loading, error, empty state, zero, responsive และวันที่ผิด |
| `frontend/src/api/client.js`: `getDormitoryStatistics`, `downloadDormitoryStatisticsReport` | `FR-STAT-01`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-07`, `CON-AUTH-01` | ตรงสำหรับ prototype | ส่ง `X-Owner-Id: owner-1` และเรียก statistics/report endpoint |

## 3. ข้อค้นพบ

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | แหล่งข้อมูลจริงยังไม่ครบ | `backend/app/statistics.py`, `backend/app/statistics_contract.py` | `FR-STAT-02`, `FR-STAT-05`, `FR-STAT-07` | ผู้เข้าชมและนัดหมายยังไม่มี source/schema จริง; prototype ใช้ synthetic mock ตาม F-05 และ production ยังต้องเชื่อม source ที่ยืนยันได้ | รอทีมระบุแหล่งข้อมูล |
| F-04 | ยังวัด end-to-end ไม่ได้ | `backend/tests/test_statistics.py`, `frontend/src/App.test.jsx` | `NFR-PERF-01` | test ปัจจุบันวัด UI/mock ได้ภายใน 3 วินาที; ยังไม่มี source metrics จริงและ Login/Manage Account เต็มรูป จึงยังวัดจากยืนยันวันที่ถึงผลจาก API/source จริงไม่ได้ | รอ auth และ source จริง |
| F-05 | ใช้ข้อมูลจำลองเฉพาะวันที่ที่กำหนด | `backend/app/statistics.py` | `FR-STAT-02`, `FR-STAT-05`, `FR-STAT-07` | ระบบมีข้อมูลห้องจริงจาก `room_types`; ผู้เข้าชมและนัดหมายใช้ `MOCK_DAILY_STATS` แบบ record ต่อวัน ระบุ `data_source: synthetic_mock`; วันที่ไม่มี record เป็น empty, ไม่สร้างตัวเลขให้ทุกวัน | Prototype: แก้แล้ว; production source: รอทีม |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-02 | ตรวจ header `X-Owner-Id`, ไม่ใช้ owner ID จาก query; ไม่มี header 401 และ owner mismatched 403; client prototype ใช้ `owner-1` | `test_CON_AUTH_01_statistics_endpoints_reject_unverified_owner_ids` ผ่านกรณีไม่มี header/owner query; backend positive tests ใช้ header owner-1 ผ่าน; ยังต้องเชื่อม Login/Manage Account จริง |
| F-03 | ปรับส่วนหัวให้เรียงแนวตั้งบนจอแคบและแนวนอนบนจอกว้าง; ปรับกราฟเป็น 2 คอลัมน์บนโทรศัพท์และ 4 คอลัมน์ตั้งแต่จอเล็ก; เพิ่ม Playwright browser tests สำหรับโทรศัพท์ แท็บเล็ต และเดสก์ท็อป | `npm run test:responsive` ผ่าน 3 tests ใน Chromium ที่ 375×812, 768×1024 และ 1440×900; ตรวจไม่ให้หน้า/ตัวควบคุมล้นแนวนอน ตรวจจำนวนคอลัมน์ ขนาดตัวอักษรกราฟอย่างน้อย 12px และการมองเห็นข้อมูล/ตัวควบคุม |
