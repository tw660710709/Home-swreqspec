# แผนทางเทคนิค: สมัครสมาชิก (Register)

อ้างอิง: `specs/002-register/spec.md`  
Spec ID: `SPEC-REG-001` | Status: `Draft v2`

## 1. สรุปแนวทาง

1. สร้างหน้าฟอร์มสมัครสมาชิกสำหรับ Guest ตาม `FR-REG-01` และรองรับช่วงหน้าจอตาม `CON-UI-01`
2. ตรวจสอบข้อมูลหลังออกจากช่องและตรวจสอบซ้ำเมื่อส่งฟอร์มตาม `FR-REG-02`, `FR-REG-06` และ `NFR-USE-01`
3. สร้างบริการสมัครสมาชิกที่ normalize อีเมล/เบอร์โทรศัพท์ ตรวจข้อมูลซ้ำ และสร้างบัญชี Resident ตาม `FR-REG-03`, `FR-REG-07`, `ASM-01` และ `ASM-03`
4. เก็บเฉพาะ password hash ด้วย Argon2id และรับส่งข้อมูลผ่าน HTTPS ตาม `CON-SEC-01` และ `NFR-SEC-01`
5. ส่งผลสำเร็จหรือข้อผิดพลาดกลับไปยังหน้าจอ และนำทางไปหน้าเข้าสู่ระบบตาม `FR-REG-04`, `FR-REG-05` และ `ASM-06`

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้างหน้าฟอร์มและ Inline Validation ตาม `FR-REG-01`, `FR-REG-02`, `NFR-USE-01` |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้าง API สมัครสมาชิกตาม `FR-REG-03`, `FR-REG-07` |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ Unique Constraint ของอีเมลและเบอร์โทรศัพท์ตาม `CON-DAT-01` |
| Argon2id | `CON-SEC-01` | ใช้แฮชรหัสผ่านก่อนบันทึก และไม่เก็บรหัสผ่านหรือ password confirmation แบบ Plain Text |
| HTTPS (TLS 1.2 ขึ้นไป) | `NFR-SEC-01` | ใช้กับการรับส่งข้อมูลการลงทะเบียนทั้งหมด |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `UserAccount` | `id`, `full_name`, `email_normalized`, `phone_normalized`, `password_hash`, `role` | `FR-REG-03`, `ASM-01`, `CON-DAT-01` |
| ข้อมูลสมัครสมาชิกชั่วคราว | `full_name`, `email`, `phone`, `password`, `password_confirmation` | `FR-REG-01`, `FR-REG-02`, `FR-REG-06`; ใช้ตรวจสอบในคำขอและไม่บันทึก `password`/`password_confirmation` |

กติกาข้อมูล:

- `email_normalized` แปลงเป็นตัวพิมพ์เล็กก่อนตรวจซ้ำตาม `CON-DAT-01` และ `ASM-03`
- `phone_normalized` ตัดช่องว่างและเครื่องหมายขีดก่อนตรวจซ้ำ และต้องเป็นตัวเลข 10 หลักตาม `CON-DAT-01` และ `ASM-03`
- ใส่ Unique Constraint แยกที่ `email_normalized` และ `phone_normalized` ตาม `CON-DAT-01`
- กำหนด `role` เป็น `Resident` โดยอัตโนมัติตาม `ASM-01`; ไม่สร้างกระบวนการ Dormitory Owner ตาม `ASM-02`
- ไม่สร้างฟิลด์หรือกระบวนการ Email Activation ตาม Out of scope และ `ASM-08`

## 4. API / หน้าจอ

- `GET /register` — แสดงช่องชื่อ-นามสกุล อีเมล เบอร์โทรศัพท์ รหัสผ่าน และยืนยันรหัสผ่านตาม `FR-REG-01`
- `POST /api/register` — รับข้อมูลสมัครสมาชิก, validate/normalize, ตรวจซ้ำ, บันทึกบัญชี และส่งผลสำเร็จหรือข้อผิดพลาดตาม `FR-REG-02`, `FR-REG-03`, `FR-REG-06`, `FR-REG-07`
- หน้าจอ `/register` — แสดง Inline Validation หลังออกจากช่องและข้อผิดพลาดที่ช่องที่เกี่ยวข้องตาม `FR-REG-02`, `FR-REG-06`, `NFR-USE-01`
- หน้าจอ `/register` — เมื่อกดลิงก์ “มีบัญชีอยู่แล้ว? เข้าสู่ระบบ” ให้นำทางไป `UC-07` ตาม `FR-REG-05`
- หน้าจอผลสำเร็จ/หน้า `UC-07` — หลังสมัครสำเร็จนำทางทันทีและแสดง “สมัครสมาชิกสำเร็จ” ตาม `FR-REG-04` และ `ASM-06`

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-SEC-01` | `UserAccount.password_hash`, Argon2id และการทดสอบ `AC-REG-01` | ใช้แล้ว |
| `CON-DAT-01` | ฟิลด์ normalized, validation และ Unique Constraint ในโมเดลข้อมูล/API | ใช้แล้ว |
| `CON-UI-01` | หน้าจอ `/register` และการทดสอบ responsive ที่ 320-767, 768-1023 และ >=1024 พิกเซล | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-REG-01` | `test_AC_REG_01_successful_registration` | ส่งข้อมูลถูกต้องและไม่ซ้ำ ตรวจว่าบันทึกบัญชีเป็น `Resident`, เก็บเฉพาะ Argon2id hash, ใช้ HTTPS และนำทางพร้อมข้อความสำเร็จ |
| `AC-REG-02` | `test_AC_REG_02_rejects_mismatched_passwords` | ส่ง password กับ confirmation ไม่ตรงกัน ตรวจข้อความ “รหัสผ่านไม่ตรงกัน” ที่จุดผิดพลาดและยืนยันว่าไม่มีบัญชีถูกบันทึก |
| `AC-REG-03` | `test_AC_REG_03_rejects_duplicate_email` | เตรียมบัญชีที่มีอีเมลเดียวกัน ส่งสมัครซ้ำ ตรวจข้อความที่ช่องอีเมล ลิงก์เข้าสู่ระบบ และจำนวนบัญชีไม่เพิ่ม |
| `AC-REG-04` | `test_AC_REG_04_navigates_to_login` | เปิดหน้าสมัคร กดลิงก์เข้าสู่ระบบ และตรวจปลายทางเป็น `UC-07` |
| `AC-REG-05` | `test_AC_REG_05_registration_response_p95_under_2_seconds` | วัดตั้งแต่กดยืนยันจนได้รับผลตรวจสอบ/บันทึก ภายใต้สภาวะเครือข่ายปกติและตรวจค่า p95 <= 2 วินาที |

การทดสอบเพิ่มเติมที่ผูกกับข้อกำหนด:

- ทดสอบ Inline Validation, ป้ายกำกับ และข้อความที่ช่องผิดพลาดตาม `NFR-USE-01`
- ทดสอบ responsive ที่ช่วงความกว้างทั้งสามช่วงตาม `CON-UI-01`
- ทดสอบกรณีอีเมลและเบอร์โทรศัพท์ซ้ำพร้อมกันตาม `FR-REG-07` และ `ASM-05`
- ทดสอบ TLS 1.2 ขึ้นไปและยืนยันว่าไม่มี password แบบ Plain Text ตาม `NFR-SEC-01`

## 7. ลำดับงาน

1. สร้างโมเดล `UserAccount`, normalized fields และ Unique Constraint ตาม `CON-DAT-01`, `FR-REG-03`
2. เพิ่ม validation สำหรับชื่อ-นามสกุล อีเมล เบอร์โทรศัพท์ รหัสผ่าน และ confirmation ตาม `FR-REG-01`, `FR-REG-02`, `FR-REG-06`
3. เพิ่ม service สมัครสมาชิกที่ตรวจซ้ำ แฮชด้วย Argon2id และกำหนด role `Resident` ตาม `FR-REG-03`, `FR-REG-07`, `CON-SEC-01`, `ASM-01`
4. เพิ่ม `POST /api/register` และการตอบข้อผิดพลาดแยกช่องตาม `FR-REG-06`, `FR-REG-07`, `ASM-05`
5. สร้างหน้าฟอร์มและ Inline Validation ตาม `FR-REG-01`, `FR-REG-02`, `NFR-USE-01`, `CON-UI-01`
6. เชื่อมการนำทางไป `UC-07` และข้อความสมัครสำเร็จตาม `FR-REG-04`, `FR-REG-05`, `ASM-06`
7. ตั้งค่า HTTPS และตรวจไม่ให้ password หลุดลงฐานข้อมูลหรือ log ตาม `NFR-SEC-01`
8. รันทดสอบ `AC-REG-01` ถึง `AC-REG-05`, responsive และกรณีข้อมูลซ้ำทั้งสองค่า ตามตารางทดสอบ

## 8. สิ่งที่ยังไม่ทำ

Spec ฉบับนี้ไม่มีรายการ `Q-xx` ในหัวข้อ Open Questions มีเฉพาะ `ASM-01` ถึง `ASM-08` ซึ่งถูกนำไปใช้ในแผนแล้ว ดังนั้นไม่มีส่วนที่ต้องระงับไว้เนื่องจาก Open Questions

ยังไม่สร้างสิ่งต่อไปนี้ตาม Out of scope และ `ASM-02`, `ASM-08`:

- Email Activation หรือ OTP ผ่าน SMS/Email
- กระบวนการเข้าสู่ระบบของ `UC-07`
- การแก้ไขข้อมูลส่วนตัวของ `UC-08`
- กระบวนการสมัครหรืออนุมัติ Dormitory Owner
- นโยบายรหัสผ่านซับซ้อนนอกเหนือจากความยาวขั้นต่ำ 8 ตัวอักษร
