# Implementation Plan: ตรวจสอบและอนุมัติหอพัก

Feature: UC-13 | ตรวจสอบและอนุมัติหอพัก
Spec: SPEC-ADM-001
Status: Draft v2

---

## 1. สรุปแนวทาง

ระบบจะให้ Admin ตรวจสอบหอพักที่เจ้าของหอพักส่งเข้ามา โดย Admin สามารถดูข้อมูลและเอกสาร ตรวจสอบความครบถ้วนตามรายการ Required ในแบบฟอร์มลงทะเบียนหอพัก และเลือกดำเนินการได้ 3 รูปแบบ

1. อนุมัติ → `Approved`
2. ขอให้แก้ไข → `Need Revision`
3. ปฏิเสธ → `Rejected`

ทุกการดำเนินการต้องบันทึกประวัติการตรวจสอบเป็นรายการใหม่ (Append-only) และแจ้งผลให้เจ้าของหอพักทราบผ่าน Notification ภายในระบบหลังจากบันทึกผลสำเร็จ

สถานะหลักของหอพัก:

```text
Pending Review
      |
      +----> Approved
      |
      +----> Need Revision ----> Owner แก้ไข/ส่งตรวจสอบใหม่ ----> Pending Review
      |
      +----> Rejected
```

หมายเหตุ: การส่งตรวจสอบใหม่จาก `Need Revision` เป็นกระบวนการใน UC-13 เท่านั้น โดยไม่ทำซ้ำหน้าที่จัดการข้อมูลหอพักของ UC-03

---

## 2. เทคโนโลยีที่ใช้

* Frontend: ตาม Technology Stack ของทีม
* Backend: ตาม Technology Stack ของทีม
* Database: ตาม Database ที่ทีมกำหนด
* Authentication / Authorization: ตรวจสอบ Role ของผู้ใช้งาน
* Notification: ระบบ Notification ภายในระบบ
* Transaction: ใช้ Database Transaction เพื่อให้การอัปเดตสถานะหอพักและบันทึก ApprovalHistory สำเร็จร่วมกัน หากบันทึกใดส่วนไม่สำเร็จต้อง rollback และไม่เปลี่ยนสถานะเดิม Notification จะถูกสร้างหลังจากบันทึกผลสำเร็จเท่านั้น

---

## 3. โมเดลข้อมูล

### 3.1 Dormitory

| Field        | Description                                  |
| ------------ | -------------------------------------------- |
| dormitory_id | รหัสหอพัก                                    |
| owner_id     | เจ้าของหอพัก                                 |
| status       | สถานะการตรวจสอบ (`Pending Review`, `Approved`, `Need Revision`, `Rejected`) |
| submitted_at | วันที่ส่งตรวจสอบ                             |
| updated_at   | วันที่แก้ไขล่าสุด                             |

หมายเหตุ: การตรวจสอบความครบถ้วนใช้รายการข้อมูลและเอกสารที่กำหนดเป็น Required ในแบบฟอร์มลงทะเบียนหอพักเป็นเกณฑ์ก่อนอนุมัติ

### 3.2 DormitoryDocument

| Field         | Description  |
| ------------- | ------------ |
| document_id   | รหัสเอกสาร   |
| dormitory_id  | รหัสหอพัก    |
| document_type | ประเภทเอกสาร |
| file_url      | ตำแหน่งไฟล์  |
| status        | สถานะเอกสาร  |

### 3.3 ApprovalHistory

| Field        | Description                     |
| ------------ | ------------------------------- |
| history_id   | รหัสประวัติ                     |
| dormitory_id | รหัสหอพัก                       |
| admin_id     | Admin ผู้ตรวจสอบ                |
| action       | การดำเนินการ (`Approved`, `Need Revision`, `Rejected`) |
| reason       | เหตุผลสำหรับผลการตรวจสอบ (Approved: อาจเป็นค่าว่าง, Need Revision/Rejected: ต้องมี 1–500 ตัวอักษร) |
| created_at   | วันที่และเวลา                   |

ข้อกำหนดเพิ่มเติม:

* ApprovalHistory เป็นแบบ Append-only ไม่เขียนทับประวัติเดิม
* ประวัติแต่ละรายการต้องมี Admin ผู้ดำเนินการ วันที่ เวลา ผลการดำเนินการ และเหตุผลสำหรับกรณีที่ต้องมีเหตุผล
* กรณี `Approved` ไม่บังคับให้ระบุเหตุผล แต่เมื่อ `Need Revision` หรือ `Rejected` ต้องระบุเหตุผลที่ไม่ว่างและมีความยาว 1–500 ตัวอักษร

### 3.4 Notification

| Field           | Description                                       |
| --------------- | ------------------------------------------------- |
| notification_id | รหัสแจ้งเตือน                                     |
| owner_id        | เจ้าของหอพัก                                      |
| dormitory_id    | รหัสหอพัก                                         |
| action          | ผลตรวจสอบ (`Approved`, `Need Revision`, `Rejected`) |
| message         | ข้อความแจ้งเตือน                                  |
| is_read         | สถานะการอ่าน                                      |
| created_at      | วันที่สร้าง                                       |

Notification ต้องสร้างหลังจากบันทึกผลการตรวจสอบสำเร็จ และครอบคลุมทุกกรณี Approved, Need Revision, Rejected

---

## 4. API / หน้าจอ

### API

| Method | Endpoint                           | Description                                         |
| ------ | ---------------------------------- | --------------------------------------------------- |
| GET    | `/admin/dormitories/pending`       | แสดงหอพักที่รอตรวจสอบ                              |
| GET    | `/admin/dormitories/{id}`          | ดูรายละเอียดหอพักและเอกสาร                           |
| POST   | `/admin/dormitories/{id}/approve`  | อนุมัติหอพัก (ตรวจ Required fields/documents ก่อน) |
| POST   | `/admin/dormitories/{id}/revision` | ขอให้แก้ไขพร้อม reason (1–500 ตัวอักษร)            |
| POST   | `/admin/dormitories/{id}/reject`   | ปฏิเสธหอพักพร้อม reason (1–500 ตัวอักษร)          |
| GET    | `/admin/dormitories/{id}/history`  | ดูประวัติการตรวจสอบ (Append-only)                 |
| GET    | `/owner/notifications`             | ดู Notification ของเจ้าของหอพัก                     |
| POST   | `/owner/dormitories/{id}/resubmit-review` | รับการส่งตรวจสอบใหม่หลัง `Need Revision` และเปลี่ยนสถานะกลับเป็น `Pending Review` โดย UC-13 รับผิดชอบเฉพาะกระบวนการ re-review นี้ |

### หน้าจอ

#### Admin

* `Admin Dormitory Pending`

  * แสดงรายการหอพักที่รอตรวจสอบ
* `Admin Dormitory Review`

  * แสดงข้อมูลหอพัก
  * แสดงเอกสาร
  * ปุ่ม Approve
  * ปุ่ม Request Revision
  * ปุ่ม Reject
  * ช่องกรอกเหตุผลพร้อม validation 1–500 ตัวอักษร
* `Admin Approval History`

  * แสดงประวัติการตรวจสอบแบบ append-only

#### Dormitory Owner

* `Owner Notification`

  * แสดงผลการตรวจสอบ (`Approved`, `Need Revision`, `Rejected`)
  * แสดงเหตุผลกรณีขอแก้ไขหรือปฏิเสธ
  * เปิดดูรายละเอียดและเหตุผลย้อนหลังได้
* `Owner Dormitory Resubmit Review`

  * เมื่อสถานะเป็น `Need Revision` เจ้าของหอพักสามารถส่งตรวจสอบใหม่ผ่าน flow ที่มีอยู่ใน UC-03 สำหรับการแก้ไขข้อมูล/เอกสาร และ UC-13 รับผิดชอบต่อการรับส่งตรวจสอบใหม่และเปลี่ยนสถานะกลับเป็น `Pending Review`

---

## 5. ตารางตรวจ Constraints

| Constraint                                                    | วิธีตรวจสอบ                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| CON-ADM-01 Admin เท่านั้น                                      | ตรวจสอบ Role ก่อนเข้า API/หน้าจอ                              |
| CON-ADM-02 ข้อมูลหรือเอกสารที่กำหนดเป็น Required ไม่ครบห้ามอนุมัติ | ตรวจสอบรายการ Required fields และ Required documents ก่อน Approve |
| CON-ADM-03 ขอแก้ไข/ปฏิเสธต้องมีเหตุผลที่ไม่ว่างและชัดเจน     | Validate `reason` เป็นข้อความ 1–500 ตัวอักษร                  |
| CON-ADM-04 ต้องมี Audit History                                | บันทึก ApprovalHistory ทุกครั้งโดยมี Admin, วันที่เวลา, action, reason |
| CON-ADM-05 Approved เท่านั้นที่เผยแพร่                            | ตรวจสอบ status ก่อนแสดงผลสาธารณะ                            |
| CON-ADM-06 Need Revision ส่งตรวจใหม่ได้                        | UC-03 รับผิดชอบการแก้ไขข้อมูล/เอกสารตามเหตุผล และ UC-13 รับผิดชอบการรับการส่งตรวจสอบใหม่และเปลี่ยนสถานะกลับเป็น `Pending Review` |
| CON-ADM-07 บันทึกไม่สำเร็จต้องไม่เปลี่ยนสถานะ                    | ใช้ Database Transaction ครอบคลุม status update + ApprovalHistory; หากไม่สำเร็จ rollback และไม่เปลี่ยนสถานะเดิม Notification ถูกสร้างหลังจากบันทึกผลสำเร็จเท่านั้น |

---

## 6. แผนทดสอบจาก Acceptance Criteria

### AC-ADM-01

**Test:** Admin เปิดรายการ Pending Review และเลือกหอพัก

**Expected:**

* ระบบแสดงรายละเอียดหอพัก
* ระบบแสดงเอกสารประกอบ

### AC-ADM-02

**Test:** Admin อนุมัติหอพักที่ข้อมูลและเอกสารครบตาม Required list

**Expected:**

* Status เปลี่ยนเป็น `Approved`
* มี ApprovalHistory รายการใหม่
* เจ้าของหอพักได้รับ Notification `Approved`

### AC-ADM-03

**Test:** Admin ขอให้แก้ไขพร้อมระบุเหตุผลที่ชัดเจนและยาว 1–500 ตัวอักษร

**Expected:**

* Status เปลี่ยนเป็น `Need Revision`
* เหตุผลถูกบันทึกใน ApprovalHistory
* เจ้าของหอพักได้รับ Notification `Need Revision`

### AC-ADM-04

**Test:** Admin ปฏิเสธพร้อมระบุเหตุผลที่ชัดเจนและยาว 1–500 ตัวอักษร

**Expected:**

* Status เปลี่ยนเป็น `Rejected`
* เหตุผลถูกบันทึกใน ApprovalHistory
* เจ้าของหอพักได้รับ Notification `Rejected`

### AC-ADM-05

**Test:** ตรวจสอบประวัติหลัง Admin ดำเนินการ

**Expected:**

* มี Admin ผู้ดำเนินการ
* มีวันที่และเวลา
* มี Action
* สำหรับ `Approved`: Reason อาจเป็นค่าว่างหรือไม่ต้องมี
* สำหรับ `Need Revision` หรือ `Rejected`: ต้องมี Reason ที่ไม่ว่างและมีความยาว 1–500 ตัวอักษร
* เพิ่มประวัติเป็นรายการใหม่ โดยไม่เขียนทับประวัติเดิม

### AC-ADM-06

**Test:** Admin พยายามอนุมัติหอพักที่ข้อมูลหรือเอกสารที่กำหนดเป็น Required ไม่ครบ

**Expected:**

* ระบบไม่อนุมัติ
* ระบบแจ้งว่าข้อมูลหรือเอกสารไม่ครบ
* ไม่บันทึก ApprovalHistory ที่เป็นผลสำเร็จ

### AC-ADM-07

**Test:** User ที่ไม่มี Role Admin พยายามเข้าหน้าตรวจสอบ

**Expected:**

* ระบบปฏิเสธการเข้าถึง

### AC-ADM-08

**Test:** จำลองกรณีบันทึกผลการตรวจสอบไม่สำเร็จ

**Expected:**

* ระบบแจ้งข้อผิดพลาด
* Status เดิมยังคงอยู่
* ไม่มีประวัติหรือ Notification ที่บันทึกไม่สมบูรณ์
* การอัปเดตจะถูก rollback ภายใน Transaction

## 7. ลำดับงาน

1. ตรวจสอบรายการ Required fields และ Required documents จากแบบฟอร์มลงทะเบียนหอพัก
2. ตรวจสอบ/สร้าง Database Model สำหรับ Dormitory, Document, ApprovalHistory และ Notification
3. เพิ่มสถานะของ Dormitory และโซนการเปลี่ยนแปลงสถานะ
4. สร้าง ApprovalHistory แบบ Append-only
5. สร้าง Notification สำหรับ Approved / Need Revision / Rejected
6. ทำ API แสดงรายการ Pending Review
7. ทำ API แสดงรายละเอียดหอพักและเอกสาร
8. ทำ API Approve พร้อมตรวจ Required list และ transaction
9. ทำ API Request Revision พร้อม validation reason 1–500 ตัวอักษร
10. ทำ API Reject พร้อม validation reason 1–500 ตัวอักษร
11. ทำ API ส่งตรวจสอบใหม่จาก Need Revision กลับเป็น Pending Review
12. ทำระบบบันทึก ApprovalHistory และ Notification ภายใต้ Database Transaction
13. ทำหน้า Admin Dormitory Pending
14. ทำหน้า Admin Dormitory Review
15. ทำหน้า Approval History และ Owner Notification
16. ทดสอบตาม Acceptance Criteria และตรวจสอบสิทธิ์/กรณี Error

---

## 8. สิ่งที่ยังไม่ทำ

* การจัดการข้อมูลหอพัก → UC-03
* การอัปเดตสถานะห้องว่าง → UC-04
* การดูสถิติหอพัก → UC-05
* การค้นหาและดูข้อมูลหอพัก → UC-01
* การจัดการบัญชีผู้ใช้ → UC-08
* ฟังก์ชันอื่นนอกเหนือจากการตรวจสอบและอนุมัติหอพักของ UC-13

---

## 9. จุดที่ยังต้องตัดสินใจ

* รายการข้อมูลและเอกสารที่กำหนดเป็น Required ในแบบฟอร์มลงทะเบียนหอพักมีอะไรบ้าง และต้องแสดงต่อ Admin อย่างไร
* การแจ้ง Notification ภายในระบบจะใช้ UI แบบใดเมื่อเจ้าของหอพักมีหลายรายการแจ้งเตือน (แสดง badge / กล่องแจ้ง / หน้า Notification)
* หากเกิดหลายรอบ `Need Revision` จะต้องกำหนดลำดับการแสดงประวัติและเหตุผลของรอบล่าสุดต่อไปหรือไม่

