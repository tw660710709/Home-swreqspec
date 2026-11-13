# Requirements Traceability Matrix: จัดการบัญชีผู้ใช้

Spec ID: `SPEC-ACCOUNT-001` | Use Case: `UC-08`

อ้างอิง: [spec.md](./spec.md) | [plan.md](./plan.md) | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)

## เกณฑ์สถานะ

- **Covered** หมายถึงมี Test Case ID ที่มีอยู่จริงใน `test-cases.md` เชื่อมโยงกับ Requirement/AC นั้น ไม่ได้ยืนยันว่ารันทดสอบแล้วหรือผลผ่าน
- **Not Covered** หมายถึงยังไม่มีกรณีทดสอบหรือเกณฑ์ที่เพียงพอสำหรับตรวจพฤติกรรมที่ระบุ; ถ้ามี coverage บางส่วนให้ระบุส่วนที่ขาดและ Open Question ที่เกี่ยวข้อง
- สถานะที่ระบุว่ารอ Q-01, Q-02 หรือ Q-03 เป็น coverage ที่ยังดำเนินการหรือสรุปผลไม่ได้จนกว่าจะได้คำตอบจากทีม

## Traceability Matrix

| Requirement / AC ID | ประเภท | Test Case ID ที่มีอยู่ | สถานะ | หมายเหตุ / ช่องว่าง |
|---|---|---|---|---|
| `FR-ACCOUNT-01` | FR | `TC-ACCOUNT-01` | Covered | ตรวจการแสดงข้อมูลบัญชีของ Resident ปัจจุบัน |
| `FR-ACCOUNT-02` | FR | `TC-ACCOUNT-02` | Covered | การทดสอบบันทึกข้อมูลรอข้อสรุป Q-01 เรื่องชื่อและ requiredness |
| `FR-ACCOUNT-03` | FR | `TC-ACCOUNT-03`, `TC-ACCOUNT-04`, `TC-ACCOUNT-05`, `TC-ACCOUNT-06`, `TC-ACCOUNT-07`, `TC-ACCOUNT-08` | Covered | ครอบคลุมการยืนยันรหัสผ่านที่ตรงกันและไม่ตรงกัน ความยาวรหัสผ่าน ตลอดจนรูปแบบเบอร์โทรศัพท์และอีเมลตาม spec |
| `FR-ACCOUNT-04` | FR | `TC-ACCOUNT-02` | Covered | ตรวจการบันทึกข้อมูลบัญชีหลังผ่าน validation; การดำเนินการรอ Q-01 |
| `FR-ACCOUNT-05` | FR | `TC-ACCOUNT-02` | Covered | ตรวจข้อความสำเร็จและข้อมูลล่าสุด; การดำเนินการรอ Q-01 |
| `FR-ACCOUNT-06` | FR | `TC-ACCOUNT-06`, `TC-ACCOUNT-07`, `TC-ACCOUNT-08` | Covered | ครอบคลุมกรณีเปลี่ยนสำเร็จ, confirmation mismatch และรหัสผ่านสั้นกว่า 8 ตัวอักษร |
| `FR-ACCOUNT-07` | FR | `TC-ACCOUNT-06`, `TC-ACCOUNT-09` | Covered | ตรวจรหัสผ่านเดิมที่ถูกต้องและไม่ถูกต้อง |
| `FR-ACCOUNT-08` | FR | `TC-ACCOUNT-10` | Covered | ตรวจยกเลิกเฉพาะข้อมูลส่วนตัวโดยไม่เปลี่ยนกระบวนการรหัสผ่าน |
| `FR-ACCOUNT-09` | FR | `TC-ACCOUNT-11` | Covered | ตรวจไม่มี session แล้วปฏิเสธและนำไปหน้า Login |
| `NFR-USE-01` | NFR | `TC-ACCOUNT-01`, `TC-ACCOUNT-14` | Not Covered (partial) | `TC-ACCOUNT-01` ตรวจการแบ่งส่วนและ responsive; ยังสรุป “ใช้งานง่ายและไม่ซับซ้อน” ไม่ได้จนกว่าจะได้เกณฑ์ Q-02 |
| `NFR-PERF-01` | NFR | `TC-ACCOUNT-13` | Covered — มี Test Case แล้ว; รอการทดสอบภายใต้เงื่อนไข Q-03 | ยังไม่รันการวัดจนกว่าจะได้คำตอบเรื่องสภาพแวดล้อมตาม Q-03 |
| `NFR-SEC-01` | NFR | `TC-ACCOUNT-06` | Covered | ตรวจ salted password hash และไม่เก็บ plain text |
| `NFR-SEC-02` | NFR | `TC-ACCOUNT-11`, `TC-ACCOUNT-12` | Covered | ตรวจ session ที่ใช้งานไม่ได้และการปฏิเสธผู้ไม่มีสิทธิ์ด้วย HTTP 403 |
| `CON-ACCOUNT-01` | CON | `TC-ACCOUNT-11` | Covered | ตรวจการปฏิเสธผู้ไม่มี session ที่ใช้งานได้ |
| `CON-ACCOUNT-02` | CON | `TC-ACCOUNT-12` | Covered | ตรวจว่าแก้ไขได้เฉพาะบัญชีของ identity ที่ผ่านการตรวจสอบ |
| `CON-ACCOUNT-03` | CON | `TC-ACCOUNT-02`, `TC-ACCOUNT-03`, `TC-ACCOUNT-04`, `TC-ACCOUNT-05`, `TC-ACCOUNT-06`, `TC-ACCOUNT-07`, `TC-ACCOUNT-08` | Covered | เชื่อมกับการตรวจข้อมูลส่วนตัวและ password validation ตามรายละเอียดใน `FR-ACCOUNT-03`/`FR-ACCOUNT-06`; requiredness และกฎชื่อยังรอ Q-01 |
| `CON-ACCOUNT-04` | CON | `TC-ACCOUNT-09` | Covered | ตรวจว่ารหัสผ่านเดิมผิดแล้วไม่เปลี่ยนรหัสผ่าน |
| `CON-SEC-01` | CON | `TC-ACCOUNT-06` | Covered | ตรวจว่า password ไม่ถูกจัดเก็บเป็น plain text |
| `CON-SEC-02` | CON | `TC-ACCOUNT-06` | Covered | ตรวจ salted password hash และการรับส่งผ่าน HTTPS |
| `CON-UI-01` | CON | `TC-ACCOUNT-01` | Covered | ตรวจการปรับหน้าจอสำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์ |
| `AC-ACCOUNT-01` | AC | `TC-ACCOUNT-01`, `TC-ACCOUNT-02` | Covered | ครอบคลุมแสดงข้อมูล/รูปแบบหน้าจอและการแก้ไขข้อมูล; การทดสอบแก้ไขรอ Q-01 |
| `AC-ACCOUNT-02` | AC | `TC-ACCOUNT-06` | Covered | ตรวจเปลี่ยนรหัสผ่าน, hash, HTTPS, ยกเลิก session เดิม และนำไปหน้า Login |
| `AC-ACCOUNT-03` | AC | `TC-ACCOUNT-03`, `TC-ACCOUNT-04`, `TC-ACCOUNT-05`, `TC-ACCOUNT-07`, `TC-ACCOUNT-08` | Not Covered (partial) | มีกรณีข้อมูลผิดรูปแบบและรหัสผ่านไม่ผ่านเงื่อนไข แต่ยังไม่มีกรณีข้อมูลส่วนตัวที่ขาด required field เพราะ requiredness ยังรอ Q-01 |
| `AC-ACCOUNT-04` | AC | `TC-ACCOUNT-09` | Covered | ตรวจรหัสผ่านเดิมไม่ถูกต้องและไม่บันทึกรหัสผ่านใหม่ |
| `AC-ACCOUNT-05` | AC | `TC-ACCOUNT-02` | Covered | ตรวจข้อความยืนยันหลังบันทึกสำเร็จ; การทดสอบรอ Q-01 |
| `AC-ACCOUNT-06` | AC | `TC-ACCOUNT-10` | Covered | ตรวจยกเลิกการแก้ไขและคืนข้อมูลเดิม |
| `AC-ACCOUNT-07` | AC | `TC-ACCOUNT-11`, `TC-ACCOUNT-12` | Covered | ครอบคลุมไม่มี session และมี session แต่ไม่มีสิทธิ์เข้าถึงบัญชีผู้อื่น |
| `AC-ACCOUNT-08` | AC | `TC-ACCOUNT-13` | Covered — มี Test Case แล้ว; รอการทดสอบภายใต้เงื่อนไข Q-03 | ยังไม่รันการวัดจนกว่าจะได้คำตอบเรื่องสภาพแวดล้อมตาม Q-03 |

## Open Questions

| Open Question | Requirement / AC ที่ได้รับผล | Test Case ที่เกี่ยวข้อง | สถานะ |
|---|---|---|---|
| Q-01 ชื่อ เบอร์โทรศัพท์ และอีเมล จำเป็นต้องกรอกทุกฟิลด์หรือไม่ และชื่อมีเงื่อนไขการตรวจสอบเพิ่มเติมหรือไม่ (ทีมผู้กำหนด UC-08) | `FR-ACCOUNT-02`, `FR-ACCOUNT-03`, `FR-ACCOUNT-04`, `FR-ACCOUNT-05`, `CON-ACCOUNT-03`, `AC-ACCOUNT-01`, `AC-ACCOUNT-03`, `AC-ACCOUNT-05` | `TC-ACCOUNT-02`; ยังไม่มี Test Case สำหรับกรณีข้อมูลส่วนตัวขาด required field | Open — ไม่กำหนด requiredness หรือกฎตรวจชื่อแทนทีม |
| Q-02 จะใช้เกณฑ์ใดประเมินว่า NFR-USE-01 ใช้งานง่ายและไม่ซับซ้อน (ทีมเอง) | `NFR-USE-01`, `AC-ACCOUNT-01` | `TC-ACCOUNT-01`, `TC-ACCOUNT-14` | Open — `TC-ACCOUNT-14` ยังไม่มีเกณฑ์ผ่าน/ไม่ผ่านจนกว่าทีมกำหนด |
| Q-03 สภาพแวดล้อมทดสอบปกติสำหรับ NFR-PERF-01 มีเงื่อนไขด้านเครือข่ายหรือปริมาณการใช้งานอย่างไร (ทีมเอง) | `NFR-PERF-01`, `AC-ACCOUNT-08` | `TC-ACCOUNT-13` | Open — ไม่กำหนดเงื่อนไข test environment เพิ่มเติม |

## ผลตรวจความครบถ้วน

- ตรวจรายการใน `spec.md` ครบ `FR-ACCOUNT-01` ถึง `FR-ACCOUNT-09`, NFR ทั้ง 4 ข้อ, CON ทั้ง 7 ข้อ และ AC-ACCOUNT-01 ถึง AC-ACCOUNT-08; รวม 28 IDs
- Test Case ID ทุกตัวที่อ้างใน Matrix มีอยู่จริงใน `test-cases.md`; ไม่ได้สร้าง Test Case ID ใหม่
- `CON-ACCOUNT-03` เชื่อมทั้งกรณี validation ข้อมูลส่วนตัวและรหัสผ่านตาม requirement รายละเอียดใน spec; ไม่เพิ่มเงื่อนไขใหม่ให้ CON
- ไม่พบ FR, NFR หรือ CON ที่ไม่มี Test Case เชื่อมโยง; อย่างไรก็ตาม `NFR-USE-01` ยังประเมินส่วน “ใช้งานง่ายและไม่ซับซ้อน” ไม่ได้จนกว่าจะตอบ Q-02
- Coverage ของ `AC-ACCOUNT-03` ยังไม่ครบในกรณีข้อมูลส่วนตัวขาด required field เพราะ Q-01 ยังเปิดอยู่; กรณีเบอร์โทรศัพท์/อีเมลผิดรูปแบบและ password validation มี Test Case แล้ว
- `TC-ACCOUNT-02`, `TC-ACCOUNT-13` และ `TC-ACCOUNT-14` ยังรอ Q-01, Q-03 และ Q-02 ตามลำดับ; สถานะ Covered ใน Matrix หมายถึงมีกรณีทดสอบเชื่อมโยง ไม่ได้หมายถึงรันทดสอบแล้วหรือผ่านแล้ว
- Q-01, Q-02 และ Q-03 ยังคงเป็น Open Questions โดยไม่มีการตัดสินใจแทนทีม
