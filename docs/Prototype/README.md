# Prototype ระบบหาหอพัก

## 1. ภาพรวม
- Repo: https://github.com/tw660710709/Home-swreqspec
- Tech: React (frontend), Python (backend), MySQL

## 2. ขอบเขตของ Prototype
<!-- TODO: ใส่ข้อมูลลิงค์ -->
| UC | ชื่อ | สถานะ | spec |
|---|---|---|---|
| UC-01 | ค้นหาและดูข้อมูลหอพัก | พัฒนาจริง | [001-search](../../specs/001-search/spec.md) |
| UC-03 | จัดการข้อมูลหอพัก | พัฒนาจริง | ... |
| UC-05 | ดูสถิติหอพัก | พัฒนาจริง |[005-view_dormitory_statistics](../../specs/005-view_dormitory_statistics/spec.md)  |
| UC-08 | จัดการบัญชีผู้ใช้ | พัฒนาจริง | ... |
| UC-10 | แจ้งซ่อม / รายงานปัญหา | พัฒนาจริง | ... |
| UC-13 | ตรวจสอบและอนุมัติหอพัก | พัฒนาจริง | ... |


## 3. วิธีรัน
1. frontend: `cd frontend && npm install && npm run dev`
2. backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`

## 4. ผลลัพธ์ตามแต่ละ UC

### 4.1 UC-01 ค้นหาและดูข้อมูลหอพัก
<!-- TODO: ใส่ข้อมูล Usecase ที่ตัวเองทำเป็น prototype และเพิ่มรูปใน screenshots -->
| หน้าจอ | ภาพ | FR | AC | ผลทดสอบ |
|---|---|---|---|---|
| หน้าแรก / ค้นหา | [search](./screenshots/UC-01/UC01-search.png) | FR-015 | AC-01.1 | ผ่าน |
| รายละเอียดหอพัก | [detail-1](./screenshots/UC-01/UC01-detail-1.png), [detail-2](./screenshots/UC-01/UC01-detail-2.png) | FR-001..016 | AC-01.3 | ผ่าน |
| กรณีค้นหาไม่พบ | [notfound](./screenshots/UC-01/UC01-notfound.png) | - | AC-01.5 | ผ่าน |
| กรณีหน้า error | [error](./screenshots/UC-01/UC01-error.png) | - | AC-01.5 | ผ่าน |

### 4.2 UC-05 ดูสถิติหอพัก
| หน้าจอ | ภาพ | FR | AC | ผลทดสอบ |
|---|---|---|---|---|
| หน้าแสดงสถิติหอพัก | [statistics](./screenshots/UC-05/UC05-statistics.png) | FR-STAT-01, FR-STAT-02, FR-STAT-03 | AC-STAT-01, AC-STAT-02 | ผ่าน |
| เลือกช่วงวันที่และแสดงสถิติ | [date-filter](./screenshots/UC-05/UC05-date-filter.png) | FR-STAT-04, FR-STAT-05 | AC-STAT-03 | ผ่าน |
| กรณีไม่มีข้อมูลสถิติ | [empty-state](./screenshots/UC-05/UC05-empty-state.png) | FR-STAT-06 | AC-STAT-04 | ผ่าน |
| ดาวน์โหลดรายงานสถิติ CSV | [export-csv](./screenshots/UC-05/UC05-export-csv.png) | FR-STAT-07 | AC-STAT-05 | ผ่าน |

หมายเหตุ: ข้อมูลสถิติที่ใช้ทดสอบเป็นข้อมูลจำลอง (synthetic_mock) โดยทดสอบแยกตาม dormitory_id และช่วงวันที่ รวมถึงกรณีมีข้อมูลแต่ค่าตัวเลขเป็น 0 ซึ่งระบบต้องแสดงค่า 0 ไม่ใช่ข้อความว่าไม่มีข้อมูล


## 5. สรุปผลทดสอบ
<!-- TODO: ใส่ข้อมูลสรุปผลทดสอบ -->
| UC | AC ทั้งหมด | ผ่าน | ไม่ผ่าน |
|---|---|---|---|
| UC-01 | 6 | 6 | 0 |

ผลรันเทสต์ frontend: [ภาพ/log](./screenshots/frontend-test-results.png)
ผลรันเทสต์ backend: [ภาพ/log](./screenshots/backend-test-results.png)
