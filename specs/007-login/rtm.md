# RTM: เข้าสู่ระบบ

อ้างอิง: [spec.md](./spec.md) `SPEC-LOGIN-001` `Draft v2` | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| `FR-LOGIN-01` | `AC-LOGIN-01` | T-01, T-02 | ยังไม่มีโค้ด | `test_TC_LOGIN_01_1_valid_credentials_create_session`, `test_TC_LOGIN_01_2_username_or_email_can_login` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `FR-LOGIN-02` | `AC-LOGIN-01`, `AC-LOGIN-03` | T-02, T-04 | ยังไม่มีโค้ด | `test_TC_LOGIN_01_1_valid_credentials_create_session`, `test_TC_LOGIN_03_1_unknown_account_shows_generic_error`, `test_TC_LOGIN_03_2_wrong_password_shows_generic_error` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `FR-LOGIN-03` | `AC-LOGIN-04` | T-02 | ยังไม่มีโค้ด | `test_TC_LOGIN_04_1_suspended_account_cannot_create_session` — ยังไม่ทดสอบ; ตรวจข้อความและช่องทางติดต่อผู้ดูแลระบบ | ยังไม่เริ่ม |
| `FR-LOGIN-04` | `AC-LOGIN-01` | T-02, T-03 | ยังไม่มีโค้ด | `test_TC_LOGIN_01_1_valid_credentials_create_session` — รอ Q-02 เรื่องข้อมูลสถานะ Login | รอ Q-02 |
| `FR-LOGIN-05` | `AC-LOGIN-02` | T-03 | ยังไม่มีโค้ด | `test_TC_LOGIN_02_1_redirects_by_role` — รอ Q-01 เรื่อง Guest และหน้าเป้าหมาย | รอ Q-01 |
| `FR-LOGIN-06` | `AC-LOGIN-03` | T-04 | ยังไม่มีโค้ด | `test_TC_LOGIN_03_1_unknown_account_shows_generic_error`, `test_TC_LOGIN_03_2_wrong_password_shows_generic_error` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `FR-LOGIN-07` | `AC-LOGIN-05` | T-05 | ยังไม่มีโค้ด | `test_TC_LOGIN_05_1_registration_link_opens_registration_flow` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `FR-LOGIN-08` | `AC-LOGIN-06` | T-05 | ยังไม่มีโค้ด | `test_TC_LOGIN_06_1_password_reset_link_opens_reset_flow` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `FR-LOGIN-09` | `AC-LOGIN-07` | T-06 | ยังไม่มีโค้ด | `test_TC_LOGIN_07_1_protected_function_requires_session`, `test_TC_LOGIN_07_2_valid_session_allows_access` — รายการฟังก์ชันรอ Q-02 | รอ Q-02 |
| `NFR-USE-01` | ไม่มี AC | T-07 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; เกณฑ์ประเมินรอ Q-03 | รอ Q-03 |
| `NFR-PERF-01` | `AC-LOGIN-08` | T-09 | ยังไม่มีโค้ด | `test_TC_LOGIN_08_1_login_response_within_two_seconds`, `test_TC_LOGIN_08_2_response_at_two_seconds_meets_limit` — เงื่อนไขการวัดรอ Q-04 | รอ Q-04 |
| `NFR-SEC-01` | ไม่มี AC | T-08 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; หลักฐานตรวจรับรอ Q-05 | รอ Q-05 |
| `NFR-SEC-02` | ไม่มี AC | T-08 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; หลักฐานตรวจรับรอ Q-05 | รอ Q-05 |
| `NFR-SEC-03` | `AC-LOGIN-03` | T-04 | ยังไม่มีโค้ด | `test_TC_LOGIN_03_1_unknown_account_shows_generic_error`, `test_TC_LOGIN_03_2_wrong_password_shows_generic_error` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `CON-ACC-01` | ไม่มี AC | T-01, T-02 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; ต้องมีบัญชีที่ลงทะเบียนก่อน Login | ยังไม่เริ่ม |
| `CON-LOGIN-01` | `AC-LOGIN-01` | T-02 | ยังไม่มีโค้ด | `test_TC_LOGIN_01_1_valid_credentials_create_session` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `CON-LOGIN-02` | `AC-LOGIN-04` | T-02 | ยังไม่มีโค้ด | `test_TC_LOGIN_04_1_suspended_account_cannot_create_session` — ยังไม่ทดสอบ | ยังไม่เริ่ม |
| `CON-LOGIN-03` | `AC-LOGIN-02` | T-03 | ยังไม่มีโค้ด | `test_TC_LOGIN_02_1_redirects_by_role` — หน้าเป้าหมายรอ Q-01 | รอ Q-01 |
| `CON-SEC-01` | ไม่มี AC | T-01, T-08 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; หลักฐานตรวจรับรอ Q-05 | รอ Q-05 |
| `CON-SEC-02` | ไม่มี AC | T-08 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; หลักฐานตรวจรับรอ Q-05 | รอ Q-05 |
| `CON-UI-01` | ไม่มี AC | T-07 | ยังไม่มีโค้ด | ยังไม่ทดสอบ; รายการอุปกรณ์ที่รองรับรอ Q-03 | รอ Q-03 |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

ขณะนี้ repository ยังไม่มีโค้ดของ UC-07 จึงยังไม่มีรายการให้เชื่อมกลับไปยัง requirement ใน `spec.md` เมื่อเริ่มพัฒนา ให้เพิ่มไฟล์/ฟังก์ชันที่ทำงานจริงในตารางนี้ พร้อม ID ที่รองรับและ test ที่ใช้ตรวจ

## 3. สิ่งที่ยังไม่ทำ

- ยังต้องพัฒนา requirements และทดสอบตาม `tasks.md`; หลังมีโค้ดและผลทดสอบ ให้อัปเดตทั้งตารางตามรอยไปข้างหน้าและย้อนกลับ
- Open Questions `Q-01` ถึง `Q-05` ใน `spec.md` ยังไม่ได้รับคำตอบ; งานที่เกี่ยวข้องถูกระบุสถานะรอคำตอบในตาราง
- ต้องตรวจ password storage และ HTTPS/TLS ในสภาพแวดล้อมที่ใช้งานจริง ไม่สรุปผลจาก mock เพียงอย่างเดียว
- `NFR-PERF-01` กำหนดเวลาตอบสนองไม่เกิน 2 วินาทีในสภาวะปกติ แต่ไม่ได้กำหนด workload สำหรับการวัด; ให้ทีมกำหนด workload ก่อนทดสอบและห้ามเพิ่มเกณฑ์เอง
