# แผนทางเทคนิค: อัปเดตสถานะห้องว่าง

ไฟล์ข้อกำหนดอ้างอิง: `spec.md`  
Spec ID: `SPEC-DOR-004` | สถานะข้อกำหนด: `Draft v2`

## 1. สรุปแนวทาง

1. สร้างหน้าจัดการห้องพักสำหรับเจ้าของหอพักที่เข้าสู่ระบบ เพื่อแสดงลิสต์ห้องพักและสถานะปัจจุบันของแต่ละห้อง โดยตรวจสิทธิ์ว่าเป็นเจ้าของหอพักหรือผู้ได้รับมอบหมายเท่านั้น (`CON-AUTH-01`, `CON-AUTH-02`, `FR-DOR-19`)
2. สร้าง UI batch update ที่ช่วยให้เลือกหลายห้องพร้อมกัน กำหนดสถานะใหม่ และยิงการยืนยันก่อนบันทึกเพื่อให้ batch update เป็น transaction ตาม `FR-DOR-21`, `FR-DOR-22` และ `ASM-17`
3. สร้าง workflow บันทึกสถานะใหม่ลงฐานข้อมูลและแสดงข้อความสำเร็จทันที พร้อมการคงสถานะเดิมเมื่อยกเลิกหรือ error ตาม `FR-DOR-23`, `FR-DOR-24`, `FR-DOR-25`, `FR-DOR-27`, `FR-DOR-28`, `ASM-15`
4. สร้าง sync mechanism เพื่อเผยแพร่สถานะใหม่ให้ผู้ใช้งานทั่วไปเห็นเมื่อเปิดหรือ refresh หน้า และแจ้งเตือนเมื่อ sync ล้มเหลว พร้อม Retry ตาม `CON-SYNC-01`, `FR-DOR-26`, `NFR-PERF-02`, `NFR-DATA-03`
5. วางโครง API, validation, และแผนทดสอบให้ครอบคลุม Acceptance Criteria ทั้งหมด เพื่อให้การอัปเดตสถานะเสร็จภายใน 2 วินาที และมีความปลอดภัยต่อการแก้ไขห้องผิดเจ้าของ (`NFR-SEC-03`, `AC-DOR-13` ถึง `AC-DOR-19`)

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้างหน้าแสดงห้องพัก, batch selector, modal ยืนยัน, notification, และ retry flow |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้าง API สำหรับดึงห้องพัก, อัปเดตสถานะแบบ batch, และ sync status ไปยัง public view |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ `RoomStatus` และบันทึกการเปลี่ยนแปลงแบบ transaction เพื่อให้ยกเลิก/rollback มีความน่าเชื่อถือ |
| Session/JWT auth ที่มีอยู่ในระบบ | `CON-AUTH-01`, `CON-AUTH-02` | ใช้ตรวจสิทธิ์ว่าเป็นเจ้าของหอพักหรือผู้ได้รับมอบหมายจากเจ้าของหอพักเท่านั้น |
| Notification + retry pattern | `CON-SYNC-01`, `FR-DOR-28` | ใช้สำหรับ sync สถานะล่าสุดเข้าสู่ public view และแจ้งเตือนเมื่อ sync ล้มเหลว |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `Room` | `room_id`, `dormitory_id`, `room_number`, `status`, `updated_at`, `updated_by` | `FR-DOR-19`, `FR-DOR-20`, `FR-DOR-23`, `FR-DOR-25`, `CON-STATUS-01` |
| `Dormitory` | `dormitory_id`, `owner_id`, `name`, `status` | `CON-AUTH-02`, `FR-DOR-19` |
| `RoomStatusUpdateBatch` | `batch_id`, `owner_id`, `dormitory_id`, `selected_room_ids`, `new_status`, `requested_at`, `confirmed_at` | `FR-DOR-21`, `FR-DOR-22`, `ASM-17` |
| `RoomStatusSyncEvent` | `event_id`, `room_id`, `old_status`, `new_status`, `sync_status`, `last_attempt_at` | `CON-SYNC-01`, `FR-DOR-26`, `FR-DOR-28` |
| `PermissionAssignment` | `assignment_id`, `dormitory_id`, `user_id`, `role`, `granted_by` | `CON-AUTH-02`, `NFR-SEC-03` |
| `ValidationError` | `field_name`, `message`, `retry_allowed` | `FR-DOR-28`, `AC-DOR-18` |

กติกาข้อมูล:

- สถานะห้องพักจะถูกจำกัดให้มีค่าเท่านั้น: `AVAILABLE` / `FULL` หรือแปลงเป็นข้อความ “ห้องว่าง” และ “ห้องเต็ม” ตาม `CON-STATUS-01`
- `RoomStatusUpdateBatch` จะเก็บเฉพาะข้อมูลที่ user กำหนดและยืนยันเท่านั้น ไม่เก็บ intermediate state ที่ยังไม่ได้ confirm ตาม `FR-DOR-22`, `FR-DOR-27`
- ไม่เก็บสถานะห้องพักมากกว่า 2 ค่า หรือ extra status field ที่ไม่ถูกระบุใน spec (`CON-STATUS-01`)
- การรายงานไปยัง public view จะอ่านจาก `Room.status` ที่อัปเดตแล้ว และไม่ใช้ cached status ที่ยังไม่ได้บันทึกตาม `CON-DATA-01`, `ASM-15`

## 4. API / หน้าจอ

| รายการ | Input หลัก | Output หลัก | รองรับ |
|---|---|---|---|
| `GET /owners/dormitories/{dormitoryId}/rooms` | `dormitoryId`, `owner_id` จาก session | รายการห้องพักพร้อมสถานะปัจจุบัน | `FR-DOR-19`, `CON-AUTH-01`, `CON-AUTH-02` |
| `POST /owners/dormitories/{dormitoryId}/rooms/status-batch` | `selected_room_ids[]`, `new_status`, `owner_id` | success/error result พร้อม batch summary | `FR-DOR-21`, `FR-DOR-22`, `FR-DOR-23`, `FR-DOR-27`, `FR-DOR-28` |
| `POST /owners/dormitories/{dormitoryId}/rooms/status-batch/confirm` | `batch_id`, `owner_id` | บันทึก status ใหม่และคืนผล | `FR-DOR-22`, `FR-DOR-23`, `FR-DOR-24` |
| `POST /owners/dormitories/{dormitoryId}/rooms/status-batch/cancel` | `batch_id`, `owner_id` | ยกเลิกและคืนสถานะเดิมของ batch ทั้งหมด | `FR-DOR-27`, `ASM-15` |
| `POST /sync/public-room-status` | `room_id`, `new_status`, `retry_count` | status sync result และ error message หากล้ม | `CON-SYNC-01`, `FR-DOR-26`, `FR-DOR-28` |
| หน้ารายการห้องพัก | ผู้ใช้ที่มีสิทธิ์จัดการ | ตารางห้องพักพร้อมปุ่มเปลี่ยนสถานะ | `FR-DOR-19`, `FR-DOR-20`, `AC-DOR-13` |
| หน้าตกลง batch update | เลือกห้องหลายห้อง + new status | modal ยืนยันและผลลัพธ์ | `FR-DOR-21`, `FR-DOR-22`, `AC-DOR-14` |
| Notification/Retry state | API result/error | ข้อความสำเร็จ/ล้มเหลว พร้อม Retry | `FR-DOR-24`, `FR-DOR-28`, `AC-DOR-18` |
| Public room page | page refresh | สถานะล่าสุดที่โหลดจากฐานข้อมูล | `FR-DOR-26`, `AC-DOR-16` |

หมายเหตุ: endpoint ที่ระบุด้านบนเป็นสัญญาเชิงตรรกะสำหรับการวางแผนเท่านั้น เพื่อให้ plan วางโครงงานได้ชัดเจน และยังไม่กำหนดรายละเอียดทางเทคนิคระดับลึกจนเกินข้อกำหนด

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-AUTH-01` | ตรวจสิทธิ์ login ก่อนเข้าหน้าการจัดการห้องพักและก่อนเรียก API | ใช้แล้ว |
| `CON-AUTH-02` | ตรวจสิทธิ์ `owner_id` หรือ `PermissionAssignment` ก่อนอนุญาต batch update | ใช้แล้ว |
| `CON-STATUS-01` | Validation ของ `new_status` ให้มีค่าเฉพาะ “ห้องว่าง” หรือ “ห้องเต็ม” | ใช้แล้ว |
| `CON-DATA-01` | บันทึกลงฐานข้อมูลก่อนแสดงสถานะใหม่ และใช้ transaction/rollback สำหรับ batch | ใช้แล้ว |
| `CON-SYNC-01` | sync flow สำหรับ public view ที่ต้องแสดงสถานะใหม่ภายใน 2 วินาที และ error/retry flow | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-DOR-13` | `test_AC_DOR_13_update_single_room_status` | Login เป็นเจ้าของหอพักที่มีสิทธิ์ จัดการห้อง 1 ห้อง เปลี่ยนเป็น “ห้องว่าง” หรือ “ห้องเต็ม” แล้วตรวจว่าระบบอัปเดต UI และ DB ตามค่าใหม่ |
| `AC-DOR-14` | `test_AC_DOR_14_batch_update_multiple_rooms` | เลือกหลายห้องพร้อมกัน กำหนดสถานะใหม่และกดยืนยันครั้งเดียว ตรวจว่าทั้งหมดถูกอัปเดตพร้อมกัน และไม่ค้างบางห้อง |
| `AC-DOR-15` | `test_AC_DOR_15_success_notification_and_immediate_ui_update` | บันทึกสำเร็จ ตรวจว่าแสดงข้อความแจ้งเตือน และสถานะใน UI เปลี่ยนทันทีหลัง save |
| `AC-DOR-16` | `test_AC_DOR_16_public_view_refresh_shows_latest_status` | จากฐานข้อมูลหลังอัปเดตสถานะแล้ว เปิด/Refresh หน้า search/page detail ตรวจว่าผู้ใช้งานทั่วไปเห็นสถานะล่าสุด |
| `AC-DOR-17` | `test_AC_DOR_17_cancel_keeps_original_status_for_all_selected_rooms` | เลือกหลายห้องแล้วกดยกเลิก ตรวจว่าไม่มีห้องใดเปลี่ยน state และคงสถานะเดิมทุกห้อง |
| `AC-DOR-18` | `test_AC_DOR_18_retry_on_save_failure` | จำลอง DB error ระหว่างบันทึก ตรวจว่าแสดงข้อความ “ไม่สามารถบันทึกสถานะได้” และมี Retry action ที่สามารถลองใหม่ได้ |
| `AC-DOR-19` | `test_AC_DOR_19_status_update_finishes_within_two_seconds` | ส่ง batch update ขนาดเล็ก/ปานกลาง และวัดเวลา response UI update ไม่เกิน 2 วินาทีภายใต้สภาวะเครือข่ายปกติ |

## 7. ลำดับงาน

1. กำหนด entity และ permission model สำหรับห้องพัก, เจ้าของหอพัก, ผู้ได้รับมอบหมาย, และ batch update ตาม `FR-DOR-19`, `CON-AUTH-01`, `CON-AUTH-02`, `ASM-16`
2. สร้างหน้ารายการห้องพักและ table UI พร้อมแสดงสถานะปัจจุบันและ selector สำหรับ batch update ตาม `FR-DOR-19`, `AC-DOR-13`
3. สร้าง form/modal ยืนยัน batch update และ validation ให้มีค่า status เฉพาะ “ห้องว่าง” / “ห้องเต็ม” ตาม `FR-DOR-20`, `FR-DOR-21`, `FR-DOR-22`, `CON-STATUS-01`
4. สร้าง API สำหรับบันทึก batch update ลงฐานข้อมูล พร้อม transaction/rollback สำหรับ error/cancel ตาม `FR-DOR-23`, `FR-DOR-27`, `FR-DOR-28`, `CON-DATA-01`, `ASM-15`
5. เพิ่ม notification, immediate UI refresh, และ retry flow สำหรับ save failure หรือ sync failure ตาม `FR-DOR-24`, `FR-DOR-25`, `FR-DOR-28`, `CON-SYNC-01`
6. สร้าง sync public-view flow สำหรับหน้าค้นหาและรายละเอียดเมื่อ refresh/open page ตาม `FR-DOR-26`, `NFR-DATA-03`, `AC-DOR-16`
7. ทดสอบตาม AC ทั้งหมด รวมถึง performance 2 วินาที และ batch rollback ตาม `AC-DOR-13` ถึง `AC-DOR-19`
8. ตรวจสิทธิ์การแก้ไขห้องพักผิดเจ้าของและบันทึกข้อมูลตาม `NFR-SEC-03` และ `CON-AUTH-02`

## 8. สิ่งที่ยังไม่ทำ

จาก spec.md มี Open Questions ที่ยังไม่มีคำตอบในตอนนี้ ดังนี้:

- `Q1` การเลือกหลายห้องแล้วกดยืนยันครั้งเดียวเพื่อบันทึกสถานะพร้อมกัน — ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้รับการยืนยันแบบชัดเจนจากทีม
- `Q2` ผู้ที่มีสิทธิ์จัดการคือเจ้าของหอพักที่เข้าสู่ระบบ และผู้ที่ได้รับมอบหมายจากเจ้าของหอพักเท่านั้น — ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้ยืนยันว่า role/assignment แบบไหนมีผลจริงในระบบ
- `Q3` หลังบันทึกสำเร็จ ระบบต้องเผยแพร่สถานะใหม่ภายใน 2 วินาที หาก sync ล้มเหลวให้แจ้งเตือนและสามารถ Retry ได้ — ส่วนที่เกี่ยวข้องจะยังไม่สร้างจนกว่าจะยืนยันรายละเอียดการ sync และ retry flow
- `Q4` หากยกเลิกหรือเกิด Error ระหว่างบันทึก ให้คงสถานะเดิมของห้องทั้งหมดที่เลือกไว้ และไม่บันทึกการเปลี่ยนแปลงบางส่วน — ส่วนที่เกี่ยวข้องจะยังไม่สร้างจนกว่าจะยืนยันว่า batch update ใช้ transaction หรือ rollback แบบไหน
- `Q5` ระบบรองรับสถานะห้องพักเพียง 2 สถานะ คือ “ห้องว่าง” และ “ห้องเต็ม” — ส่วนที่เกี่ยวข้องจะยังไม่สร้างจนกว่าจะยืนยันว่าไม่มีสถานะเพิ่มเติมในโครงข้อมูล
- `Q6` ผู้ใช้งานทั่วไปจะเห็นสถานะล่าสุดเมื่อเปิดหรือ Refresh หน้า โดยไม่ต้องรองรับ Real-time Update — ส่วนที่เกี่ยวข้องจะยังไม่สร้างจนกว่าจะยืนยันว่า public page ใช้ refresh-based loading เท่านั้น

สิ่งที่ไม่รวมอยู่ในแผนนี้และมีชัดเจนใน Out of scope ได้แก่:

- การเพิ่มหรือแก้ไขรายละเอียดห้องพัก ราคา และข้อมูลหอพักอื่น ๆ (UC-03)
- การค้นหาและดูข้อมูลหอพักของผู้ใช้งานทั่วไป (UC-01)
- การนัดหมายเพื่อดูห้องพัก (UC-06)
- การจองห้องพัก (UC-12)
- การตรวจสอบและอนุมัติหอพักโดย Admin (UC-13)
