# Tasks: จัดการบัญชีผู้ใช้

## 1. หัวเรื่องและข้อมูลอ้างอิง

Spec ID: `SPEC-ACCOUNT-001`

อ้างอิง: [spec.md](./spec.md) | [plan.md](./plan.md)

## 2. ลำดับงาน

### Phase 0: Dependency จาก UC-07

| ลำดับ | งาน | รองรับ | สถานะ |
|---|---|---|---|
| T-01 | `[Dependency / Backend]` รับ contract จาก UC-07 สำหรับ verified user identity, session/token verification และการยกเลิก session ปัจจุบันหลังเปลี่ยนรหัสผ่าน; ใช้ auth dependency เดิม ห้ามสร้าง Authentication ซ้ำ | `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `FR-ACCOUNT-09`, `NFR-SEC-02`, `AC-ACCOUNT-02`, `AC-ACCOUNT-07` | [ ] รอ UC-07 |

### Phase 1: Database

| ลำดับ | งาน | รองรับ | สถานะ |
|---|---|---|---|
| T-02 | `[Database]` เชื่อมข้อมูลบัญชี UC-08 กับ User persistence ของ UC-07 และเตรียมฟิลด์ `name`, `phone`, `email`; กำหนด requiredness/nullability และ name validation หลังได้คำตอบ Q-01 เท่านั้น; ไม่สร้าง User/session/authentication ซ้ำ | `FR-ACCOUNT-01`, `FR-ACCOUNT-02`, `FR-ACCOUNT-04`, `CON-ACCOUNT-03`, `AC-ACCOUNT-01`, `AC-ACCOUNT-03`, `Q-01` | [ ] รอ T-01, Q-01 |
| T-03 | `[Database]` ใช้ช่อง `password_hash` ใน User persistence ที่ UC-07 จัดให้เพื่อบันทึก Argon2 hash แทนค่าเดิม; ไม่เก็บ plain text และไม่เพิ่ม session store นอก auth contract ของ UC-07 | `FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01`, `AC-ACCOUNT-02`, `AC-ACCOUNT-04` | [ ] รอ T-01 |

### Phase 2: Backend

| ลำดับ | งาน | รองรับ | สถานะ |
|---|---|---|---|
| T-04 | `[Backend]` เพิ่ม `GET /account` โดยอ่าน user ID จาก verified identity ของ UC-07, ส่งข้อมูลบัญชีปัจจุบัน และไม่ส่ง password/hash กลับ; ปฏิเสธคำขอที่ไม่มี session ตาม auth contract | `FR-ACCOUNT-01`, `FR-ACCOUNT-09`, `NFR-SEC-02`, `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `AC-ACCOUNT-01`, `AC-ACCOUNT-07` | [ ] รอ T-01, T-02 |
| T-05 | `[Backend]` เพิ่ม `PUT /account` ให้แก้เฉพาะบัญชีของ identity ปัจจุบัน ตรวจเบอร์ 10 หลัก/รูปแบบอีเมลและกฎข้อมูลที่ทีมยืนยัน แล้วบันทึกและส่งข้อมูลล่าสุดหรือ field errors; ไม่รับ user ID เป้าหมายจาก client | `FR-ACCOUNT-02`, `FR-ACCOUNT-03`, `FR-ACCOUNT-04`, `FR-ACCOUNT-05`, `CON-ACCOUNT-02`, `CON-ACCOUNT-03`, `AC-ACCOUNT-01`, `AC-ACCOUNT-03`, `AC-ACCOUNT-05`, `Q-01` | [ ] รอ T-01, T-02, Q-01 |
| T-06 | `[Backend]` เพิ่ม `PUT /account/password`: ตรวจ current password, รหัสผ่านใหม่ขั้นต่ำ 8 ตัวอักษรและ confirmation, บันทึก Argon2 hash ผ่าน HTTPS และเรียก UC-07 ให้ยกเลิก session ปัจจุบันเมื่อสำเร็จ; ไม่สร้าง login/authentication flow | `FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-ACCOUNT-04`, `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01`, `NFR-SEC-02`, `AC-ACCOUNT-02`, `AC-ACCOUNT-03`, `AC-ACCOUNT-04` | [ ] รอ T-01, T-03 |

### Phase 3: Frontend

| ลำดับ | งาน | รองรับ | สถานะ |
|---|---|---|---|
| T-07 | `[Frontend]` สร้างหน้า Manage Account แสดงข้อมูลบัญชีปัจจุบัน แยกส่วนข้อมูลส่วนตัว/เปลี่ยนรหัสผ่าน และปรับ layout สำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์ | `FR-ACCOUNT-01`, `NFR-USE-01`, `CON-UI-01`, `AC-ACCOUNT-01` | [ ] รอ T-04 |
| T-08 | `[Frontend]` เพิ่ม form แก้ชื่อ/เบอร์โทรศัพท์/อีเมล แสดง validation errors และผลสำเร็จพร้อมข้อมูลล่าสุด; ห้ามกำหนด requiredness หรือกฎตรวจชื่อก่อนตอบ Q-01 | `FR-ACCOUNT-02`, `FR-ACCOUNT-03`, `FR-ACCOUNT-04`, `FR-ACCOUNT-05`, `CON-ACCOUNT-03`, `AC-ACCOUNT-01`, `AC-ACCOUNT-03`, `AC-ACCOUNT-05`, `Q-01` | [ ] รอ T-05, Q-01 |
| T-09 | `[Frontend]` เพิ่ม form เปลี่ยนรหัสผ่านแยกจากข้อมูลส่วนตัว; ส่ง current/new/confirmation, แสดงข้อผิดพลาด และเมื่อตอบสำเร็จให้ไปหน้า Login หลัง UC-07 ยกเลิก session ปัจจุบัน; ไม่สร้างหน้าหรือ flow Login ซ้ำ | `FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-ACCOUNT-04`, `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01`, `AC-ACCOUNT-02`, `AC-ACCOUNT-03`, `AC-ACCOUNT-04` | [ ] รอ T-06 |
| T-10 | `[Frontend]` ทำปุ่มยกเลิกเฉพาะ form ข้อมูลส่วนตัวให้คืนค่าเดิมโดยไม่เรียก API update และไม่ยกเลิก flow เปลี่ยนรหัสผ่าน | `FR-ACCOUNT-08`, `AC-ACCOUNT-06` | [ ] รอ T-08 |

### Phase 4: Testing

| ลำดับ | งาน | รองรับ | สถานะ |
|---|---|---|---|
| T-11 | `[Testing / Backend]` เพิ่ม API tests สำหรับอ่าน/บันทึกข้อมูลบัญชี, phone/email validation, no-save เมื่อ invalid และ success response; ทดสอบ name/requiredness ตามคำตอบ Q-01 เท่านั้น | `FR-ACCOUNT-01`, `FR-ACCOUNT-02`, `FR-ACCOUNT-03`, `FR-ACCOUNT-04`, `FR-ACCOUNT-05`, `CON-ACCOUNT-03`, `AC-ACCOUNT-01`, `AC-ACCOUNT-03`, `AC-ACCOUNT-05`, `Q-01` | [ ] รอ T-04, T-05, Q-01 |
| T-12 | `[Testing / Backend]` เพิ่ม password tests สำหรับเปลี่ยนสำเร็จ, Argon2 hash/HTTPS, session invalidation, wrong current password, confirmation mismatch และความยาวต่ำกว่า 8 โดยไม่บันทึก | `FR-ACCOUNT-06`, `FR-ACCOUNT-07`, `CON-ACCOUNT-04`, `CON-SEC-01`, `CON-SEC-02`, `NFR-SEC-01`, `AC-ACCOUNT-02`, `AC-ACCOUNT-03`, `AC-ACCOUNT-04` | [ ] รอ T-03, T-06 |
| T-13 | `[Testing / Frontend]` เพิ่ม UI tests สำหรับข้อมูลปัจจุบัน/ล่าสุด, success message, responsive layout และ cancel เฉพาะข้อมูลส่วนตัวโดยไม่ส่ง update | `FR-ACCOUNT-01`, `FR-ACCOUNT-05`, `FR-ACCOUNT-08`, `NFR-USE-01`, `CON-UI-01`, `AC-ACCOUNT-01`, `AC-ACCOUNT-05`, `AC-ACCOUNT-06` | [ ] รอ T-07, T-08, T-10 |
| T-14 | `[Testing / Security]` ทดสอบไม่มี session แล้วไปหน้า Login และผู้มี session ที่พยายามเข้าถึง/แก้บัญชีผู้อื่นได้รับ HTTP 403 โดยไม่มีข้อมูลเปลี่ยน; ใช้ UC-07 auth จริง ไม่ใช้ `X-Owner-Id` prototype | `FR-ACCOUNT-09`, `CON-ACCOUNT-01`, `CON-ACCOUNT-02`, `NFR-SEC-02`, `AC-ACCOUNT-07` | [ ] รอ T-01, T-04 |
| T-15 | `[Testing / Performance]` วัดตั้งแต่กดบันทึกจนแสดง success/error และตรวจไม่เกิน 2 วินาที ภายใต้ test environment ที่ทีมกำหนด | `NFR-PERF-01`, `AC-ACCOUNT-08`, `Q-03` | [ ] รอ Q-03, T-05, T-08 |
| T-16 | `[Testing / Usability]` ตรวจเกณฑ์ “ใช้งานง่ายและไม่ซับซ้อน” ตามวิธีที่ทีมกำหนด; ระหว่างรอไม่สร้างเกณฑ์หรือสรุปผล usability แทนทีม | `NFR-USE-01`, `AC-ACCOUNT-01`, `Q-02` | [ ] รอ Q-02, T-07 |

## 3. งานที่ต้องรอคำตอบ

| คำถาม/Dependency | งานที่รอ | สิ่งที่ยังไม่ทำ | สถานะ |
|---|---|---|---|
| UC-07 authentication/session contract | T-01, T-02 ถึง T-06, T-14 และงานที่พึ่งพาเหล่านั้น | ไม่สร้าง Authentication, Login หรือ session/token handling ซ้ำ; รอ verified identity และกลไกยกเลิก session จาก UC-07 | [ ] รอ UC-07 |
| Q-01 ชื่อ เบอร์โทรศัพท์ และอีเมล จำเป็นต้องกรอกทุกฟิลด์หรือไม่ และชื่อมีเงื่อนไขการตรวจสอบเพิ่มเติมหรือไม่ (ทีมผู้กำหนด UC-08) | T-02, T-05, T-08, T-11 | ไม่กำหนด requiredness, nullability หรือ validation ของชื่อแทนทีม | [ ] รอ Q-01 |
| Q-02 จะใช้เกณฑ์ใดประเมินว่า NFR-USE-01 ใช้งานง่ายและไม่ซับซ้อน (ทีมเอง) | T-16 | ไม่กำหนดเกณฑ์ usability หรือสรุปผลทดสอบแทนทีม | [ ] รอ Q-02 |
| Q-03 สภาพแวดล้อมทดสอบปกติสำหรับ NFR-PERF-01 มีเงื่อนไขด้านเครือข่ายหรือปริมาณการใช้งานอย่างไร (ทีมเอง) | T-15 | ไม่กำหนด load/network baseline หรือรับรองผล 2 วินาทีภายใต้เงื่อนไขที่ยังไม่ระบุ | [ ] รอ Q-03 |

## 4. ตารางครอบคลุม AC

| AC ID | งานที่ตรวจ | สถานะ |
|---|---|---|
| `AC-ACCOUNT-01` | T-04, T-05, T-07, T-11, T-13: แสดงบัญชีปัจจุบัน, แก้/บันทึก/แสดงข้อมูลล่าสุด และแยก layout responsive | [ ] รอ UC-07, Q-01 |
| `AC-ACCOUNT-02` | T-06, T-09, T-12: เปลี่ยนรหัสผ่านอย่างปลอดภัยและยกเลิก session ปัจจุบัน | [ ] รอ UC-07 |
| `AC-ACCOUNT-03` | T-05, T-06, T-08, T-11, T-12: invalid profile/password data, mismatch และรหัสผ่านต่ำกว่า 8 โดยไม่บันทึก | [ ] รอ Q-01, UC-07 |
| `AC-ACCOUNT-04` | T-06, T-12: รหัสผ่านเดิมผิดแล้วไม่เปลี่ยนรหัสผ่านและแสดงข้อผิดพลาด | [ ] รอ UC-07 |
| `AC-ACCOUNT-05` | T-05, T-08, T-11, T-13: แสดงข้อความยืนยันหลังบันทึกข้อมูลสำเร็จ | [ ] รอ Q-01, UC-07 |
| `AC-ACCOUNT-06` | T-10, T-13: ยกเลิกการแก้ข้อมูลส่วนตัวแล้วคืนค่าเดิมโดยไม่บันทึก | [ ] รอ T-08 |
| `AC-ACCOUNT-07` | T-01, T-04, T-14: ไม่มี session ไป Login; มีตัวตนแต่ไม่มีสิทธิ์ได้ 403 | [ ] รอ UC-07 |
| `AC-ACCOUNT-08` | T-15: วัดเวลาจากกดบันทึกจนแสดงผล success/error ไม่เกิน 2 วินาที | [ ] รอ Q-03 |

## 5. ตารางครอบคลุม Constraint

| Constraint ID | งานที่รองรับ | สถานะ |
|---|---|---|
| `CON-ACCOUNT-01` | T-01, T-04, T-14: พึ่งพา auth จาก UC-07 และปฏิเสธผู้ไม่มี session | [ ] รอ UC-07 |
| `CON-ACCOUNT-02` | T-01, T-04, T-05, T-14: ใช้ตัวตนที่ตรวจสอบบน server และจำกัดบัญชีเจ้าของ | [ ] รอ UC-07 |
| `CON-ACCOUNT-03` | T-02, T-05, T-08, T-11: validation ก่อนบันทึก; ข้อกำหนดชื่อรอ Q-01 | [ ] รอ Q-01 |
| `CON-ACCOUNT-04` | T-06, T-09, T-12: ตรวจรหัสผ่านเดิมก่อนเปลี่ยน | [ ] รอ UC-07 |
| `CON-SEC-01` | T-03, T-06, T-12: ใช้ Argon2 hash และไม่เก็บ plain text | [ ] รอ UC-07 |
| `CON-SEC-02` | T-03, T-06, T-12: salted hash และรับส่งผ่าน HTTPS | [ ] รอ UC-07 |
| `CON-UI-01` | T-07, T-13: responsive สำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์ | [ ] รอ T-07 |
