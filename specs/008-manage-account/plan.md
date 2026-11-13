# แผนทางเทคนิค: จัดการบัญชีผู้ใช้

ไฟล์ข้อกำหนดอ้างอิง: [spec.md](./spec.md)

Spec ID: `SPEC-ACCOUNT-001` | สถานะข้อกำหนด: `Draft v2`

## 1. สรุปแนวทาง

1. ให้ Resident ดูข้อมูลบัญชีปัจจุบันและแก้ชื่อ เบอร์โทรศัพท์ และอีเมลตาม `FR-ACCOUNT-01` ถึง `FR-ACCOUNT-05`.
2. แยก flow เปลี่ยนรหัสผ่าน ตรวจรหัสผ่านเดิม ใช้ Argon2 และยกเลิก session ปัจจุบันตาม `FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-SEC-01` และ `CON-SEC-02`.
3. ยกเลิกได้เฉพาะการแก้ข้อมูลส่วนตัว และป้องกันการเข้าถึงโดยไม่มี session/ไม่มีสิทธิ์ตาม `FR-ACCOUNT-08`, `FR-ACCOUNT-09` และ `NFR-SEC-02`.
4. ใช้ React/Vite, FastAPI และ SQLite ที่พบใน repository; ใช้ authentication/session identity เป็น dependency ของ UC-07.
5. รองรับ layout หลายอุปกรณ์และการตอบสนองภายใน 2 วินาที; คง Q-01 ถึง Q-03 ไว้โดยไม่กำหนดคำตอบแทนทีม.

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React 18 / Vite 6 / React Router | ทีมเลือกเอง ไม่ได้มาจาก spec | พบใน `frontend/package.json`; ใช้สร้างหน้า Manage Account |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | พบใน `backend/requirements.txt`; ใช้ทำ API และ validation ฝั่ง server |
| SQLite ผ่าน `sqlite3` | ทีมเลือกเอง ไม่ได้มาจาก spec | พบใน `backend/app/database.py`; User/Session schema ยังไม่มีและเป็น dependency จาก UC-07 |
| Argon2 salted password hash | `CON-SEC-02` | ทีมเลือก Argon2; ห้ามจัดเก็บ password แบบ plain text และรับส่งผ่าน HTTPS ตาม `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01` |
| Session/token ที่ตรวจสอบฝั่ง server | `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `NFR-SEC-02` | พึ่งพาการจัดให้จาก UC-07; ไม่เลือกชนิด session/token ซ้ำใน UC-08 |
| pytest และ Vitest/Testing Library | ทีมเลือกเอง ไม่ได้มาจาก spec | พบในชุดทดสอบปัจจุบัน; ใช้ตรวจ backend และ frontend ตาม AC |

หมายเหตุเกี่ยวกับโครงสร้างปัจจุบัน: ยังไม่พบ User/Session table หรือ authentication dependency ที่พร้อมใช้; owner API ใช้ `X-Owner-Id` แบบ prototype ซึ่งไม่ใช่ identity สำหรับ UC-08. UC-07 มี plan สำหรับ User/Session แต่ยังไม่มี implementation; จึงต้องเชื่อมกับ contract จาก UC-07 ก่อนใช้งานจริง. ไม่พบ `specs/000-shared/`.

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก/บทบาท | รองรับ |
|---|---|---|
| `User` จาก UC-07 | `id`, `username`, `email`, `password_hash`, `role`, `account_status` ตามโมเดลใน plan UC-07; UC-08 ใช้/เพิ่ม `name`, `phone` | `FR-ACCOUNT-01`, `FR-ACCOUNT-02`, `FR-ACCOUNT-04`, `FR-ACCOUNT-06`, `FR-ACCOUNT-07` |
| Session/token จาก UC-07 | ตัวตนที่ตรวจสอบบน server และข้อมูลที่จำเป็นต่อการยกเลิก session ปัจจุบันหลังเปลี่ยนรหัสผ่าน | `FR-ACCOUNT-09`, `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `NFR-SEC-02`, `AC-ACCOUNT-02`, `AC-ACCOUNT-07` |

กติกาข้อมูล:

- ใช้ identity จาก session/token ที่ UC-07 ตรวจสอบฝั่ง server; ไม่รับ user ID เป้าหมายจาก client (`CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `NFR-SEC-02`).
- เพิ่ม/ใช้ข้อมูล `name`, `phone`, `email` กับ User ที่แชร์กับ UC-07; requiredness และกฎตรวจชื่อ/required fields ยังไม่กำหนดจนได้คำตอบ `Q-01` (`FR-ACCOUNT-02`, `FR-ACCOUNT-03`).
- ตรวจเบอร์โทรศัพท์เป็นตัวเลข 10 หลักและตรวจรูปแบบอีเมลตาม spec ก่อนบันทึก (`FR-ACCOUNT-03`, `CON-ACCOUNT-03`).
- เปลี่ยน password ด้วย Argon2 hash หลังตรวจ password เดิมและ validation; ห้ามจัดเก็บ password แบบ plain text และรับส่งข้อมูลผ่าน HTTPS (`FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-ACCOUNT-04`, `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01`).
- ไม่ส่ง `password_hash` กลับไปยัง frontend (`NFR-SEC-01`).

## 4. API / หน้าจอ

| รายการ | Input หลัก | Output หลัก | รองรับ |
|---|---|---|---|
| `GET /account` | identity จาก session/token ที่ UC-07 ตรวจสอบแล้ว | ข้อมูลบัญชีปัจจุบัน โดยไม่ส่ง password/hash กลับ | `FR-ACCOUNT-01`, `NFR-SEC-02` |
| `PUT /account` | `name`, `phone`, `email`; ไม่รับ user ID จาก client; ตรวจเบอร์ 10 หลักและรูปแบบอีเมล | ข้อมูลล่าสุดหรือ field validation errors | `FR-ACCOUNT-02`, `FR-ACCOUNT-03`, `FR-ACCOUNT-04`, `FR-ACCOUNT-05`, `CON-ACCOUNT-02`, `CON-ACCOUNT-03` |
| `PUT /account/password` | current password, new password, confirmation; identity จาก UC-07 | ผลสำเร็จ/validation error; เมื่อสำเร็จยกเลิก session ปัจจุบันและนำผู้ใช้ไป Login | `FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-ACCOUNT-04`, `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01` |
| Authorization dependency | verified session/token และ account ownership | ไม่มี session: ปฏิเสธและนำ UI ไป Login; authenticated แต่ไม่มีสิทธิ์: HTTP 403 | `FR-ACCOUNT-09`, `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `NFR-SEC-02` |
| หน้า Manage Account | ข้อมูลบัญชีปัจจุบัน; form ข้อมูลส่วนตัวและ form รหัสผ่านแยกกัน | แสดงข้อมูลล่าสุด, success/error, responsive layout | `FR-ACCOUNT-01`, `FR-ACCOUNT-05`, `FR-ACCOUNT-08`, `NFR-USE-01`, `CON-UI-01` |
| ปุ่มยกเลิกข้อมูลส่วนตัว | ค่า form ที่แก้ไขในหน้าเท่านั้น | คืนค่าข้อมูลเดิมโดยไม่ส่ง update; ไม่ยกเลิก flow เปลี่ยนรหัสผ่าน | `FR-ACCOUNT-08` |

แนวทางหน้าจอและ API:

- หลัง auth dependency จาก UC-07 ยืนยันตัวตนแล้ว อ่าน/แก้ได้เฉพาะบัญชีของ Resident ปัจจุบัน; คำขอไปยังบัญชีอื่นต้องถูกปฏิเสธด้วย HTTP 403 โดยไม่มีการเปลี่ยนข้อมูล (`CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `NFR-SEC-02`, `AC-ACCOUNT-07`).
- หากไม่มี session ให้ปฏิเสธ API และนำผู้ใช้ไปหน้า Login ผ่าน frontend (`FR-ACCOUNT-09`, `AC-ACCOUNT-07`).
- แยกส่วนแก้ข้อมูลส่วนตัวกับเปลี่ยนรหัสผ่าน; ปุ่มยกเลิกคืนเฉพาะข้อมูลส่วนตัวและไม่เรียก API update (`FR-ACCOUNT-08`, `NFR-USE-01`, `AC-ACCOUNT-06`).
- ใช้ HTTPS สำหรับการรับส่ง; response ของ profile/password ห้ามมี password/hash (`CON-SEC-02`, `NFR-SEC-01`).
- ชื่อ path/method เป็นข้อเสนอทางเทคนิคจาก plan เดิมและรูปแบบ API ปัจจุบัน ไม่เพิ่ม behavior นอก spec; ปรับให้ตรง contract ของ UC-07 ก่อน implementation ได้.

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-ACCOUNT-01` | Auth dependency จาก UC-07 สำหรับอ่าน/แก้ไขบัญชี | ใช้แล้ว |
| `CON-ACCOUNT-02` | ใช้ identity จาก server; ไม่รับ user ID จาก client; ตรวจ ownership และตอบ 403 | ใช้แล้ว |
| `CON-ACCOUNT-03` | Validate input ฝั่ง backend ก่อนเขียน SQLite และแสดง field errors | ใช้แล้ว |
| `CON-ACCOUNT-04` | ตรวจ current password ก่อนเปลี่ยนรหัสผ่าน | ใช้แล้ว |
| `CON-SEC-01` | จัดเก็บ Argon2 hash แทน plain text และไม่ส่ง hash ไป frontend | ใช้แล้ว |
| `CON-SEC-02` | จัดเก็บ salted Argon2 hash และใช้ HTTPS สำหรับการรับส่ง | ใช้แล้ว |
| `CON-UI-01` | หน้า Manage Account ปรับตามขนาดจอมือถือ แท็บเล็ต และคอมพิวเตอร์ | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-ACCOUNT-01` | `test_AC_ACCOUNT_01_profile_display_update_responsive` | ตรวจข้อมูลปัจจุบัน การแก้ไข/บันทึก/แสดงข้อมูลล่าสุด และ layout แยกส่วนบน viewport มือถือ แท็บเล็ต และคอมพิวเตอร์ |
| `AC-ACCOUNT-02` | `test_AC_ACCOUNT_02_change_password_and_invalidate_session` | ใช้ current password ถูกต้องและรหัสผ่านใหม่ยาวอย่างน้อย 8 ตัวอักษร; ตรวจ Argon2 hash, HTTPS, invalidation และ redirect Login |
| `AC-ACCOUNT-03` | `test_AC_ACCOUNT_03_invalid_profile_and_password_data` | ตรวจ phone/email format, ข้อมูลไม่ครบตามคำตอบ `Q-01` เมื่อได้ข้อสรุป, confirmation mismatch และ password สั้นกว่า 8 โดยไม่บันทึก |
| `AC-ACCOUNT-04` | `test_AC_ACCOUNT_04_wrong_current_password` | ส่ง current password ไม่ถูกต้อง; ตรวจว่าไม่เปลี่ยน password/hash และมีข้อความแจ้งข้อผิดพลาด |
| `AC-ACCOUNT-05` | `test_AC_ACCOUNT_05_success_confirmation` | บันทึกข้อมูลบัญชีสำเร็จและตรวจข้อความยืนยัน |
| `AC-ACCOUNT-06` | `test_AC_ACCOUNT_06_cancel_profile_changes` | แก้ form ข้อมูลส่วนตัวแล้ว cancel; ตรวจค่าเดิมและไม่มี update request; flow รหัสผ่านแยกกัน |
| `AC-ACCOUNT-07` | `test_AC_ACCOUNT_07_session_and_ownership_guard` | ไม่มี session ให้นำไป Login; มีตัวตนแต่ขอแก้บัญชีอื่นให้ได้ 403 และไม่มีข้อมูลเปลี่ยน |
| `AC-ACCOUNT-08` | `test_AC_ACCOUNT_08_save_response_under_two_seconds` | จับเวลาตั้งแต่กดบันทึกจนแสดง success/error; ทดสอบภายใต้เงื่อนไขที่ทีมกำหนดตาม `Q-03` |

เครื่องมือทดสอบตาม stack ปัจจุบัน: pytest สำหรับ API/database และ Vitest/Testing Library สำหรับหน้าเว็บ; หลักฐานทดสอบ HTTPS/Argon2 ต้องตรวจจาก configuration และข้อมูลที่จัดเก็บจริง ไม่สรุปจาก mock เพียงอย่างเดียว (`CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01`).

## 7. ลำดับงาน

1. รับ contract จาก UC-07 สำหรับ User identity, session/token verification และการยกเลิก session; เป็น prerequisite ของ `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `FR-ACCOUNT-09`, `NFR-SEC-02`, `AC-ACCOUNT-02`, `AC-ACCOUNT-07`.
2. ตอบ `Q-01` ก่อนกำหนด requiredness และ validation ของชื่อ/ข้อมูล profile; ระหว่างรอไม่กำหนด schema constraints ของฟิลด์เหล่านี้ (`FR-ACCOUNT-02`, `FR-ACCOUNT-03`, `AC-ACCOUNT-03`).
3. เพิ่มหรือเชื่อม User persistence ใน SQLite กับ UC-07 และข้อมูล `name`, `phone`, `email` ตามข้อสรุป `Q-01` (`FR-ACCOUNT-01`, `FR-ACCOUNT-02`, `FR-ACCOUNT-04`).
4. ทำ server-side authorization dependency และ API อ่าน/แก้บัญชี; ตรวจ ownership, validation, 403 และไม่เปลี่ยนข้อมูลเมื่อผิดพลาด (`FR-ACCOUNT-01` ถึง `FR-ACCOUNT-05`, `AC-ACCOUNT-01`, `AC-ACCOUNT-03`, `AC-ACCOUNT-07`).
5. ทำ API เปลี่ยน password โดยตรวจ current password, validation, Argon2, HTTPS และ session invalidation จาก UC-07 (`FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-SEC-01`, `CON-SEC-02`, `AC-ACCOUNT-02` ถึง `AC-ACCOUNT-04`).
6. ทำหน้า responsive แยก form ข้อมูลส่วนตัว/รหัสผ่าน, success/error states และ cancel เฉพาะข้อมูลส่วนตัว (`FR-ACCOUNT-05`, `FR-ACCOUNT-08`, `NFR-USE-01`, `CON-UI-01`, `AC-ACCOUNT-01`, `AC-ACCOUNT-05`, `AC-ACCOUNT-06`).
7. เพิ่ม pytest/Vitest tests ครบ AC และ security ownership/session cases (`AC-ACCOUNT-01` ถึง `AC-ACCOUNT-07`, `NFR-SEC-01`, `NFR-SEC-02`).
8. กำหนด test environment หลังได้คำตอบ `Q-02` และ `Q-03`; ตรวจ usability/performance ก่อนยืนยันผล acceptance (`NFR-USE-01`, `NFR-PERF-01`, `AC-ACCOUNT-01`, `AC-ACCOUNT-08`).

## 8. สิ่งที่ยังไม่ทำ

- `Q-01` ชื่อ เบอร์โทรศัพท์ และอีเมล จำเป็นต้องกรอกทุกฟิลด์หรือไม่ และชื่อมีเงื่อนไขการตรวจสอบเพิ่มเติมหรือไม่ (ทีมผู้กำหนด UC-08) — ส่วนที่เกี่ยวข้องกับ requiredness, validation และ schema จะยังไม่สร้างจนกว่าจะได้คำตอบ
- `Q-02` จะใช้เกณฑ์ใดประเมินว่า NFR-USE-01 ใช้งานง่ายและไม่ซับซ้อน (ทีมเอง) — ส่วนที่เกี่ยวข้องกับเกณฑ์ประเมิน usability จะยังไม่สร้างจนกว่าจะได้คำตอบ; จะไม่เดาเกณฑ์เพิ่มจาก spec
- `Q-03` สภาพแวดล้อมทดสอบปกติสำหรับ NFR-PERF-01 มีเงื่อนไขด้านเครือข่ายหรือปริมาณการใช้งานอย่างไร (ทีมเอง) — ส่วนที่เกี่ยวข้องกับสภาพแวดล้อมวัดผล performance จะยังไม่กำหนดจนกว่าจะได้คำตอบ
- การสมัครสมาชิก (UC-02), การ Login โดยละเอียด (UC-07), การรีเซ็ตรหัสผ่าน, การจัดการบัญชีผู้อื่น, การเปลี่ยน role, การลบบัญชี, การจัดการข้อมูลหอพัก และการยืนยันอีเมลใหม่อยู่นอกขอบเขต; UC-08 ตรวจ ownership เพื่อปฏิเสธคำขอ แต่ไม่จัดการบัญชีผู้อื่น (`FR-ACCOUNT-02`, `FR-ACCOUNT-09`, `NFR-SEC-02`).
