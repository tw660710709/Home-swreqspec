# แผนทางเทคนิค: ดูข้อมูลค่าใช้จ่ายห้องพัก (Room Expenses)

อ้างอิง: `specs/011-view-expenses/spec.md`  
Spec ID: `SPEC-EXP-011` | Status: `Draft v2`

## 1. สรุปแนวทาง
1. ตรวจสอบ Token และดึง `room_id` ของผู้ใช้อัตโนมัติเพื่อบังคับใช้ Data Isolation ตาม `NFR-SEC-01`
2. สร้าง API ดึงข้อมูลบิลรายเดือน และรองรับพารามิเตอร์รอบเดือน (YYYY-MM) ตาม `FR-EXP-01`, `FR-EXP-03`
3. Backend จัดเตรียมยอดรวมและรายละเอียดปลีกย่อย (เช่น JSON เลขมิเตอร์) ส่งผ่าน API ตาม `FR-EXP-02`, `FR-EXP-04`, `ASM-01`, `ASM-02`
4. สร้างหน้าจอ React แสดงบิล จัดการตัวเลือกเปลี่ยนเดือน และแสดงข้อความ Empty State อย่างเหมาะสม ตาม `FR-EXP-05`, `FR-EXP-06`
5. ทดสอบ API Security (Cross-room access) และ Performance ให้อยู่ในเกณฑ์ 2 วินาที ตาม `NFR-SEC-01`, `NFR-PERF-01`

## 2. เทคโนโลยีที่ใช้
| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | สร้างหน้า UI แสดงรายการบิลและ Dropdown เลือกรอบเดือน |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | สร้าง API จ่ายข้อมูลค่าใช้จ่าย |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ `RoomBill` โยงกับ `room_id` |
| HTTPS (TLS 1.2 ขึ้นไป) | `NFR-SEC-01` | ป้องกันการดักจับข้อมูลค่าใช้จ่ายระหว่างส่ง |

## 3. โมเดลข้อมูล
| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `RoomBill` | `id`, `room_id`, `billing_month`, `total_amount`, `status`, `created_at` | `FR-EXP-01`, `FR-EXP-02`, `FR-EXP-03`, `ASM-01` |
| `BillItem` | `id`, `bill_id`, `item_type`, `amount`, `details_json` | `FR-EXP-01`, `FR-EXP-04`, `ASM-02` |

กติกาข้อมูล:
- บังคับใส่ Condition `room_id` ที่ได้จาก Token ในทุก Query ห้ามรับพารามิเตอร์ `room_id` จากฝั่ง Client เด็ดขาด (`NFR-SEC-01`)
- หาก Resident Query แต่ไม่พบห้องผูกในตารางระบบ ให้คืน Error ทันที (`FR-EXP-05`)

## 4. API / หน้าจอ
- `GET /api/expenses` — รับ Query Param `month` (Optional), คืนค่า Array บิลและรายการย่อย หรือคืน Error ไม่พบบิล/ห้องพัก ตาม `FR-EXP-01`, `FR-EXP-03`
- หน้าจอ `/expenses` — แสดงยอดเงินรวม (ดึง `total_amount` ตรงๆ จาก Backend ตาม `ASM-01`), รายการ `BillItem`, Dropdown หรือ List เลือกเดือนตาม `FR-EXP-02`, `FR-EXP-03`
- Component `ExpenseItemDetail` — กางออก (Accordion/Modal) เพื่อโชว์ JSON รายละเอียด เช่น เลขมิเตอร์ ตาม `FR-EXP-04`, `ASM-02`

## 5. ตารางตรวจ Constraints
| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-SYS-01` | ดักเช็คใน Middleware หาก User ไม่มี Room ผูกอยู่ ให้ส่ง Response 404 กลับไป | ใช้แล้ว |
| `CON-UI-01` | Layout หน้าบิล ถูกจัดโครงสร้าง Grid/Flex ให้ Responsive | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria
| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-EXP-01` | `test_AC_EXP_01_view_current_expenses` | จำลองข้อมูลบิลเดือนปัจจุบัน เรียก API ตรวจยอดรวมและรายละเอียดที่แสดง |
| `AC-EXP-02` | `test_AC_EXP_02_view_past_empty_month` | เรียก API ด้วย Param เดือนที่ไม่มีบิล ตรวจข้อความ "ไม่มีข้อมูลค่าใช้จ่าย..." |
| `AC-EXP-03` | `test_AC_EXP_03_view_item_details` | ตรวจสอบ Data payload ของ `BillItem` ว่ามีฟิลด์ `details_json` ถูกส่งมาแสดงผลครบ |
| `AC-EXP-04` | `test_AC_EXP_04_cross_room_security` | User ห้อง A จำลองยิง Query เจาะบิลห้อง B ตรวจว่าระบบ Return 403 หรือ 404 ป้องกันสำเร็จ |
| `AC-EXP-05` | `test_AC_EXP_05_no_room_assigned` | User สมัครใหม่ยิง API ค่าใช้จ่าย ตรวจสอบข้อความ "ไม่พบข้อมูลห้องพัก" |
| `AC-EXP-06` | `test_AC_EXP_06_response_p95` | Load test ยิงอ่าน API ค่าใช้จ่าย ตรวจค่า p95 <= 2 วินาที |

การทดสอบเพิ่มเติมที่ผูกกับข้อกำหนด:
- ทดสอบ Responsive Layout ในหน้า `/expenses` ตาม `CON-UI-01`

## 7. ลำดับงาน
1. วางโครงสร้าง Schema ของตารางบิลและรายการย่อย
2. พัฒนา `GET /api/expenses` โดยสร้าง Layer บังคับตรวจ Security (Room Isolation) ตาม `NFR-SEC-01`
3. เขียน Query ดึงบิลปัจจุบันหรือย้อนหลังเดือนที่เลือกตาม `FR-EXP-03`
4. พัฒนาหน้าจอ `/expenses` ด้วย React พร้อม UI สำหรับเปลี่ยนเดือนและ Empty states ตาม `FR-EXP-05`, `FR-EXP-06`
5. พัฒนา Accordion/Modal เพื่อแสดงข้อมูล `details_json` ตาม `FR-EXP-04`
6. รันทดสอบ Security `AC-EXP-04` และ Performance `AC-EXP-06` อย่างเคร่งครัด

## 8. สิ่งที่ยังไม่ทำ
Spec ฉบับนี้ไม่มีรายการ Q-xx ในหัวข้อ Open Questions และถูกแปลงเป็น `ASM` หมดแล้ว
ยังไม่สร้างสิ่งต่อไปนี้ตาม Out of scope:
- การชำระเงินผ่านระบบ 
- การ Export บิลเป็นไฟล์ PDF