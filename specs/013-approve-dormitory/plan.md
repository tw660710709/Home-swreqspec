# Implementation Plan: ตรวจสอบและอนุมัติหอพัก

Feature: UC-13 | ตรวจสอบและอนุมัติหอพัก
Spec: SPEC-ADM-001
Status: Draft v1

---

## 1. สรุปแนวทาง

ระบบจะให้ Admin ตรวจสอบหอพักที่เจ้าของหอพักส่งเข้ามา โดย Admin สามารถดูข้อมูลและเอกสาร ตรวจสอบความครบถ้วน และเลือกดำเนินการได้ 3 รูปแบบ

1. อนุมัติ → `Approved`
2. ขอให้แก้ไข → `Need Revision`
3. ปฏิเสธ → `Rejected`

ทุกการดำเนินการต้องบันทึกประวัติการตรวจสอบ และแจ้งผลให้เจ้าของหอพักทราบ

สถานะหลักของหอพัก:

```text
Pending Review
      |
      +----> Approved
      |
      +----> Need Revision ----> Owner แก้ไข ----> Pending Review
      |
      +----> Rejected
```

---

## 2. เทคโนโลยีที่ใช้

* Frontend: ตาม Technology Stack ของทีม
* Backend: ตาม Technology Stack ของทีม
* Database: ตาม Database ที่ทีมกำหนด
* Authentication / Authorization: ตรวจสอบ Role ของผู้ใช้งาน
* Notification: ระบบ Notification ภายในระบบ

---

## 3. โมเดลข้อมูล

### 3.1 Dormitory

| Field        | Description       |
| ------------ | ----------------- |
| dormitory_id | รหัสหอพัก         |
| owner_id     | เจ้าของหอพัก      |
| status       | สถานะการตรวจสอบ   |
| submitted_at | วันที่ส่งตรวจสอบ  |
| updated_at   | วันที่แก้ไขล่าสุด |

สถานะ:

* `Pending Review`
* `Approved`
* `Need Revision`
* `Rejected`

### 3.2 DormitoryDocument

| Field         | Description  |
| ------------- | ------------ |
| document_id   | รหัสเอกสาร   |
| dormitory_id  | รหัสหอพัก    |
| document_type | ประเภทเอกสาร |
| file_url      | ตำแหน่งไฟล์  |
| status        | สถานะเอกสาร  |

### 3.3 ApprovalHistory

| Field        | Description      |
| ------------ | ---------------- |
| history_id   | รหัสประวัติ      |
| dormitory_id | รหัสหอพัก        |
| admin_id     | Admin ผู้ตรวจสอบ |
| action       | การดำเนินการ     |
| reason       | เหตุผล           |
| created_at   | วันที่และเวลา    |

ค่า `action`:

* `Approved`
* `Need Revision`
* `Rejected`

### 3.4 Notification

| Field           | Description      |
| --------------- | ---------------- |
| notification_id | รหัสแจ้งเตือน    |
| owner_id        | เจ้าของหอพัก     |
| dormitory_id    | รหัสหอพัก        |
| message         | ข้อความแจ้งเตือน |
| is_read         | สถานะการอ่าน     |
| created_at      | วันที่สร้าง      |

---

## 4. API / หน้าจอ

### API

| Method | Endpoint                           | Description                     |
| ------ | ---------------------------------- | ------------------------------- |
| GET    | `/admin/dormitories/pending`       | แสดงหอพักที่รอตรวจสอบ           |
| GET    | `/admin/dormitories/{id}`          | ดูรายละเอียดหอพักและเอกสาร      |
| POST   | `/admin/dormitories/{id}/approve`  | อนุมัติหอพัก                    |
| POST   | `/admin/dormitories/{id}/revision` | ขอให้แก้ไข                      |
| POST   | `/admin/dormitories/{id}/reject`   | ปฏิเสธหอพัก                     |
| GET    | `/admin/dormitories/{id}/history`  | ดูประวัติการตรวจสอบ             |
| GET    | `/owner/notifications`             | ดู Notification ของเจ้าของหอพัก |

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
  * ช่องกรอกเหตุผล
* `Admin Approval History`

  * แสดงประวัติการตรวจสอบ

#### Dormitory Owner

* `Owner Notification`

  * แสดงผลการตรวจสอบ
  * แสดงเหตุผลกรณีขอแก้ไขหรือปฏิเสธ

---

## 5. ตารางตรวจ Constraints

| Constraint                                    | วิธีตรวจสอบ                        |
| --------------------------------------------- | ---------------------------------- |
| CON-ADM-01 Admin เท่านั้น                     | ตรวจสอบ Role ก่อนเข้า API/หน้าจอ   |
| CON-ADM-02 ข้อมูลไม่ครบห้ามอนุมัติ            | ตรวจสอบข้อมูลและเอกสารก่อน Approve |
| CON-ADM-03 ขอแก้ไข/ปฏิเสธต้องมีเหตุผล         | Validate ช่อง Reason               |
| CON-ADM-04 ต้องมี Audit History               | บันทึก ApprovalHistory ทุกครั้ง    |
| CON-ADM-05 Approved เท่านั้นที่เผยแพร่        | ตรวจสอบ Status ก่อนแสดงผลสาธารณะ   |
| CON-ADM-06 Need Revision ส่งตรวจใหม่ได้       | Owner แก้ไขและ Submit ใหม่         |
| CON-ADM-07 บันทึกไม่สำเร็จต้องไม่เปลี่ยนสถานะ | ใช้ Transaction ในการบันทึก        |

---

## 6. แผนทดสอบจาก Acceptance Criteria

### AC-ADM-01

**Test:** Admin เปิดรายการ Pending Review และเลือกหอพัก

**Expected:**

* ระบบแสดงรายละเอียดหอพัก
* ระบบแสดงเอกสารประกอบ

### AC-ADM-02

**Test:** Admin อนุมัติหอพักที่ข้อมูลครบ

**Expected:**

* Status เปลี่ยนเป็น `Approved`
* มี ApprovalHistory
* เจ้าของหอพักได้รับ Notification

### AC-ADM-03

**Test:** Admin ขอให้แก้ไขพร้อมระบุเหตุผล

**Expected:**

* Status เปลี่ยนเป็น `Need Revision`
* เหตุผลถูกบันทึก
* เจ้าของหอพักได้รับ Notification

### AC-ADM-04

**Test:** Admin ปฏิเสธพร้อมระบุเหตุผล

**Expected:**

* Status เปลี่ยนเป็น `Rejected`
* เหตุผลถูกบันทึก
* เจ้าของหอพักได้รับ Notification

### AC-ADM-05

**Test:** ตรวจสอบประวัติหลัง Admin ดำเนินการ

**Expected:**

* มี Admin ผู้ดำเนินการ
* มีวันที่และเวลา
* มี Action
* มี Reason

### AC-ADM-06

**Test:** Admin พยายามอนุมัติหอพักที่เอกสารไม่ครบ

**Expected:**

* ระบบไม่อนุมัติ
* ระบบแจ้งข้อมูลหรือเอกสารที่ไม่ครบ

### AC-ADM-07

**Test:** User ที่ไม่มี Role Admin พยายามเข้าหน้าตรวจสอบ

**Expected:**

* ระบบปฏิเสธการเข้าถึง

### AC-ADM-08

**Test:** จำลองกรณีบันทึก Approval ไม่สำเร็จ

**Expected:**

* ระบบแจ้งข้อผิดพลาด
* Status เดิมยังคงอยู่
* ไม่มีประวัติที่บันทึกไม่สมบูรณ์

---

## 7. ลำดับงาน

1. ตรวจสอบ/สร้าง Database Model
2. เพิ่มสถานะของ Dormitory
3. สร้าง ApprovalHistory
4. สร้าง Notification
5. ทำ API แสดงรายการ Pending Review
6. ทำ API แสดงรายละเอียดหอพัก
7. ทำ API Approve
8. ทำ API Request Revision
9. ทำ API Reject
10. ทำระบบบันทึก ApprovalHistory
11. ทำระบบ Notification
12. ทำหน้า Admin Dormitory Pending
13. ทำหน้า Admin Dormitory Review
14. ทำหน้า Approval History
15. ทดสอบตาม Acceptance Criteria
16. ตรวจสอบสิทธิ์และกรณี Error

---

## 8. สิ่งที่ยังไม่ทำ

* การจัดการข้อมูลหอพัก → UC-03
* การอัปเดตสถานะห้องว่าง → UC-04
* การดูสถิติหอพัก → UC-05
* การค้นหาและดูข้อมูลหอพัก → UC-01
* การจัดการบัญชีผู้ใช้ → UC-08
* ฟังก์ชันอื่นนอกเหนือจากการตรวจสอบและอนุมัติหอพักของ UC-13
