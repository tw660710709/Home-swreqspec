# Test cases: เข้าสู่ระบบ

อ้างอิง: [spec.md](./spec.md) `SPEC-LOGIN-001` `Draft v2`

คนออกแบบตารางนี้ AI เขียนโค้ด test ตามตารางด้วยคำสั่ง `/testcases`
- สถานะ: ร่าง (AI เสนอ ยังไม่มีใครตรวจ) / ใช้ได้ (ทีมตรวจแล้ว) / รอคำตอบ
- test ที่มาจากตารางนี้ ห้ามแก้ให้ผ่าน ถ้าไม่ผ่าน ต้องหาว่าโค้ดผิด หรือ AC ผิด (ถ้า AC ผิด แก้ spec ก่อน)

| TC ID | AC | แบบ | Given | When | Then (ตรวจอะไรบ้าง) | ตรวจด้วย | ชื่อ test | สถานะ |
|---|---|---|---|---|---|---|---|---|
| TC-LOGIN-01-1 | AC-LOGIN-01 | ทางปกติ | ผู้ใช้มีบัญชีที่ใช้งานได้ | กรอก username/email และ password ถูกต้องแล้วกด Login | ระบบตรวจสอบสำเร็จ สร้าง session และให้ผู้ใช้เข้าสู่ระบบได้; รายละเอียดการบันทึกสถานะ Login รอคำตอบ Q-02 (AC-LOGIN-01, FR-LOGIN-01, FR-LOGIN-02, FR-LOGIN-04, CON-LOGIN-01) | test ตาม stack, คน | `test_TC_LOGIN_01_1_valid_credentials_create_session` | รอ Q-02 |
| TC-LOGIN-01-2 | AC-LOGIN-01 | ขอบ: ใช้ตัวระบุบัญชีได้ทั้งสองแบบ | ผู้ใช้มีบัญชีที่ใช้งานได้และทราบ username กับ email ของบัญชี | Login ด้วย username และ password ที่ถูกต้อง แล้วทดสอบอีกครั้งด้วย email และ password ที่ถูกต้อง | ทั้งสองรูปแบบอนุญาตให้เข้าสู่ระบบและสร้าง session ได้ (FR-LOGIN-01, FR-LOGIN-02, FR-LOGIN-04) | test ตาม stack | `test_TC_LOGIN_01_2_username_or_email_can_login` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-02-1 | AC-LOGIN-02 | ทางปกติ: role ต่างกัน | มีบัญชีที่เข้าสู่ระบบได้สำหรับ role ที่กำหนดใน spec | Login ด้วยบัญชีแต่ละ role | ระบบนำผู้ใช้แต่ละบัญชีไปยังหน้าแรกตามสิทธิ์ของ role; ความหมายของ Guest และหน้าเป้าหมายเฉพาะของแต่ละ role รอคำตอบ Q-01 (AC-LOGIN-02, FR-LOGIN-05, CON-LOGIN-03) | test ตาม stack, คน | `test_TC_LOGIN_02_1_redirects_by_role` | รอ Q-01 |
| TC-LOGIN-03-1 | AC-LOGIN-03 | ทางผิด: username/email ไม่ถูกต้อง | ไม่มีบัญชีที่ตรงกับ username/email ที่กรอก | กรอก username/email ที่ไม่ถูกต้องและ password ใดก็ได้ แล้วกด Login | ระบบไม่สร้าง session และแสดงข้อความทั่วไปที่ไม่เปิดเผยว่าส่วนใดผิด (AC-LOGIN-03, FR-LOGIN-02, FR-LOGIN-06, NFR-SEC-03) | test ตาม stack | `test_TC_LOGIN_03_1_unknown_account_shows_generic_error` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-03-2 | AC-LOGIN-03 | ทางผิด: password ไม่ถูกต้อง | ผู้ใช้มีบัญชีที่ใช้งานได้ | กรอก username/email ถูกต้องแต่ password ไม่ถูกต้อง แล้วกด Login | ระบบไม่สร้าง session และแสดงข้อความที่ไม่เปิดเผยว่าส่วนใดผิด โดยไม่กำหนดว่าข้อความต้องตรงกับกรณี username/email ไม่ถูกต้องทุกประการ (FR-LOGIN-02, FR-LOGIN-06, NFR-SEC-03) | test ตาม stack | `test_TC_LOGIN_03_2_wrong_password_shows_generic_error` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-04-1 | AC-LOGIN-04 | ทางผิด: บัญชีถูกระงับ | บัญชีมีสถานะถูกระงับและข้อมูล Login ถูกต้อง | พยายาม Login ด้วยบัญชีดังกล่าว | ระบบไม่อนุญาตให้เข้าสู่ระบบและไม่สร้าง session; แจ้งว่าบัญชีถูกระงับพร้อมช่องทางติดต่อผู้ดูแลระบบ (AC-LOGIN-04, FR-LOGIN-03, CON-LOGIN-02) | test ตาม stack, คน | `test_TC_LOGIN_04_1_suspended_account_cannot_create_session` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-05-1 | AC-LOGIN-05 | ทางปกติ: สมัครสมาชิก | ผู้ใช้อยู่ที่หน้า Login และยังไม่มีบัญชี | เลือกช่องทางสมัครสมาชิก | ระบบนำผู้ใช้ไปยัง flow สมัครสมาชิกที่กำหนดไว้ โดยไม่ทดสอบรายละเอียดการสมัครสมาชิกซึ่งอยู่นอกขอบเขต (AC-LOGIN-05, FR-LOGIN-07) | test ตาม stack, คน | `test_TC_LOGIN_05_1_registration_link_opens_registration_flow` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-06-1 | AC-LOGIN-06 | ทางปกติ: ลืมรหัสผ่าน | ผู้ใช้อยู่ที่หน้า Login และจำรหัสผ่านไม่ได้ | เลือก "ลืมรหัสผ่าน" | ระบบนำผู้ใช้ไปยัง flow สำหรับรีเซ็ตรหัสผ่าน โดยไม่ทดสอบรายละเอียดการรีเซ็ตซึ่งอยู่นอกขอบเขต (AC-LOGIN-06, FR-LOGIN-08) | test ตาม stack, คน | `test_TC_LOGIN_06_1_password_reset_link_opens_reset_flow` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-07-1 | AC-LOGIN-07 | ทางผิด: ไม่มี session | ผู้ใช้ไม่มี session ที่ใช้งานได้ | พยายามเข้าถึงฟังก์ชันที่กำหนดให้เฉพาะผู้ที่เข้าสู่ระบบแล้ว | ระบบไม่อนุญาตให้เข้าถึงและนำผู้ใช้ไปยังหน้า Login; รายการฟังก์ชันที่ต้องมี session รอคำตอบ Q-02 (AC-LOGIN-07, FR-LOGIN-09) | test ตาม stack | `test_TC_LOGIN_07_1_protected_function_requires_session` | รอ Q-02 |
| TC-LOGIN-07-2 | AC-LOGIN-07 | ขอบ: session ใช้งานได้ | ผู้ใช้มี session ที่ใช้งานได้ | เข้าถึงฟังก์ชันที่ต้อง Login | ระบบไม่ปฏิเสธผู้ใช้ด้วยเหตุว่าไม่มี session (FR-LOGIN-09) | test ตาม stack | `test_TC_LOGIN_07_2_valid_session_allows_access` | ร่าง (AI เสนอ ยังไม่มีใครตรวจ) |
| TC-LOGIN-08-1 | AC-LOGIN-08 | ทางปกติ: เวลาตอบสนอง | ระบบอยู่ในสภาวะการใช้งานปกติ | ส่งคำขอ Login และวัดเวลาตอบสนอง | ระบบตอบสนองภายใน 2 วินาที (AC-LOGIN-08, NFR-PERF-01); เงื่อนไขการวัดรอคำตอบ Q-04 | test ตาม stack | `test_TC_LOGIN_08_1_login_response_within_two_seconds` | รอ Q-04 |
| TC-LOGIN-08-2 | AC-LOGIN-08 | ขอบ: response เท่ากับเกณฑ์ | วัดเวลาตอบสนองคำขอ Login ได้ 2 วินาที | ตรวจผลเทียบกับเกณฑ์ | ผลที่เท่ากับ 2 วินาทีอยู่ในเกณฑ์ผ่าน เพราะ spec กำหนดให้เสร็จสิ้นภายใน 2 วินาที (NFR-PERF-01); เงื่อนไขการวัดรอคำตอบ Q-04 | test ตาม stack | `test_TC_LOGIN_08_2_response_at_two_seconds_meets_limit` | รอ Q-04 |

ข้อจำกัดการทดสอบ:
- การตรวจรหัสผ่านที่จัดเก็บและการเข้ารหัส HTTPS/TLS ต้องตรวจจากสภาพแวดล้อมที่ระบบจัดเก็บข้อมูลและให้บริการจริงได้ ไม่สรุปผลจาก mock เพียงอย่างเดียว (CON-SEC-01, CON-SEC-02, NFR-SEC-01, NFR-SEC-02)
- spec ไม่ได้ระบุ workload สำหรับวัดเวลาตอบสนอง จึงทดสอบตามสภาวะปกติที่ทีมยืนยันก่อนวัด และไม่เพิ่มเกณฑ์ workload เอง (NFR-PERF-01)
- การตรวจ password storage และ HTTPS/TLS รอหลักฐานตรวจรับตาม Q-05
