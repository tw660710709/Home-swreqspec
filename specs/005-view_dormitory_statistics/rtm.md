# RTM: ดูสถิติหอพัก
อ้างอิง: [spec.md](./spec.md) `Draft v2` | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)
ตรวจด้วย `/verify` เมื่อ 2569-11-12 19:26 +00:00 | test: backend 47 ผ่าน, frontend 31 ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| `FR-STAT-01` | `AC-STAT-01` | T-03 | `frontend/src/App.jsx`: route `/dorms/:id/statistics`; `frontend/src/pages/DormitoryStatisticsPage.jsx`: `DormitoryStatisticsPage` | `test_AC_STAT_01_dashboard_displays_summary_metrics` — ผ่าน | ครบ |
| `FR-STAT-02` | `AC-STAT-01` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: `SummaryCard`, chart rendering; `backend/app/statistics.py`: summary metrics | แสดง Summary Cards และกราฟได้; ตัวเลขผู้เข้าชม/นัดหมายยังไม่มีแหล่งข้อมูลและแสดง empty state (`F-01`) | ช่องโหว่ |
| `FR-STAT-03` | `AC-STAT-02` | T-03 | `backend/app/statistics.py`: `_coerce_room_status`, `get_room_status`; `frontend/src/pages/DormitoryStatisticsPage.jsx`: room counts | `test_AC_STAT_02_dashboard_displays_current_room_status_counts`, `test_room_status_endpoint_returns_current_counts`, `test_statistics_endpoint_returns_room_status_and_empty_range` — ผ่าน; นับจากรายการห้องใน SQLite | ครบ |
| `FR-STAT-04` | `AC-STAT-03` | T-03 | `backend/app/statistics.py`: `get_dormitory_statistics`; `frontend/src/pages/DormitoryStatisticsPage.jsx`: validation on submit | `test_AC_STAT_03_invalid_date_range_is_rejected_without_search`, `test_statistics_endpoint_returns_room_status_and_empty_range` — ผ่าน | ครบ |
| `FR-STAT-05` | `AC-STAT-03` | T-02, T-03 | `backend/app/statistics.py`: `_get_range_metrics`, `get_dormitory_statistics`; `frontend/src/pages/DormitoryStatisticsPage.jsx`: `loadStatistics` | ไม่มี source สำหรับ page views/appointments ในระบบ; backend จึงคืน zero พร้อม `empty_data=true` ตามคำตอบทีมให้รอแหล่งข้อมูล (`F-01`) | ช่องโหว่ |
| `FR-STAT-06` | `AC-STAT-04` | T-04 | `backend/app/statistics.py`: `empty_data` flag; `frontend/src/pages/DormitoryStatisticsPage.jsx`: empty-state UI | `test_AC_STAT_04_no_statistics_data_shows_message`, `test_AC_STAT_04_zero_metrics_with_data_are_displayed`, `test_statistics_endpoint_marks_range_without_records_as_empty` — ผ่าน | ครบ |
| `FR-STAT-07` | `AC-STAT-05` | T-04 | `backend/app/statistics.py`: `download_dormitory_statistics_report`; `frontend/src/api/client.js`: `downloadDormitoryStatisticsReport` | CSV ใช้สถานะห้องจาก SQLite แต่จำนวน page views/appointments ยังไม่มี source จึงส่งค่า 0 (`F-01`) | ช่องโหว่ |
| `NFR-USE-01` | ไม่มี AC | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: responsive layout, date inputs, summary cards | ไม่มีผลตรวจอ่านได้บนโทรศัพท์ แท็บเล็ต และเดสก์ท็อป; jsdom tests ไม่ยืนยันการแสดงผล responsive (`F-03`) | ช่องโหว่ |
| `NFR-PERF-01` | `AC-STAT-03` | T-05 | `backend/app/statistics.py`: statistics endpoint; `frontend/src/pages/DormitoryStatisticsPage.jsx`: submit flow | API test ใช้ ASGITransport และ UI test mock API; ไม่ได้วัดการแสดงผลครบจากการกดยืนยันถึงข้อมูลจริง (`F-04`) | ช่องโหว่ |
| `CON-UI-01` | `AC-STAT-01` | T-03 | `frontend/src/pages/DormitoryStatisticsPage.jsx`: summary cards, chart, date inputs, alerts | มี assertions ของข้อความ/ตัวเลข แต่ไม่มีการตรวจยืนยันความอ่านง่ายและชัดเจน (`F-03`) | ช่องโหว่ |
| `CON-AUTH-01` | `AC-STAT-01` | T-01, T-02 | `backend/app/statistics_contract.py`: `can_access_dormitory_statistics`, `ensure_dormitory_access`; `backend/app/statistics.py`: owner checks | Test ปฏิเสธ owner ID ที่ไม่ตรง แต่ API รับ `owner_id` จาก query โดยไม่มีการยืนยันตัวตน ทำให้ผู้เรียกปลอม owner ID ได้ (`F-02`) | ช่องโหว่ |

**สรุปสถานะ:** ครบ 4 แถว, ยังไม่ถึง 0, รอ Q 0, ช่องโหว่ 7 แถว (รวม 11 แถว)

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/statistics.py`: `get_dormitory_statistics` | `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-06`, `CON-AUTH-01` | บางส่วน | รูปแบบ response, date range และ empty state ตาม spec; metrics ช่วงเวลายังไม่มี source และ identity มาจาก query (`F-01`, `F-02`) |
| `backend/app/statistics.py`: `_coerce_room_status`, `get_room_status` | `FR-STAT-03` | ตรง | นับสถานะจากรายการห้องที่อ่านจาก SQLite |
| `backend/app/statistics.py`: `download_dormitory_statistics_report` | `FR-STAT-07`, `CON-AUTH-01` | บางส่วน | สร้าง CSV ตามช่วงที่เลือก; สถานะห้องมาจาก SQLite แต่ metrics ช่วงเวลายังไม่มี source และ owner identity ไม่ได้ยืนยันจากการเข้าสู่ระบบ (`F-01`, `F-02`) |
| `backend/app/statistics_contract.py`: `validate_statistics_date_range` | `FR-STAT-04`, `FR-STAT-05`, `AC-STAT-03` | ตรง | ตรวจวันที่สิ้นสุดไม่ต่ำกว่าวันที่เริ่มต้น และรวมทั้งสองวันที่ในการคำนวณ |
| `frontend/src/pages/DormitoryStatisticsPage.jsx`: `DormitoryStatisticsPage` | `FR-STAT-01`, `FR-STAT-02`, `FR-STAT-03`, `FR-STAT-04`, `FR-STAT-06`, `FR-STAT-07`, `CON-UI-01`, `NFR-USE-01` | บางส่วน | แสดง dashboard และ interaction ตามข้อกำหนด; ยังไม่มีการยืนยัน responsive/readability บนอุปกรณ์เป้าหมาย (`F-03`) |
| `frontend/src/api/client.js`: `getDormitoryStatistics`, `downloadDormitoryStatisticsReport` | `FR-STAT-01`, `FR-STAT-04`, `FR-STAT-05`, `FR-STAT-07` | ตรง | เรียก API และแปลง error ตามข้อความ response |

## 3. ข้อค้นพบ

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | แหล่งข้อมูลยังไม่ครบ | `backend/app/statistics.py` | `FR-STAT-02`, `FR-STAT-05`, `FR-STAT-07` | ลบ `ROOM_STATUS_BY_DORM` และ `DATE_METRICS_BY_DORM` แล้ว; สถานะห้องอ่านจาก SQLite ส่วนผู้เข้าชม/นัดหมายไม่มีแหล่งข้อมูลในระบบและคืน zero พร้อม `empty_data=true` ตามคำตอบทีมให้รอแหล่งข้อมูล จึงยังแสดงสถิติสองรายการนี้จริงไม่ได้ | รอทีมระบุแหล่งข้อมูล |
| F-02 | ละเมิด Constraint | `backend/app/statistics.py`: endpoints ทั้งหมด | `CON-AUTH-01` | API ใช้ `owner_id` ที่ผู้เรียกส่งเป็น query parameter เป็นหลักฐานสิทธิ์ โดยไม่มี authentication/session identity; ผู้เรียกสามารถปลอม `owner_id` ของเจ้าของหอพักได้ | |
| F-03 | test อ่อน | `frontend/src/pages/DormitoryStatisticsPage.jsx`, tests frontend | `NFR-USE-01`, `CON-UI-01` | มี responsive classes แต่ test ใน jsdom ตรวจเพียงข้อความ/ตัวเลข ไม่ยืนยันว่าอ่านได้และใช้งานได้บนโทรศัพท์ แท็บเล็ต และเดสก์ท็อป | |
| F-04 | test อ่อน | `backend/tests/test_statistics.py`, `frontend/src/App.test.jsx` | `NFR-PERF-01` | backend วัดผ่าน ASGITransport และ frontend ใช้ mock API; tests จึงไม่วัดเวลาจริงตั้งแต่ยืนยันช่วงวันจนแสดงผลสถิติครบจาก API จริงตาม NFR | |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| - | - | - |
