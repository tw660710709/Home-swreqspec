# แผนทางเทคนิค: จองห้องพัก (Room Reservation)

อ้างอิง: `specs/012-book-room/spec.md`  
Spec ID: `SPEC-BKG-012` | Status: `Draft v2`

## 1. สรุปแนวทาง
1. เช็คสิทธิ์และสกัดคนล็อกอินแล้วเท่านั้นเข้าหน้าจอง พร้อมเช็คสถานะห้อง `CON-SYS-01`, `CON-BUS-01`
2. สร้างแบบฟอร์มยืนยันข้อมูลจอง และ UI แสดงค่าใช้จ่ายอิงตาม `FR-BKG-01`, `FR-BKG-02`
3. พัฒนา API การจองแบบ Transactional มีการใช้ `SELECT ... FOR UPDATE` หรือ Locking คุม Concurrency ป้องกัน `FR-BKG-04`, `NFR-SEC-01`
4. บันทึกคำขอจองลง DB และอัปเดตสถานะห้องพร้อมกันใน 1 Transaction ตาม `FR-BKG-05`, `ASM-01`
5. จัดการปุ่มยกเลิกด้วย Client Router และดักจับ 409 Conflict แสดงข้อความห้องไม่ว่าง `FR-BKG-03`, `FR-BKG-04`

## 2. เทคโนโลยีที่ใช้
| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | สร้างฟอร์มและจัดการ State ยกเลิก/สำเร็จ/ห้องเต็ม |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | สร้าง API แบบ Asynchronous เพื่อจัดการคำขอจอง |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ ACID Properties (Row Locking/Transaction) ควบคุมการจองซ้ำตาม `NFR-SEC-01` |

## 3. โมเดลข้อมูล
| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `Room` | `id`, `availability_status` | `FR-BKG-04`, `FR-BKG-05`, `ASM-01` |
| `Reservation` | `id`, `user_id`, `room_id`, `move_in_date`, `status`, `created_at` | `FR-BKG-02`, `FR-BKG-05`, `ASM-02` |

กติกาข้อมูล:
- การ Insert `Reservation` และ Update `Room` (เปลี่ยนสถานะเป็น รอการยืนยัน) ต้องอยู่ใน Transaction ก้อนเดียวกัน ห้ามแยก `ASM-01`
- ต้องใช้ Locking logic ดักเช็ค `availability_status` วินาทีสุดท้ายก่อนบันทึก `NFR-SEC-01`

## 4. API / หน้าจอ
- `POST /api/reservations` — รับข้อมูลจอง เช็ค Lock ห้อง บันทึก Transaction แจ้งผล 201 Created หรือคืน 409 Conflict กรณีห้องถูกจองไปแล้วตาม `FR-BKG-04`, `FR-BKG-05`
- หน้าจอ `/rooms/:id/book` — หน้า UI ดึงข้อมูลห้องมาแสดง ตรวจเช็ค Token และจัดการปุ่มกดยืนยัน/ยกเลิกตาม `FR-BKG-01`, `FR-BKG-02`, `FR-BKG-03`

## 5. ตารางตรวจ Constraints
| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-SYS-01` | Guard Router หน้าจอง และ Middleware ของ API จอง | ใช้แล้ว |
| `CON-BUS-01` | หน้าจอจะ Redirect หนีทันทีถ้าโหลดข้อมูลแล้วพบว่าสถานะไม่ใช่ "ว่าง" | ใช้แล้ว |
| `CON-UI-01` | หน้า UI ถูกจัดเรียงด้วย Responsive Grid ของ React | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria
| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-BKG-01` | `test_AC_BKG_01_successful_book` | ยิง API ข้อมูลครบ ตรวจ DB ว่าบันทึก Reservation และ Room เปลี่ยนสถานะ |
| `AC-BKG-02` | `test_AC_BKG_02_concurrency_lock` | ยิง Load/Thread 2 request พร้อมกันเป๊ะ ตรวจว่า 1 คำขอได้ 201 และอีกคำขอได้ 409 Conflict |
| `AC-BKG-03` | `test_AC_BKG_03_missing_date` | ส่ง API ขาดวันที่ย้ายเข้า ตรวจว่าตีกลับ 400 Bad Request |
| `AC-BKG-04` | `test_AC_BKG_04_cancel_booking` | กดปุ่มยกเลิกหน้าเว็บ ตรวจ Browser History ว่ากลับหน้ารายละเอียดห้อง |
| `AC-BKG-05` | `test_AC_BKG_05_book_occupied_room` | ตั้งห้องเป็น "รอการยืนยัน" แล้วยิง API จอง ตรวจว่าได้ 409 Conflict ไม่บันทึกซ้ำ |
| `AC-BKG-06` | `test_AC_BKG_06_response_p95` | Load test วัดเวลาการทำ Transaction ทั้งหมดยืนยัน p95 <= 2 วินาที |

## 7. ลำดับงาน
1. เตรียมโมเดลตาราง `Reservation`
2. **(สำคัญมาก)** เขียน API `POST /api/reservations` ที่มี Database Row-level lock (`SELECT ... FOR UPDATE`) ป้องกันจองซ้ำตาม `NFR-SEC-01`, `FR-BKG-04`
3. เขียน Logic ควบรวม Update สถานะห้องใน Transaction ตาม `FR-BKG-05`
4. พัฒนาหน้าจอ `/rooms/:id/book` โหลดรายละเอียดก่อนจองตาม `FR-BKG-01`
5. จัดการ UI แจ้งเตือน Validation หรือ Toast/Modal ตอนจองสำเร็จ/ห้องเต็มตาม `FR-BKG-02`
6. ทดสอบ Concurrency script สำหรับ `AC-BKG-02` ให้แน่ใจว่า Lock ทำงานจริง
7. วัด Performance ให้อยู่ใน 2 วินาที

## 8. สิ่งที่ยังไม่ทำ
ไม่มี Open Questions แล้ว
Out of scope ที่ตัดออก:
- ระบบตัดเงิน/โอนเงินค่ามัดจำ
- Flow การที่ Admin/Owner กดอนุมัติหรือยกเลิกการจอง