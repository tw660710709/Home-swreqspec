# RTM: ดูสถิติหอพัก
อ้างอิง: [spec.md](./spec.md) `Draft v2` | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
ตรวจด้วย `/verify` เมื่อ 2569-11-12 19:26 +00:00 | test: backend 47 ผ่าน, frontend 31 ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| `FR-STAT-01` | `AC-STAT-01` | T-03 | `frontend/src/App.jsx`: route `/dorms/:id/statistics`; `frontend/src/pages/DormitoryStatisticsPage.jsx`: `DormitoryStatisticsPage` | `test_AC_STAT_01_dashboard_displays_summary_metrics` — ผ่าน | ครบ |
| `FR-STAT-02` | `AC-STAT-01` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: `SummaryCard`, chart rendering; backend statistics endpoint | UI tests ใช้ mock; endpoint จริงคืน 401 ระหว่างรอ auth (`F-02`); เมื่อเชื่อม auth แล้วก็ยังต้องมี source สำหรับผู้เข้าชม/นัดหมาย (`F-01`) | ช่องโหว่ |
| `FR-STAT-03` | `AC-STAT-02` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: room count cards; backend statistics endpoint ถูกปิดกั้นจนกว่าจะมี auth | UI tests ใช้ mock; API จริงตอบ 401 ก่อนอ่านสถานะห้องได้ (`F-02`) | ยังไม่ถึง |
| `FR-STAT-04` | `AC-STAT-03` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: date-range validation; backend endpoint ถูกปิดกั้นจนกว่าจะมี auth | `test_AC_STAT_03_invalid_date_range_is_rejected_without_search` ตรวจช่วงวันที่ผิดใน UI; ยังดึงสถิติช่วงที่ถูกต้องไม่ได้ (`F-02`) | ยังไม่ถึง |
| `FR-STAT-05` | `AC-STAT-03` | T-02, T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: `loadStatistics`; backend statistics endpoint | ไม่มีแหล่งข้อมูล page views/appointments (`F-01`); endpoint ปัจจุบันตอบ 401 จนกว่าจะเชื่อม auth (`F-02`) | ช่องโหว่ |
| `FR-STAT-06` | `AC-STAT-04` | T-04 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: empty-state UI; backend statistics endpoint ถูกปิดกั้นจนกว่าจะมี auth | UI tests ใช้ mock; API จริงตอบ 401 ก่อนคืนผล empty state (`F-02`) | ยังไม่ถึง |
| `FR-STAT-07` | `AC-STAT-05` | T-04 | `frontend/src/api/client.js`: `downloadDormitoryStatisticsReport`; backend report endpoint ถูกปิดกั้นจนกว่าจะมี auth | download UI test ใช้ mock; API จริงตอบ 401 (`F-02`) และ source metrics ยังไม่ครบ (`F-01`) | ยังไม่ถึง |
| `NFR-USE-01` | ไม่มี AC | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: responsive header, summary cards, chart; `frontend/tests/browser/statistics-responsive.e2e.js` | `test_NFR_USE_01_dashboard_is_readable_at_phone`, `_tablet`, `_desktop` — ผ่าน; ตรวจการล้นแนวนอน การจัดคอลัมน์ ขนาดตัวอักษรกราฟ และการมองเห็นตัวควบคุมใน Chromium | ครบ |
| `NFR-PERF-01` | `AC-STAT-03` | T-05 | `backend/app/statistics.py`: statistics endpoints; `frontend/src/pages/DormitoryStatisticsPage.jsx`: submit flow | `test_NFR_PERF_01_statistics_render_within_three_seconds` วัดเฉพาะ UI ที่ใช้ mock; API จริงปฏิเสธด้วย 401 ระหว่างรอ auth (`F-02`) และยังไม่มี source metrics (`F-01`), จึงยังวัด end-to-end ตาม NFR ไม่ได้ (`F-04`) | ช่องโหว่ |
| `CON-UI-01` | `AC-STAT-01` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: summary cards, chart, date inputs, alerts | browser tests ตรวจการมองเห็นของข้อมูล/ตัวควบคุม ขนาดตัวอักษรกราฟ และการไม่ล้นจอที่ 375, 768 และ 1440 px — ผ่าน | ครบ |
| `CON-AUTH-01` | `AC-STAT-01` | T-01, T-02 | `backend/app/statistics.py`: `_require_authenticated_owner` | ทุก endpoint ปฏิเสธคำขอด้วย 401 จนกว่าจะเชื่อม Login/Manage Account; ไม่ใช้ `owner_id` จาก query เป็นหลักฐานสิทธิ์ (`F-02`) | ยังไม่ถึง |

**สรุปสถานะ:** ครบ 3 แถว, ยังไม่ถึง 5, รอ Q 0, ช่องโหว่ 3 แถว (รวม 11 แถว)

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/statistics.py`: `_require_authenticated_owner`, statistics endpoints | `CON-AUTH-01` | ปิดกั้นชั่วคราว | ทุก endpoint ตอบ 401 โดยไม่อ่านข้อมูลหรือเชื่อ owner ID จาก query; รอ Login/Manage Account ก่อนเปิดการเข้าถึง |
| `frontend/src/pages/DormitoryStatisticsPage.jsx`: `DormitoryStatisticsPage` | `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-06`, `FR-STAT-07`, `CON-UI-01`, `NFR-USE-01` | บางส่วน | browser tests ยืนยัน responsive/readability ที่ viewport โทรศัพท์ แท็บเล็ต และเดสก์ท็อป; API ยังถูกปิดกั้นชั่วคราวตาม `F-02` |
| `frontend/src/api/client.js`: `getDormitoryStatistics`, `downloadDormitoryStatisticsReport` | `FR-STAT-01`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-07`, `CON-AUTH-01` | ตรง | ไม่ส่ง owner ID จาก client; API ตอบ 401 จนกว่าจะเชื่อมกับ auth source |

## 3. ข้อค้นพบ

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | แหล่งข้อมูลยังไม่ครบ | `backend/app/statistics.py`, `backend/app/statistics_contract.py` | `FR-STAT-02`, `FR-STAT-05`, `FR-STAT-07` | ไม่มี source สำหรับผู้เข้าชม/นัดหมายตามคำตอบทีมให้รอระบุ; optional fields ใน contract รองรับ `null` แต่ endpoint ถูกปิดกั้นด้วย 401 ตาม F-02 จึงยังแสดง/ส่งออกตัวเลขจริงไม่ได้ และต้องเชื่อม source ก่อนเปิดใช้งานสถิติ | รอทีมระบุแหล่งข้อมูล |
| F-04 | ยังวัด end-to-end ไม่ได้ | `backend/tests/test_statistics.py`, `frontend/src/App.test.jsx` | `NFR-PERF-01` | test ปัจจุบันวัดเฉพาะ UI ด้วย mock; API จริงตอบ 401 จนกว่าจะเชื่อม Login/Manage Account (`F-02`) และไม่มี source metrics ที่ต้องแสดง (`F-01`) จึงยังวัดเวลาจากกดยืนยันจนแสดงสถิติครบจาก API จริงไม่ได้; ทีมเลือกเลื่อนการทดสอบไว้จนกว่า auth และข้อมูลจริงจะพร้อม | รอ auth และ source จริง |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-02 | ปิดกั้น statistics, room-status, date-range และ report endpoints ด้วย 401; เอา `owner_id` จาก URL/client ออก โดยไม่ใช้ค่าที่ผู้เรียกส่งเป็นหลักฐานสิทธิ์ | `test_CON_AUTH_01_statistics_endpoints_reject_unverified_owner_ids` ตรวจทั้ง 4 endpoint โดยไม่ส่ง owner ID, ส่ง owner ID ตรง และส่ง owner ID ปลอม; ยังต้องเชื่อม Login/Manage Account ก่อนเจ้าของจริงจะเข้าถึงได้ |
| F-03 | ปรับส่วนหัวให้เรียงแนวตั้งบนจอแคบและแนวนอนบนจอกว้าง; ปรับกราฟเป็น 2 คอลัมน์บนโทรศัพท์และ 4 คอลัมน์ตั้งแต่จอเล็ก; เพิ่ม Playwright browser tests สำหรับโทรศัพท์ แท็บเล็ต และเดสก์ท็อป | `npm run test:responsive` ผ่าน 3 tests ใน Chromium ที่ 375×812, 768×1024 และ 1440×900; ตรวจไม่ให้หน้า/ตัวควบคุมล้นแนวนอน ตรวจจำนวนคอลัมน์ ขนาดตัวอักษรกราฟอย่างน้อย 12px และการมองเห็นข้อมูล/ตัวควบคุม |
