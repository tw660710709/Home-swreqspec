# แผนทางเทคนิค: เขียนและแก้ไขรีวิวหอพัก

ไฟล์ข้อกำหนดอ้างอิง: `spec.md`  
Spec ID: `SPEC-DOR-009` | สถานะข้อกำหนด: `Draft v2`

## 1. สรุปแนวทาง

1. สร้างหน้าและฟอร์มสำหรับผู้พักอาศัยที่เข้าสู่ระบบ เพื่อให้เลือกหอพักและเริ่มเขียนรีวิวพร้อมคะแนนและข้อความตาม `FR-REV-01`, `FR-REV-02`, `CON-AUTH-01` และ `CON-REVIEW-03`.
2. สร้างระบบตรวจสอบรูปภาพและข้อมูลรีวิวก่อนบันทึก โดยใช้ validation สำหรับคะแนน 1-5 ดาว, ข้อความที่ไม่ว่างเปล่า และไฟล์ JPG/JPEG/PNG ขนาดไม่เกิน 5 MB ต่อรูป ตาม `FR-REV-03`, `FR-REV-04`, `FR-REV-05`, `CON-REVIEW-02`, `CON-FILE-01` และ `CON-REVIEW-03`.
3. สร้าง workflow บันทึกรีวิว ลงฐานข้อมูล และคำนวณคะแนนเฉลี่ยใหม่หลังส่งหรือแก้ไขสำเร็จ เพื่อให้รีวิวและค่าคะแนนเฉลี่ยตรงกับข้อมูลล่าสุดตาม `FR-REV-06`, `FR-REV-07`, `FR-REV-08`, `FR-REV-11`, `CON-DATA-01` และ `ASM-20`.
4. สร้างหน้ารายละเอียดหอพักและฟอร์มแก้ไขรีวิวที่ดึงข้อมูลเดิมของผู้ใช้มาแสดงแล้วบันทึกเฉพาะส่วนที่แก้ไข เช่น คะแนนหรือข้อความหรือรูปภาพ ตาม `FR-REV-09`, `FR-REV-10`, `FR-REV-12`, `CON-REVIEW-01`, `CON-REVIEW-04` และ `ASM-23`.
5. วาง API, validation, UI state และแผนทดสอบให้ครอบคลุม Acceptance Criteria ทั้งหมด พร้อมยืนยันการป้องกันผู้ใช้อื่นแก้ไขรีวิวและรักษาความถูกต้องของข้อมูลภายใน 2 วินาที ตาม `NFR-PERF-03`, `NFR-SEC-04`, `NFR-DATA-04` และ `AC-REV-01` ถึง `AC-REV-08`.

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้างหน้ารีวิว, ฟอร์มเขียน/แก้ไข, validation, notification และ empty state |
| Python FastAPI | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้าง API สำหรับดึงและบันทึกรีวิว คำนวณค่าเฉลี่ย และจัดการ upload รูปภาพ |
| ฐานข้อมูลเชิงสัมพันธ์ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ `Review`, `ReviewImage`, `DormitoryScoreSummary` และข้อมูลความสัมพันธ์กับผู้ใช้ |
| Session/JWT auth ที่มีอยู่ในระบบ | `CON-AUTH-01` | ใช้ตรวจสิทธิ์ว่า user ต้องเข้าสู่ระบบก่อนเขียนหรือแก้ไขรีวิว |
| Upload validation / storage | `CON-FILE-01` | ใช้ตรวจ extension, file size, จำนวนรูปต่อรีวิว และจัดเก็บรูปเฉพาะแบบที่รองรับ |
| Retry + optimistic state control | `FR-REV-12`, `FR-REV-14` | ใช้เพื่อป้องกันบันทึกข้อมูลเมื่อยกเลิกหรือ invalid file และกักเก็บข้อมูลเดิมไว้ |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ |
|---|---|---|
| `ResidentUser` | `user_id`, `name`, `role` | `CON-AUTH-01`, `ASM-16`, `ASM-21` |
| `Dormitory` | `dormitory_id`, `name`, `average_rating` | `FR-REV-07`, `FR-REV-11`, `CON-DATA-01` |
| `Review` | `review_id`, `dormitory_id`, `user_id`, `rating`, `comment`, `created_at`, `updated_at`, `is_deleted` | `FR-REV-02`, `FR-REV-06`, `FR-REV-08`, `FR-REV-09`, `FR-REV-10`, `FR-REV-12`, `FR-REV-13`, `CON-REVIEW-02`, `CON-REVIEW-03`, `CON-REVIEW-04` |
| `ReviewImage` | `image_id`, `review_id`, `file_name`, `url`, `mime_type`, `size_bytes` | `FR-REV-03`, `FR-REV-05`, `FR-REV-14`, `CON-FILE-01` |
| `DormitoryScoreSummary` | `dormitory_id`, `review_count`, `average_rating`, `last_calculated_at` | `FR-REV-07`, `FR-REV-11`, `CON-DATA-01` |
| `ReviewAccessControl` | `review_id`, `owner_user_id` | `CON-REVIEW-01`, `NFR-SEC-04`, `ASM-17`, `ASM-21` |

กติกาข้อมูล:
- ไม่มีฟิลด์ที่ใช้เก็บข้อมูลส่วนบุคคลมากเกินความจำเป็นสำหรับฟีเจอร์นี้ เช่น ไม่เก็บรหัสบัตรประชาชน หรือข้อมูลสถิติย่อยที่ไม่ได้ระบุใน spec
- คะแนนรีวิวจะถูกบังคับให้เป็นตัวเลขจำนวนเต็ม 1 ถึง 5 เท่านั้นตาม `CON-REVIEW-02` และ `ASM-18`
- รูปภาพจะถูกเก็บให้มีจำนวนไม่เกิน 1 รูปต่อรีวิว ตาม `CON-FILE-01` และ `ASM-19`
- เมื่อมีการส่งหรือแก้ไขรีวิวสำเร็จ ระบบจะคำนวณค่าเฉลี่ยใหม่จากข้อมูลรีวิวทั้งหมดที่มีอยู่ในระบบ ตาม `CON-DATA-01` และ `ASM-20`

## 4. API / หน้าจอ

| รายการ | Input หลัก | Output หลัก | รองรับ |
|---|---|---|---|
| `GET /dormitories/{dormitoryId}/reviews` | `dormitoryId` | รายการรีวิวและคะแนนเฉลี่ย | `FR-REV-01`, `FR-REV-08`, `CON-REVIEW-04` |
| `POST /reviews` | `dormitoryId`, `userId`, `rating`, `comment`, `imageFile` | รีวิวที่สร้างใหม่และคะแนนเฉลี่ยใหม่ | `FR-REV-02`, `FR-REV-03`, `FR-REV-06`, `FR-REV-07`, `AC-REV-01` |
| `PUT /reviews/{reviewId}` | `reviewId`, `userId`, `rating?`, `comment?`, `imageFile?` | รีวิวที่อัปเดตแล้วและคะแนนเฉลี่ยใหม่ | `FR-REV-09`, `FR-REV-10`, `FR-REV-11`, `AC-REV-02` |
| `DELETE /reviews/{reviewId}` | `reviewId`, `userId` | ยืนยันลบรีวิว (ถ้ามี) | `ASM-17` (ไม่ใช่ฟีเจอร์หลัก แต่คงความสอดคล้องกับ lifecycle) |
| `POST /reviews/validate` | `rating`, `comment`, `imageFile` | ข้อผิดพลาดรายช่องหรือสถานะ valid | `FR-REV-04`, `FR-REV-05`, `FR-REV-13`, `FR-REV-14` |
| หน้ารายละเอียดหอพัก | ผู้ใช้งานที่เข้าชมหอพัก | แสดงคะแนนเฉลี่ย, รายการรีวิว, และปุ่มเขียน/แก้ไขรีวิว | `FR-REV-08`, `NFR-DATA-04` |
| หน้าฟอร์มเขียน/แก้ไขรีวิว | `rating`, `comment`, image upload | input form + alert message + save/cancel actions | `FR-REV-01`, `FR-REV-12`, `AC-REV-05`, `AC-REV-06`, `AC-REV-07` |
| Dialog กรณี invalid image | file upload ที่ไม่ผ่าน | ข้อความว่ารูปภาพไม่ถูกต้องและให้เลือกใหม่ | `FR-REV-14`, `AC-REV-06` |

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| `CON-AUTH-01` | ตรวจ session ก่อนอนุญาตให้เปิดฟอร์ม review และก่อนเรียก API create/update | ใช้แล้ว |
| `CON-REVIEW-01` | ตรวจว่า `user_id` ของรีวิวตรงกับ user ที่เข้าสู่ระบบก่อนอนุญาตให้แก้ไข | ใช้แล้ว |
| `CON-REVIEW-02` | validation rating 1-5 และตรวจว่าข้อความต้องไม่ว่างเปล่า ใน form และ API | ใช้แล้ว |
| `CON-REVIEW-03` | ป้องกัน save เมื่อไม่มีคะแนนหรือข้อความ และแจ้งเตือนก่อนบันทึก | ใช้แล้ว |
| `CON-FILE-01` | validation extension, size <= 5 MB, max 1 file/รีวิว และ reject invalid upload | ใช้แล้ว |
| `CON-DATA-01` | หลัง save/update คำนวณ average rating ใหม่จาก review ทั้งหมด และ update summary | ใช้แล้ว |
| `CON-REVIEW-04` | UI และ API ต้องใช้ข้อมูลที่ user บันทึกจริงและไม่แปลงค่า | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| `AC-REV-01` | `test_AC_REV_01_create_review_and_display_success` | Login เป็นผู้พักอาศัยที่มีสิทธิ์ เลือกเขียนรีวิว กรอกคะแนนและข้อความแล้วบันทึก ตรวจว่ารีวิวปรากฏในหน้ารายละเอียดหอพัก |
| `AC-REV-02` | `test_AC_REV_02_partial_edit_keeps_unchanged_fields` | เปิด review เดิม แล้วแก้ไขเฉพาะคะแนนหรือข้อความโดยไม่แตะรูปภาพ ตรวจว่ารูปภาพเดิมยังคงอยู่และข้อมูลที่ไม่ได้แก้ไขยังถูกคงไว้ |
| `AC-REV-03` | `test_AC_REV_03_average_rating_recalculated_after_save_or_edit` | ส่งหรือแก้ไข review แล้วตรวจว่าคะแนนเฉลี่ยใหม่คำนวณจากคะแนนของ review ทั้งหมด และตรงกับค่าเฉลี่ยเลขคณิต |
| `AC-REV-04` | `test_AC_REV_04_valid_image_is_accepted` | เลือกไฟล์ JPG/JPEG/PNG ขนาด <= 5 MB แล้วตรวจว่ารูปภาพถูกอัปโหลดและแสดงได้ชัดเจน |
| `AC-REV-05` | `test_AC_REV_05_missing_rating_or_comment_blocks_submit` | ปล่อยให้คะแนนหรือข้อความว่างและกดยืนยัน ตรวจว่าระบบแจ้งเตือนและไม่บันทึกข้อมูล |
| `AC-REV-06` | `test_AC_REV_06_invalid_image_keeps_old_image_and_informs_user` | เลือกไฟล์ไม่ตรงเงื่อนไข ตรวจว่าสามารถมีข้อความแจ้งเตือน และรูปภาพเดิมยังไม่ถูกลบ |
| `AC-REV-07` | `test_AC_REV_07_cancel_discards_change_and_returns_to_details` | กดปุ่มยกเลิกระหว่างเขียนหรือแก้ไขตรวจว่าระบบไม่บันทึกและกลับไปหน้าเดิม |
| `AC-REV-08` | `test_AC_REV_08_save_or_edit_finishes_within_two_seconds` | วัดเวลา request submit และการคำนวณ average rating ให้เสร็จภายใน 2 วินาที ภายใต้เงื่อนไขเครือข่ายปกติ |

## 7. ลำดับงาน

1. กำหนด entity, permission, และ review lifecycle สำหรับ `Review`, `ReviewImage`, `Dormitory`, `ResidentUser` ตาม `FR-REV-01`, `FR-REV-06`, `CON-AUTH-01`, `CON-REVIEW-01` และ `NFR-SEC-04`.
2. สร้าง UI หน้าแสดงรีวิวและหน้าฟอร์มเขียนรีวิว พร้อม validation สำหรับ rating 1-5 และข้อความที่ไม่ว่างเปล่า ตาม `FR-REV-01`, `FR-REV-02`, `FR-REV-04`, `CON-REVIEW-02`, `CON-REVIEW-03`.
3. สร้าง validation สำหรับ upload image และ UI form state เพื่อป้องกัน invalid file และบันทึกข้อมูลเดิมเมื่อมี error ตาม `FR-REV-03`, `FR-REV-05`, `FR-REV-14`, `CON-FILE-01`.
4. สร้าง API `POST /reviews` และ `PUT /reviews/{reviewId}` พร้อมตรวจสิทธิ์และตรวจว่ามี permission การแก้ไขตาม `CON-AUTH-01`, `CON-REVIEW-01`, `FR-REV-06`, `FR-REV-10`.
5. เพิ่ม logic บันทึก review และ refresh ค่าคะแนนเฉลี่ยใหม่ทันทีหลัง save/update ตาม `FR-REV-07`, `FR-REV-08`, `FR-REV-11`, `CON-DATA-01`, `AC-REV-03`.
6. สร้าง flow เรียกข้อมูลเดิมเมื่อผู้ใช้เลือกแก้ไขรีวิว และบันทึกเฉพาะ field ที่เปลี่ยนแปลงพร้อมคงข้อมูลเดิมที่ไม่แก้ไข ตาม `FR-REV-09`, `FR-REV-10`, `ASM-23`, `AC-REV-02`.
7. เพิ่ม action ยกเลิกและ error handling เพื่อล้างการเปลี่ยนแปลงและกลับสู่หน้ารายละเอียดหอพักตาม `FR-REV-12`, `FR-REV-13`, `FR-REV-14`, `AC-REV-05`, `AC-REV-06`, `AC-REV-07`.
8. ทดสอบตาม AC ทั้งหมด และวัดเวลา response ให้ไม่เกิน 2 วินาทีตาม `NFR-PERF-03`, `AC-REV-08`.

## 8. สิ่งที่ยังไม่ทำ

จาก spec.md มี Open Question ดังนี้:
- `OQ-01` ระบุว่า “ไม่มี Open Question ที่ต้องถามเพิ่มเติมในด้านนี้หลังคำตอบที่ได้รับแล้ว”

ดังนั้นในแผนนี้จะไม่สร้างงานเพิ่มเติมใด ๆ ที่เกี่ยวข้องกับการถาม/ตอบ Open Question เพราะข้อกังวลที่ยังค้างถูกปิดแล้วโดยทีมและ spec ได้ถูกปรับเป็น Draft v2 แล้ว

สิ่งที่ไม่ได้รวมในแผนนี้และชัดเจนใน Out of scope ได้แก่:
- การรีวิวหอพักโดย Guest ที่ไม่มีสิทธิ์รีวิว
- การแก้ไขหรือลบรีวิวของผู้ใช้อื่น
- การจัดการหรือตรวจสอบรีวิวโดยเจ้าของหอพัก
- การตรวจสอบและอนุมัติเนื้อหารีวิวโดย Admin
- การจองห้องพัก
- การจัดการข้อมูลหอพัก
