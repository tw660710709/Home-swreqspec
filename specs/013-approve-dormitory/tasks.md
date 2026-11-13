# Implementation Tasks: ตรวจสอบและอนุมัติหอพัก

Feature: UC-13 | ตรวจสอบและอนุมัติหอพัก
Spec: SPEC-ADM-001

- อ้างอิง: [spec.md](./spec.md), [plan.md](./plan.md)

---

## 1. ลำดับงาน

| ลำดับ | งาน | รองรับ | สถานะ |
| --- | --- | --- | --- |
| 1 | ตรวจสอบและยืนยันรายการ Required fields และ Required documents ที่ใช้เป็นเกณฑ์อนุมัติจากแบบฟอร์มลงทะเบียนหอพัก | FR-ADM-03, CON-ADM-02, ASM-06 | pending |
| 2 | สร้าง/ปรับโครงสร้างข้อมูล Dormitory และสถานะการตรวจสอบ (`Pending Review`, `Approved`, `Need Revision`, `Rejected`) พร้อมเงื่อนไขว่า `Approved` เท่านั้นจะแสดงต่อผู้ใช้งานทั่วไป โดยไม่สร้างระบบ UC-01 ซ้ำ | FR-ADM-01, FR-ADM-07, NFR-DATA-01, CON-ADM-05 | pending |
| 3 | สร้าง ApprovalHistory แบบ append-only พร้อม field `history_id`, `dormitory_id`, `admin_id`, `action`, `reason`, `created_at` และ validation สำหรับเหตุผล (Approved: อาจเป็นค่าว่าง, Need Revision/Rejected: ต้องมี 1–500 ตัวอักษร) | FR-ADM-05, FR-ADM-06, FR-ADM-08, CON-ADM-03, CON-ADM-04, ASM-03, ASM-07, ASM-09 | pending |
| 4 | เพิ่มตรวจสอบสิทธิ์ Admin ก่อนเข้าถึงฟังก์ชันตรวจสอบหอพัก | FR-ADM-10, CON-ADM-01, NFR-SEC-01, AC-ADM-07 | pending |
| 5 | สร้าง API และบริการแสดงรายการหอพักที่รอตรวจสอบและรายละเอียดหอพัก/เอกสาร | FR-ADM-01, FR-ADM-02, NFR-USE-01, AC-ADM-01 | pending |
| 6 | สร้าง flow การอนุมัติพร้อมการตรวจ Required data/documents และ Database Transaction | FR-ADM-03, FR-ADM-04, CON-ADM-02, CON-ADM-07, AC-ADM-02, AC-ADM-06, AC-ADM-08 | pending |
| 7 | สร้าง flow ขอให้แก้ไข พร้อม validation เหตุผล 1–500 ตัวอักษร และบันทึกประวัติ | FR-ADM-05, CON-ADM-03, CON-ADM-04, AC-ADM-03, AC-ADM-05 | pending |
| 8 | สร้าง flow ปฏิเสธ พร้อม validation เหตุผล 1–500 ตัวอักษร และบันทึกประวัติ | FR-ADM-06, CON-ADM-03, CON-ADM-04, AC-ADM-04, AC-ADM-05 | pending |
| 9 | สร้าง Notification ภายในระบบสำหรับ Approved / Need Revision / Rejected หลังบันทึกผลสำเร็จ พร้อมข้อมูลผลและเหตุผลที่เจ้าของหอพักสามารถเปิดดูย้อนหลังได้ โดยไม่กำหนดรูปแบบ UI เพิ่มเติม | FR-ADM-09, CON-ADM-04, ASM-02, AC-ADM-02, AC-ADM-03, AC-ADM-04 | pending |
| 10 | สร้าง flow รับการส่งตรวจสอบใหม่จาก `Need Revision` และเปลี่ยนสถานะกลับเป็น `Pending Review` โดย UC-13 รับผิดชอบเฉพาะ re-review flow | FR-ADM-07, CON-ADM-06, ASM-04, ASM-08 | pending |
| 11 | สร้างหน้าจอ Admin สำหรับ Pending Review / Review / Approval History และหน้าจอ Owner Notification | FR-ADM-01, FR-ADM-02, FR-ADM-09, NFR-USE-01, AC-ADM-01, AC-ADM-03, AC-ADM-04 | pending |
| 12 | ทดสอบครบตาม Acceptance Criteria รวมการส่งตรวจสอบใหม่หลายรอบ, ความเป็น Append-only ของ ApprovalHistory, transaction rollback, permission และ notification | AC-ADM-01 ถึง AC-ADM-08, NFR-SEC-01, NFR-AUD-01, NFR-DATA-01, NFR-USE-01 | pending |

---

## 2. งานที่ต้องรอคำตอบ

- ไม่มีใน UC-13 ณ เวอร์ชันปัจจุบัน เพราะ Spec v2 ไม่มี Open Question

---

## 3. ตารางครอบคลุม AC

| AC ID | งานที่ตรวจ | สถานะ |
| --- | --- | --- |
| AC-ADM-01 | งาน 5 และงาน 11 | pending |
| AC-ADM-02 | งาน 6 และงาน 9 | pending |
| AC-ADM-03 | งาน 7 และงาน 9 | pending |
| AC-ADM-04 | งาน 8 และงาน 9 | pending |
| AC-ADM-05 | งาน 3, งาน 7, งาน 8, งาน 10, งาน 12 | pending |
| AC-ADM-06 | งาน 1 และงาน 6 | pending |
| AC-ADM-07 | งาน 4 | pending |
| AC-ADM-08 | งาน 6 และงาน 12 | pending |

---

## 4. ตารางครอบคลุม Constraint

| Constraint ID | งานที่รองรับ | สถานะ |
| --- | --- | --- |
| CON-ADM-01 | งาน 4 | pending |
| CON-ADM-02 | งาน 1 และงาน 6 | pending |
| CON-ADM-03 | งาน 3, งาน 7, งาน 8 | pending |
| CON-ADM-04 | งาน 3, งาน 7, งาน 8, งาน 9 | pending |
| CON-ADM-05 | งาน 2 | pending |
| CON-ADM-06 | งาน 10 | pending |
| CON-ADM-07 | งาน 6 และงาน 12 | pending |

---

## 5. ข้อควรระวังในการทำงาน

- ห้ามเพิ่ม business rule ที่ไม่มีใน Spec เช่น การกำหนดรายการ Required field/documents แบบใหม่นอกเหนือจาก “รายการที่กำหนดเป็น Required ในแบบฟอร์มลงทะเบียนหอพัก”
- ห้ามรวมงานจัดการข้อมูลหอพักของ UC-03 เข้ากับ UC-13; UC-13 รับผิดชอบต่อการตรวจสอบและเปลี่ยนสถานะ re-review เท่านั้น
- ต้องรักษาความสัมพันธ์ระหว่างสถานะหอพัก กับ ApprovalHistory และ Notification ให้สอดคล้องกันโดยใช้ transaction
- การบันทึก ApprovalHistory ต้องเป็น append-only ไม่เขียนทับประวัติเดิม
- สำหรับ `Approved` อาจไม่มี reason แต่ `Need Revision` และ `Rejected` ต้องมีเหตุผล 1–500 ตัวอักษร
