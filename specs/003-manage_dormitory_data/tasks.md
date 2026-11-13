# จัดการข้อมูลหอพัก (Dormitory Management)

- Feature: จัดการข้อมูลหอพัก
- Spec ID: SPEC-DOR-003
- อ้างอิง: [spec.md](./spec.md) | [plan.md](./plan.md)
- วันที่: 2569-11-13

สรุป:
- มี 8 เฟส (เฟส 0 ฐานราก, เฟส 1-7 ตาม AC) รวม 16 tasks
- ไม่มี task ที่รอ Open Question; T-16 พร้อมทำหลัง T-15 ตามคำตอบ Q-02
- เฟสแรกที่ลองใช้งานได้จริง: เฟส 1 หลัง dependency การยืนยันตัวตนที่ plan อ้างถึงพร้อมใช้งาน

Dependency ก่อนเริ่มเฟส 1: plan ระบุให้ใช้กลไกยืนยันตัวตนที่มีอยู่ แต่ในโค้ดปัจจุบันยังไม่พบกลไกยืนยันตัวตนเจ้าของหอพัก ให้ถือว่าเป็น dependency จากระบบภายนอกตาม plan; หากไม่มี dependency นี้ ให้หยุด T-02/T-03 เพื่อให้ทีมยืนยันหรือปรับ plan ก่อน ห้ามเพิ่มระบบยืนยันตัวตนเข้า scope เอง

ไม่มี `specs/000-shared/` หรือโฟลเดอร์ mockup ของฟีเจอร์นี้ จึงไม่มี Constraint ใช้ร่วมและไม่มี UI ID/mockup ให้ระบุใน task หน้าจอ

## เฟส 0: ฐานราก

### T-01 เตรียมโมเดลและการจัดเก็บข้อมูลหอพัก/ห้อง/รูป
- รองรับ: CON-DATA-01, CON-AUTH-01, CON-FILE-01, FR-DOR-12
- ตรวจด้วย: ไม่มี AC ตรง ๆ เป็นงานพื้นฐานของ T-02, T-04, T-05 และ T-11
- ไฟล์ที่แตะ: `backend/app/models.py`, `backend/app/database.py`, `backend/tests/test_dormitory_management.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: ไม่มี
- เสร็จเมื่อ: `test_owner_dormitory_schema_supports_owner_rooms_and_images` ผ่าน และโมเดลรองรับเจ้าของหอพัก ความสัมพันธ์ห้องกับหอพัก และรูปของหอพัก/ห้องโดยไม่เพิ่มฟิลด์ห้องที่ spec ไม่ได้กำหนด
- สถานะ: เสร็จ

#### จุดตรวจเฟส 0
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC:
  Given ยังไม่มีหน้าจอจัดการข้อมูลหอพักในเฟสนี้
  When ตรวจโมเดลและการจัดเก็บข้อมูลที่เตรียมไว้
  Then ข้อมูลเจ้าของ หอพัก ห้อง และรูปเชื่อมโยงกันได้ตาม plan โดยไม่มีฟิลด์ที่ spec ไม่ได้กำหนด
- ยังขาด: ฟังก์ชันที่ผู้ใช้ทดลองได้จะเริ่มในเฟส 1

## เฟส 1: ดูรายการหอพักของตนและป้องกันการเข้าถึงข้ามเจ้าของ (AC-DOR-07)

### T-02 ทำ API รายการ/รายละเอียดและตรวจสิทธิ์เจ้าของ
- รองรับ: FR-DOR-09, FR-DOR-11, CON-ACC-01, CON-AUTH-01, NFR-SEC-02
- ตรวจด้วย: AC-DOR-07
- ไฟล์ที่แตะ: `backend/app/owner_dormitories.py`, `backend/app/main.py`, `backend/tests/test_AC_DOR_07.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01 และ dependency การยืนยันตัวตนตาม plan ต้องพร้อม
- เสร็จเมื่อ: `test_AC_DOR_07_lists_only_authenticated_owners_dormitories` และ `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access` ผ่าน โดยรายการและคำขออ่าน/แก้ไขจำกัดตามเจ้าของที่ยืนยันตัวตน
- สถานะ: เสร็จ

### T-03 ทำหน้ารายการและฟอร์มดูข้อมูลเดิม
- รองรับ: FR-DOR-09, FR-DOR-11, AC-DOR-07, CON-ACC-01, CON-AUTH-01
- ตรวจด้วย: AC-DOR-07
- ไฟล์ที่แตะ: `frontend/src/pages/OwnerDormitoriesPage.jsx`, `frontend/src/pages/OwnerDormitoryFormPage.jsx`, `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/__tests__/AC-DOR-07-owner-list.test.jsx`, `frontend/vite.config.js` (ทีมอนุญาตเพิ่ม proxy `/owners`)
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ทดสอบหน้าจอโดยจำลอง client
- ต้องทำหลัง: T-02
- เสร็จเมื่อ: `test_AC_DOR_07_owner_list_renders_only_owner_rows` และ `test_AC_DOR_07_edit_form_shows_existing_data` ผ่าน; หน้าจอแสดงรายการของเจ้าของพร้อมทางเลือกเพิ่ม/แก้ไข และเมื่อเลือกแก้ไขแสดงข้อมูลเดิม โดยเรียก API ผ่าน `frontend/src/api/client.js`
- สถานะ: เสร็จ

#### จุดตรวจเฟส 1
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`, `test_AC_DOR_07_lists_only_authenticated_owners_dormitories`, `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access`, `test_AC_DOR_07_owner_list_renders_only_owner_rows`, `test_AC_DOR_07_edit_form_shows_existing_data`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-07:
  Given เจ้าของหอพักเข้าสู่ระบบ และมีรายการของตนกับข้อมูลเจ้าของอื่นในระบบ
  When เปิดเมนูจัดการข้อมูลหอพัก เลือกแก้ไขรายการของตน และลองเปิดข้อมูลของเจ้าของรายอื่น
  Then เห็นเฉพาะรายการของตนพร้อมปุ่มเพิ่ม/แก้ไข ฟอร์มแก้ไขแสดงข้อมูลเดิม และระบบไม่อนุญาตให้เปิดหรือแก้ไขข้อมูลของเจ้าของรายอื่น
- ยังขาด: dependency การยืนยันตัวตนที่ plan อ้างถึงต้องพร้อม; หากไม่พบ ให้หยุดและขอทีมยืนยัน/ปรับ plan โดยไม่สร้าง auth เพิ่ม

## เฟส 2: เพิ่ม/แก้ไขหอพักและจัดการห้องพัก (AC-DOR-08)

### T-04 ทำ API บันทึกข้อมูลหอพัก
- รองรับ: FR-DOR-10, FR-DOR-12, FR-DOR-15, CON-DATA-01, CON-BUS-01, DOM-RULE-01
- ตรวจด้วย: AC-DOR-08
- ไฟล์ที่แตะ: `backend/app/owner_dormitories.py`, `backend/app/database.py`, `backend/tests/test_AC_DOR_08.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-02
- เสร็จเมื่อ: `test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only` ผ่านสำหรับข้อมูลที่ถูกต้อง โดยบันทึกก่อนแสดงข้อมูลล่าสุด ใช้ข้อมูลที่เจ้าของบันทึกและอ่านสถานะจากกระบวนการเดิม; ไม่เพิ่มการตรวจสอบความจริงอัตโนมัติหรือ workflow อนุมัติ
- สถานะ: เสร็จ 

### T-05 ทำ API จัดการห้องพักและราคาต่อห้อง
- รองรับ: FR-DOR-12, CON-AUTH-01, CON-DATA-01, CON-BUS-01, AC-DOR-08
- ตรวจด้วย: AC-DOR-08
- ไฟล์ที่แตะ: `backend/app/owner_dormitories.py`, `backend/app/database.py`, `backend/tests/test_AC_DOR_08.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-02, T-04
- เสร็จเมื่อ: `test_AC_DOR_08_room_management_is_separate_and_linked` ผ่าน โดยอ่าน/เพิ่ม/แก้ไขห้องที่เชื่อมกับหอพักที่เลือก ตรวจสิทธิ์หอพักและห้อง และบันทึกราคาต่อห้องต่อเดือนโดยไม่เพิ่มฟิลด์ห้องที่ไม่มีใน spec
- สถานะ: เสร็จ 

### T-06 ทำฟอร์มเพิ่ม/แก้ไขข้อมูลหอพัก
- รองรับ: FR-DOR-10, FR-DOR-11, FR-DOR-12, FR-DOR-15, AC-DOR-08, CON-DATA-01
- ตรวจด้วย: AC-DOR-08
- ไฟล์ที่แตะ: `frontend/src/pages/OwnerDormitoryFormPage.jsx`, `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/__tests__/AC-DOR-08-dormitory-form.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ทดสอบหน้าจอโดยจำลอง client
- ต้องทำหลัง: T-03, T-04
- เสร็จเมื่อ: `test_AC_DOR_08_dormitory_form_saves_valid_data` ผ่าน; ฟอร์มเพิ่ม/แก้ไขส่งข้อมูลผ่าน `frontend/src/api/client.js` โดยไม่มีราคาห้องในฟอร์มหอพักและแก้รหัสระบบไม่ได้
- สถานะ: เสร็จ 

### T-07 ทำหน้าจัดการข้อมูลห้องพักแยก
- รองรับ: FR-DOR-12, AC-DOR-08, CON-AUTH-01, CON-DATA-01
- ตรวจด้วย: AC-DOR-08
- ไฟล์ที่แตะ: `frontend/src/pages/OwnerRoomsPage.jsx`, `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/src/__tests__/AC-DOR-08-rooms-page.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ทดสอบหน้าจอโดยจำลอง client
- ต้องทำหลัง: T-05
- เสร็จเมื่อ: `test_AC_DOR_08_room_management_page_is_separate_and_linked` ผ่าน; หน้าแสดงห้องที่เชื่อมกับหอพักที่เลือกและให้กำหนดราคาต่อห้องต่อเดือนผ่าน client
- สถานะ: เสร็จ

### T-08 ทดสอบ usability ของฟอร์มหอพัก
- รองรับ: NFR-USE-02, AC-DOR-08
- ตรวจด้วย: AC-DOR-08
- ไฟล์ที่แตะ: ไม่มีไฟล์ซอร์ส; บันทึกผล usability testing ในตำแหน่งที่ทีมกำหนด เพราะ spec ไม่ได้ระบุรูปแบบหรือ path
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-06
- เสร็จเมื่อ: `test_NFR_USE_02_usability_acceptance` ผ่านเกณฑ์ผู้ใช้จริงอย่างน้อย 90% ทำภารกิจสำเร็จโดยไม่ช่วยเหลือและไม่มีข้อผิดพลาดร้ายแรง พร้อมบันทึกเปอร์เซ็นต์ ความช่วยเหลือ และข้อผิดพลาด; จำนวนผู้ทดสอบให้ทีมกำหนดเพราะ spec ไม่ระบุ
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 2
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`, `test_AC_DOR_07_lists_only_authenticated_owners_dormitories`, `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access`, `test_AC_DOR_07_owner_list_renders_only_owner_rows`, `test_AC_DOR_07_edit_form_shows_existing_data`, `test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only`, `test_AC_DOR_08_room_management_is_separate_and_linked`, `test_AC_DOR_08_dormitory_form_saves_valid_data`, `test_AC_DOR_08_room_management_page_is_separate_and_linked`, `test_NFR_USE_02_usability_acceptance`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-08:
  Given เจ้าของหอพักอยู่ในฟอร์มและมีข้อมูลหอพักที่กรอกครบตาม spec
  When บันทึกหอพัก แล้วเปิดหน้าจัดการห้องพักของหอพักนั้น
  Then ข้อมูลล่าสุดที่บันทึกแสดงแก่เจ้าของและ Admin ตามสถานะ; หน้าห้องพักแยกจากหน้าหอพัก เชื่อมข้อมูลถูกหอพัก และกำหนดราคาเป็นบาท/เดือนต่อห้องได้
- ยังขาด: ผล usability ต้องมาจากผู้ใช้จริง; จำนวนผู้ทดสอบไม่ระบุใน spec และให้ทีมกำหนดก่อนทดสอบ

## เฟส 3: แจ้งข้อผิดพลาดข้อมูลรายช่อง (AC-DOR-09)

### T-09 ตรวจข้อมูลบังคับและคืนข้อผิดพลาดจาก API
- รองรับ: FR-DOR-13, FR-DOR-17, CON-DATA-01
- ตรวจด้วย: AC-DOR-09
- ไฟล์ที่แตะ: `backend/app/owner_dormitories.py`, `backend/tests/test_AC_DOR_09.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04
- เสร็จเมื่อ: `test_AC_DOR_09_required_and_invalid_fields_show_per_field_errors_without_saving` ผ่าน; ข้อมูลจำเป็นที่ขาดหรือไม่ผ่านการตรวจที่กำหนดถูกปฏิเสธก่อนบันทึกและมีเหตุผลรายช่อง โดยไม่เพิ่มเงื่อนไขที่ spec ไม่ระบุ
- สถานะ: เสร็จ

### T-10 แสดงข้อผิดพลาดรายช่องในฟอร์ม
- รองรับ: FR-DOR-13, FR-DOR-17, AC-DOR-09
- ตรวจด้วย: AC-DOR-09
- ไฟล์ที่แตะ: `frontend/src/pages/OwnerDormitoryFormPage.jsx`, `frontend/src/api/client.js`, `frontend/src/__tests__/AC-DOR-09-field-errors.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ทดสอบหน้าจอโดยจำลอง client
- ต้องทำหลัง: T-09
- เสร็จเมื่อ: `test_AC_DOR_09_field_errors_display_without_saving` ผ่าน; ข้อความแสดงใต้ช่องที่เกี่ยวข้องพร้อมสาเหตุ และข้อมูลไม่ถูกบันทึกเมื่อ validation ล้มเหลว
- สถานะ: เสร็จ

#### จุดตรวจเฟส 3
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`, `test_AC_DOR_07_lists_only_authenticated_owners_dormitories`, `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access`, `test_AC_DOR_07_owner_list_renders_only_owner_rows`, `test_AC_DOR_07_edit_form_shows_existing_data`, `test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only`, `test_AC_DOR_08_room_management_is_separate_and_linked`, `test_AC_DOR_08_dormitory_form_saves_valid_data`, `test_AC_DOR_08_room_management_page_is_separate_and_linked`, `test_NFR_USE_02_usability_acceptance`, `test_AC_DOR_09_required_and_invalid_fields_show_per_field_errors_without_saving`, `test_AC_DOR_09_field_errors_display_without_saving`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-09:
  Given เจ้าของหอพักกรอกข้อมูลจำเป็นไม่ครบหรือข้อมูลที่ไม่ผ่านการตรวจสอบซึ่ง spec ระบุ
  When กดยืนยันการบันทึก
  Then ระบบแจ้งเหตุผลเป็นรายช่องและไม่บันทึกข้อมูล
- ยังขาด: ไม่มี

## เฟส 4: ปฏิเสธเฉพาะรูปที่ไม่ผ่านเงื่อนไข (AC-DOR-10)

### T-11 ทำ API ตรวจและจัดเก็บรูปเป็นรายไฟล์
- รองรับ: FR-DOR-14, FR-DOR-18, CON-FILE-01, CON-AUTH-01
- ตรวจด้วย: AC-DOR-10
- ไฟล์ที่แตะ: `backend/app/owner_dormitories.py`, `backend/app/database.py`, `backend/app/config.py`, `backend/tests/test_AC_DOR_10.py`, `backend/requirements.txt`; เทคโนโลยีจัดเก็บรูปภาพทีมเลือกเป็น local filesystem ไม่ได้มาจาก spec
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-01, T-02
- เสร็จเมื่อ: `test_AC_DOR_10_rejects_only_invalid_or_over_limit_images` ผ่านทั้งชนิดไฟล์ ขนาด 5 MB และจำนวน 10 รูปแยกต่อหอพัก/ห้อง โดยปฏิเสธเฉพาะไฟล์ที่ไม่ผ่านและรับไฟล์ถูกต้องต่อ
- สถานะ: เสร็จ 

### T-12 แสดงผลอัปโหลดและให้เลือกไฟล์แทน
- รองรับ: FR-DOR-14, FR-DOR-18, AC-DOR-10, CON-FILE-01
- ตรวจด้วย: AC-DOR-10
- ไฟล์ที่แตะ: `frontend/src/pages/OwnerDormitoryFormPage.jsx`, `frontend/src/pages/OwnerRoomsPage.jsx`, `frontend/src/api/client.js`, `frontend/src/__tests__/AC-DOR-10-image-upload.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ทดสอบหน้าจอโดยจำลอง client
- ต้องทำหลัง: T-11
- เสร็จเมื่อ: `test_AC_DOR_10_rejected_files_keep_valid_files` ผ่าน; แจ้งสาเหตุของไฟล์ที่ถูกปฏิเสธ แสดงไฟล์ถูกต้องที่รับไว้ และให้เลือกไฟล์ใหม่แทนไฟล์ที่ถูกปฏิเสธได้
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 4
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`, `test_AC_DOR_07_lists_only_authenticated_owners_dormitories`, `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access`, `test_AC_DOR_07_owner_list_renders_only_owner_rows`, `test_AC_DOR_07_edit_form_shows_existing_data`, `test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only`, `test_AC_DOR_08_room_management_is_separate_and_linked`, `test_AC_DOR_08_dormitory_form_saves_valid_data`, `test_AC_DOR_08_room_management_page_is_separate_and_linked`, `test_NFR_USE_02_usability_acceptance`, `test_AC_DOR_09_required_and_invalid_fields_show_per_field_errors_without_saving`, `test_AC_DOR_09_field_errors_display_without_saving`, `test_AC_DOR_10_rejects_only_invalid_or_over_limit_images`, `test_AC_DOR_10_rejected_files_keep_valid_files`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-10:
  Given เลือกไฟล์รูปที่ถูกต้องปนไฟล์ผิดชนิด/เกิน 5 MB หรือเลือกเกิน 10 รูปในขอบเขตเดียวกัน
  When อัปโหลดรูปหอพักหรือห้องพัก
  Then ระบบปฏิเสธเฉพาะไฟล์ที่ไม่ผ่านพร้อมสาเหตุ และยังรับไฟล์ถูกต้องได้
- ยังขาด: เทคโนโลยีจัดเก็บรูปภาพยังไม่ได้ระบุใน spec/plan ให้ทีมเลือกก่อน implementation โดยไม่เปลี่ยนเงื่อนไขไฟล์

## เฟส 5: ยกเลิกการแก้ไขโดยไม่บันทึก (AC-DOR-11)

### T-13 ทิ้งค่าฟอร์มและกลับไปหน้ารายการเมื่อยกเลิก
- รองรับ: FR-DOR-16, CON-BUS-01, AC-DOR-11
- ตรวจด้วย: AC-DOR-11
- ไฟล์ที่แตะ: `frontend/src/pages/OwnerDormitoryFormPage.jsx`, `frontend/src/App.jsx`, `frontend/src/__tests__/AC-DOR-11-cancel.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ทดสอบหน้าจอโดยจำลอง client
- ต้องทำหลัง: T-03, T-06
- เสร็จเมื่อ: `test_AC_DOR_11_cancel_discards_unsaved_changes` ผ่าน; กดยกเลิกแล้วไม่เรียก API บันทึก กลับหน้ารายการ และเมื่อโหลดใหม่ได้ข้อมูลเดิม
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 5
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`, `test_AC_DOR_07_lists_only_authenticated_owners_dormitories`, `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access`, `test_AC_DOR_07_owner_list_renders_only_owner_rows`, `test_AC_DOR_07_edit_form_shows_existing_data`, `test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only`, `test_AC_DOR_08_room_management_is_separate_and_linked`, `test_AC_DOR_08_dormitory_form_saves_valid_data`, `test_AC_DOR_08_room_management_page_is_separate_and_linked`, `test_NFR_USE_02_usability_acceptance`, `test_AC_DOR_09_required_and_invalid_fields_show_per_field_errors_without_saving`, `test_AC_DOR_09_field_errors_display_without_saving`, `test_AC_DOR_10_rejects_only_invalid_or_over_limit_images`, `test_AC_DOR_10_rejected_files_keep_valid_files`, `test_AC_DOR_11_cancel_discards_unsaved_changes`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-11:
  Given เจ้าของหอพักกำลังแก้ไขข้อมูลที่โหลดจากฐานข้อมูล
  When เปลี่ยนค่าแล้วกด “ยกเลิก”
  Then ไม่มีการบันทึกการเปลี่ยนแปลง กลับหน้ารายการ และข้อมูลเดิมยังแสดง
- ยังขาด: ไม่มี

## เฟส 6: แสดงข้อมูลที่อนุมัติแก่ผู้ใช้ทั่วไป (AC-DOR-12)

### T-14 กรองข้อมูลและรูปที่รออนุมัติออกจากมุมมองสาธารณะ
- รองรับ: NFR-DATA-02, DOM-RULE-01, AC-DOR-12
- ตรวจด้วย: AC-DOR-12
- ไฟล์ที่แตะ: `backend/app/details.py`, `backend/tests/test_AC_DOR_12.py`
- แบบหน้าจอ: ไม่มี
- ต้องทำหลัง: T-04, T-11
- เสร็จเมื่อ: `test_AC_DOR_12_public_view_shows_approved_data_only`, `test_AC_DOR_12_public_view_hides_pending_data`, `test_owner_managed_dormitory_is_public_only_after_approval` และ `test_TC_DOR_12_2_public_view_hides_pending_image` ผ่านด้วยข้อมูล/รูปสถานะอนุมัติและรออนุมัติ โดยใช้สถานะจากกระบวนการที่มีอยู่และไม่สร้าง workflow อนุมัติใหม่
- สถานะ: เสร็จ

### T-15 เชื่อมหน้ารายละเอียดสาธารณะกับข้อมูลที่กรองสถานะแล้ว
- รองรับ: NFR-DATA-02, AC-DOR-12
- ตรวจด้วย: AC-DOR-12
- ไฟล์ที่แตะ: `frontend/src/api/client.js`, `frontend/src/api/dormApi.js`, `frontend/src/pages/DormDetailPage.jsx`, `frontend/src/__tests__/AC-DOR-12-public-detail.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec; ใช้หน้ารายละเอียดเดิมและจำลอง client ใน test
- ต้องทำหลัง: T-14
- เสร็จเมื่อ: `test_AC_DOR_12_public_detail_renders_only_api_approved_data` ผ่าน; หน้ารายละเอียดใช้ข้อมูลที่ API กรองแล้วและไม่เพิ่มการค้นหาสาธารณะ
- สถานะ: เสร็จ 

#### จุดตรวจเฟส 6
- test ที่ต้องผ่านทั้งหมด: `test_owner_dormitory_schema_supports_owner_rooms_and_images`, `test_owner_image_approval_migration_inherits_dormitory_status`, `test_AC_DOR_07_lists_only_authenticated_owners_dormitories`, `test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access`, `test_AC_DOR_07_owner_list_renders_only_owner_rows`, `test_AC_DOR_07_edit_form_shows_existing_data`, `test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only`, `test_AC_DOR_08_room_management_is_separate_and_linked`, `test_AC_DOR_08_dormitory_form_saves_valid_data`, `test_AC_DOR_08_room_management_page_is_separate_and_linked`, `test_NFR_USE_02_usability_acceptance`, `test_AC_DOR_09_required_and_invalid_fields_show_per_field_errors_without_saving`, `test_AC_DOR_09_field_errors_display_without_saving`, `test_AC_DOR_10_rejects_only_invalid_or_over_limit_images`, `test_AC_DOR_10_rejected_files_keep_valid_files`, `test_AC_DOR_11_cancel_discards_unsaved_changes`, `test_AC_DOR_12_public_view_shows_approved_data_only`, `test_AC_DOR_12_public_view_hides_pending_data`, `test_owner_managed_dormitory_is_public_only_after_approval`, `test_TC_DOR_12_2_public_view_hides_pending_image`, `test_AC_DOR_12_public_detail_renders_only_api_approved_data`
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-12:
  Given มีหอพัก/รูปที่อนุมัติแล้วและข้อมูล/รูปที่รออนุมัติในระบบ
  When ผู้ใช้ทั่วไปเปิดหน้ารายละเอียดหอพัก
  Then เห็นข้อมูลและรูปที่อนุมัติแล้ว และไม่เห็นข้อมูล/รูปที่รออนุมัติ
- ยังขาด: การยืนยันว่าข้อมูลเดิมที่เคยอนุมัติแล้วจะไม่แสดงต่อผู้ใช้ทั่วไประหว่างรออนุมัติข้อมูลที่แก้ไข; ตรวจใน T-16

## เฟส 7: ซ่อนข้อมูลเดิมระหว่างรออนุมัติ (AC-DOR-08, AC-DOR-12)

### T-16 ทำและทดสอบการซ่อนข้อมูลเดิมระหว่างรออนุมัติ
- รองรับ: FR-DOR-12, FR-DOR-15, AC-DOR-08, AC-DOR-12, ASM-20, DOM-RULE-01, NFR-DATA-02
- ตรวจด้วย: AC-DOR-08, AC-DOR-12
- ไฟล์ที่แตะ: `backend/app/owner_dormitories.py`, `backend/app/details.py`, `backend/tests/test_AC_DOR_08.py`, `backend/tests/test_AC_DOR_12.py`, `frontend/src/api/dormApi.js`, `frontend/src/pages/OwnerDormitoryFormPage.jsx`, `frontend/src/pages/DormDetailPage.jsx`, `frontend/src/__tests__/TC-DOR-08-2.test.jsx`
- แบบหน้าจอ: ไม่มี UI ID/mockup ใน spec
- ต้องทำหลัง: T-15
- เสร็จเมื่อ: `test_TC_DOR_08_2_edit_approved_dormitory_pending_q02` และ `test_TC_DOR_12_4_previous_approved_data_visibility_q02` ผ่าน; หลังเจ้าของแก้ไขหอพักที่อนุมัติแล้วและข้อมูลใหม่อยู่ระหว่างรออนุมัติ ผู้ใช้งานทั่วไปต้องไม่เห็นทั้งข้อมูลที่รออนุมัติและข้อมูลเดิมที่เคยอนุมัติ
- สถานะ: พร้อมทำ

#### จุดตรวจเฟส 7
- test ที่ต้องผ่านทั้งหมด: `test_TC_DOR_08_2_edit_approved_dormitory_pending_q02`, `test_TC_DOR_12_4_previous_approved_data_visibility_q02` และ test ของเฟสก่อนหน้าต้องยังผ่าน
- เปิดระบบ: หลังบ้าน `cd backend && PYTHONPATH=.. uvicorn app.main:app --reload`; หน้าจอ `cd frontend && npm run dev -- --host 0.0.0.0`
- คนลองเองตาม AC-DOR-08 และ AC-DOR-12:
  Given มีหอพักที่อนุมัติแล้วซึ่งผู้ใช้งานทั่วไปดูได้
  When เจ้าของแก้ไขและบันทึกข้อมูลจนสถานะเป็น “รออนุมัติ” แล้วผู้ใช้งานทั่วไปเปิดดูหอพัก
  Then เจ้าของเห็นข้อมูลล่าสุดและสถานะ “รออนุมัติ”; ผู้ใช้งานทั่วไปไม่เห็นข้อมูลที่แก้ไขหรือข้อมูลเดิมที่เคยอนุมัติ
- ยังขาด: ไม่มี

## ตารางตรวจความครบ

### Acceptance Criteria

| AC ID | task ที่ตรวจ AC นี้ |
|---|---|
| AC-DOR-07 | T-02, T-03 |
| AC-DOR-08 | T-04, T-05, T-06, T-07, T-08, T-16 |
| AC-DOR-09 | T-09, T-10 |
| AC-DOR-10 | T-11, T-12 |
| AC-DOR-11 | T-13 |
| AC-DOR-12 | T-14, T-15, T-16 |

### Constraints

| Constraint ID | task ที่ทำให้เป็นจริง |
|---|---|
| CON-ACC-01 | T-02, T-03 |
| CON-AUTH-01 | T-01, T-02, T-05, T-11 |
| CON-DATA-01 | T-01, T-04, T-05, T-09 |
| CON-FILE-01 | T-01, T-11, T-12 |
| CON-BUS-01 | T-04, T-05, T-13 |
| DOM-RULE-01 | T-04, T-14, T-16 |

### Functional Requirements

| FR ID | AC ที่ตรวจ FR นี้ | เฟส |
|---|---|---|
| FR-DOR-09 | AC-DOR-07 | เฟส 1 |
| FR-DOR-10 | AC-DOR-08 | เฟส 2 |
| FR-DOR-11 | AC-DOR-07 | เฟส 1 |
| FR-DOR-12 | AC-DOR-08 | เฟส 2, เฟส 7 |
| FR-DOR-13 | AC-DOR-09 | เฟส 3 |
| FR-DOR-14 | AC-DOR-10 | เฟส 4 |
| FR-DOR-15 | AC-DOR-08, AC-DOR-12 | เฟส 2, เฟส 6, เฟส 7 |
| FR-DOR-16 | AC-DOR-11 | เฟส 5 |
| FR-DOR-17 | AC-DOR-09 | เฟส 3 |
| FR-DOR-18 | AC-DOR-10 | เฟส 4 |

## สิ่งที่ยังไม่ทำ

- T-16 พร้อมทำ: ตรวจการซ่อนข้อมูลเดิมที่เคยอนุมัติระหว่างรออนุมัติข้อมูลที่แก้ไขตาม ASM-20 และคำตอบ Q-02
- Open Questions ที่ยังรอคำตอบ: ไม่มี

ข้อจำกัดจากแผน: ถ้า dependency การยืนยันตัวตนที่ plan อ้างถึงไม่มีอยู่จริง ต้องหยุดงานที่ต้องระบุเจ้าของและให้ทีมยืนยัน/ปรับ plan ก่อน; ห้ามเพิ่มกลไก auth ใหม่ใน tasks นี้
