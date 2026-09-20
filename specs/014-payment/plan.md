# Implementation Plan: ชำระเงิน

Feature: UC-14 | ชำระเงิน
Spec: SPEC-PAY-001
Status: Draft v1

---

## 1. สรุปแนวทาง

ระบบจะให้ Resident เลือกรายการค่าใช้จ่ายที่ยังไม่ได้ชำระ จากนั้นเลือกช่องทางการชำระเงิน อัปโหลดหลักฐาน และยืนยันการชำระเงิน

ระบบจะตรวจสอบข้อมูลเบื้องต้นก่อนบันทึก โดยต้องตรวจสอบว่า

1. รายการค่าใช้จ่ายยังสามารถชำระได้
2. ข้อมูลที่จำเป็นครบถ้วน
3. มีหลักฐานการชำระเงิน
4. ยอดเงินถูกต้อง
5. ไม่มีรายการชำระเงินซ้ำ

หลังจากบันทึกสำเร็จ ระบบจะสร้างประวัติการชำระเงินและแสดงสถานะให้ Resident ตรวจสอบได้

สถานะหลัก:

```text
Unpaid
   |
   v
Pending Review
   |
   +----> Paid
   |
   +----> Rejected
```

---

## 2. เทคโนโลยีที่ใช้

* Frontend: ตาม Technology Stack ของทีม
* Backend: ตาม Technology Stack ของทีม
* Database: ตาม Database ที่ทีมกำหนด
* Authentication / Authorization: ตรวจสอบ Resident ที่เข้าสู่ระบบ
* File Storage: ใช้สำหรับจัดเก็บหลักฐานการชำระเงิน
* Notification: ระบบ Notification ภายในระบบ

---

## 3. โมเดลข้อมูล

### 3.1 Expense

| Field       | Description          |
| ----------- | -------------------- |
| expense_id  | รหัสค่าใช้จ่าย       |
| resident_id | รหัสผู้พักอาศัย      |
| description | รายละเอียดค่าใช้จ่าย |
| amount      | จำนวนเงิน            |
| due_date    | วันครบกำหนด          |
| status      | สถานะค่าใช้จ่าย      |

สถานะ:

* `Unpaid`
* `Pending Review`
* `Paid`

### 3.2 Payment

| Field          | Description          |
| -------------- | -------------------- |
| payment_id     | รหัสการชำระเงิน      |
| expense_id     | รหัสค่าใช้จ่าย       |
| resident_id    | รหัสผู้ชำระ          |
| amount         | จำนวนเงินที่ชำระ     |
| payment_method | ช่องทางการชำระเงิน   |
| payment_status | สถานะการชำระเงิน     |
| paid_at        | วันที่และเวลาที่ชำระ |
| created_at     | วันที่สร้างรายการ    |

### 3.3 PaymentProof

| Field       | Description     |
| ----------- | --------------- |
| proof_id    | รหัสหลักฐาน     |
| payment_id  | รหัสการชำระเงิน |
| file_url    | ตำแหน่งไฟล์     |
| file_type   | ประเภทไฟล์      |
| uploaded_at | วันที่อัปโหลด   |

### 3.4 PaymentHistory

| Field      | Description     |
| ---------- | --------------- |
| history_id | รหัสประวัติ     |
| payment_id | รหัสการชำระเงิน |
| status     | สถานะ           |
| remark     | หมายเหตุ        |
| created_at | วันที่และเวลา   |

---

## 4. API / หน้าจอ

### API

| Method | Endpoint                          | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/resident/expenses/unpaid`       | แสดงรายการค่าใช้จ่ายที่ยังไม่ได้ชำระ |
| GET    | `/resident/expenses/{id}`         | ดูรายละเอียดค่าใช้จ่าย               |
| POST   | `/resident/payments`              | สร้างรายการชำระเงิน                  |
| POST   | `/resident/payments/{id}/proof`   | อัปโหลดหลักฐาน                       |
| PUT    | `/resident/payments/{id}/proof`   | เปลี่ยนหลักฐาน                       |
| POST   | `/resident/payments/{id}/confirm` | ยืนยันการชำระเงิน                    |
| GET    | `/resident/payments/{id}`         | ดูรายละเอียดการชำระเงิน              |
| GET    | `/resident/payments/history`      | ดูประวัติการชำระเงิน                 |

### หน้าจอ

#### Resident Expense

* แสดงรายการค่าใช้จ่าย
* แสดงยอดเงิน
* แสดงสถานะ
* ปุ่ม `ชำระเงิน`

#### Resident Payment

* แสดงรายละเอียดค่าใช้จ่าย
* เลือกช่องทางการชำระเงิน
* แสดงรายละเอียดการชำระ
* อัปโหลดหลักฐาน
* ปุ่มยืนยัน
* ปุ่มยกเลิก

#### Resident Payment Status

* แสดงสถานะการชำระเงิน
* แสดงวันที่และเวลา
* แสดงยอดเงิน
* แสดงหลักฐานการชำระเงิน

#### Resident Payment History

* แสดงรายการชำระเงินย้อนหลัง

---

## 5. ตารางตรวจ Constraints

| Constraint                                  | วิธีตรวจสอบ                                   |
| ------------------------------------------- | --------------------------------------------- |
| CON-PAY-01 ต้องเป็น Resident ที่เข้าสู่ระบบ | ตรวจสอบ Authentication และ Role               |
| CON-PAY-02 ต้องมีค่าใช้จ่ายที่ยังไม่ชำระ    | ตรวจสอบ Expense Status                        |
| CON-PAY-03 ต้องเลือกช่องทางการชำระเงิน      | Validate Payment Method                       |
| CON-PAY-04 ต้องมีหลักฐาน                    | Validate PaymentProof                         |
| CON-PAY-05 ยอดเงินต้องตรง                   | เปรียบเทียบ Payment Amount กับ Expense Amount |
| CON-PAY-06 ข้อมูลไม่ครบห้ามบันทึกสำเร็จ     | Validate ทุก Field ก่อน Confirm               |
| CON-PAY-07 ป้องกันการชำระซ้ำ                | ตรวจสอบ Payment ที่มีอยู่ก่อนสร้างรายการใหม่  |
| CON-PAY-08 รักษาความปลอดภัยของข้อมูล        | จำกัดสิทธิ์และควบคุมการเข้าถึงไฟล์            |

---

## 6. แผนทดสอบจาก Acceptance Criteria

### AC-PAY-01

**Test:** Resident เลือกรายการค่าใช้จ่าย

**Expected:**

* แสดงรายการค่าใช้จ่าย
* แสดงรายละเอียด
* แสดงยอดเงินถูกต้อง

### AC-PAY-02

**Test:** Resident เลือกช่องทางการชำระเงิน

**Expected:**

* ระบบแสดงช่องทางที่เลือก
* ระบบแสดงรายละเอียดสำหรับช่องทางนั้น

### AC-PAY-03

**Test:** Resident อัปโหลดหลักฐาน

**Expected:**

* ระบบรับไฟล์ที่รองรับ
* แสดงหลักฐานที่อัปโหลด
* สามารถเปลี่ยนไฟล์ก่อนยืนยันได้

### AC-PAY-04

**Test:** Resident ยืนยันการชำระเงินด้วยข้อมูลถูกต้อง

**Expected:**

* ระบบตรวจสอบข้อมูล
* ระบบตรวจสอบยอดเงิน
* ระบบสามารถบันทึกรายการได้

### AC-PAY-05

**Test:** Resident ไม่แนบหลักฐานหรือกรอกข้อมูลไม่ครบ

**Expected:**

* ระบบแจ้งเตือน
* ไม่สร้างรายการชำระเงินสำเร็จ

### AC-PAY-06

**Test:** ยอดเงินไม่ตรงกับค่าใช้จ่าย

**Expected:**

* ระบบแจ้งเตือน
* ไม่ยืนยันการชำระเงิน

### AC-PAY-07

**Test:** ตรวจสอบหลังบันทึกการชำระเงิน

**Expected:**

* มี Payment
* มี PaymentHistory
* ข้อมูลยอดเงินและผู้ชำระถูกต้อง

### AC-PAY-08

**Test:** Resident พยายามส่งรายการชำระเงินซ้ำ

**Expected:**

* ระบบตรวจพบรายการเดิม
* ไม่สร้าง Payment ซ้ำ

### AC-PAY-09

**Test:** Resident เปิดประวัติการชำระเงิน

**Expected:**

* ระบบแสดงรายการย้อนหลัง
* แสดงสถานะของแต่ละรายการ

### AC-PAY-10

**Test:** จำลองกรณี Database บันทึกข้อมูลไม่สำเร็จ

**Expected:**

* ระบบแสดงข้อความ Error
* ไม่สร้างข้อมูล Payment ที่ไม่สมบูรณ์
* Resident สามารถดำเนินการใหม่ได้

---

## 7. ลำดับงาน

1. ตรวจสอบ/สร้าง Expense Model
2. สร้าง Payment Model
3. สร้าง PaymentProof Model
4. สร้าง PaymentHistory Model
5. กำหนด Payment Status
6. ทำ API แสดงรายการค่าใช้จ่าย
7. ทำ API สร้าง Payment
8. ทำ API Upload PaymentProof
9. ทำ API เปลี่ยน PaymentProof
10. ทำ API Confirm Payment
11. เพิ่มระบบตรวจสอบยอดเงิน
12. เพิ่มระบบป้องกัน Payment ซ้ำ
13. เพิ่มระบบ Payment History
14. ทำหน้า Resident Expense
15. ทำหน้า Resident Payment
16. ทำหน้า Payment Status
17. ทำหน้า Payment History
18. ทดสอบตาม Acceptance Criteria
19. ทดสอบกรณีข้อมูลไม่ครบ ยอดเงินผิด และการส่งซ้ำ
20. ตรวจสอบ Security และสิทธิ์การเข้าถึงหลักฐาน

---

## 8. สิ่งที่ยังไม่ทำ

* การดูข้อมูลค่าใช้จ่ายห้องพัก → UC-11
* การจองหอพัก → UC-12
* การจัดการบัญชีผู้ใช้ → UC-08
* การตรวจสอบและอนุมัติหอพัก → UC-13
* การโอนเงินจริงผ่าน Payment Gateway
* การเชื่อมต่อธนาคารโดยตรง
* ระบบคืนเงิน
* การจัดการบัญชีธนาคารของ Dormitory Owner
