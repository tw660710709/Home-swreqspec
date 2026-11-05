# RTM: ค้นหาและดูข้อมูลหอพัก

อ้างอิง: [spec.md](./spec.md) `Draft v2` | [tasks.md](./tasks.md) | [test-cases.md](./test-cases.md)  
ตรวจด้วย `/verify` เมื่อ 2569-11-05 13:06 | test ล่าสุด: backend 34 ผ่าน, frontend 24 ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)

| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| `FR-DOR-01` | `AC-DOR-01` | T-03, T-04, T-05 | `backend/app/search.py`: `search_dormitories`; `backend/app/search_api.py`: `get_dormitories`; `frontend/src/hooks/useDorms.js`; `frontend/src/pages/HomePage.jsx` | `test_AC_DOR_01_search_female_available_dormitories`, `test_TC_DOR_01_1_female_available_search`, `test_TC_DOR_01_2_female_availability_statuses`, `test_TC_DOR_01_3_excludes_other_dormitory_types`, `test_F_07_search_hint_only_mentions_supported_search_fields` — ผ่าน; placeholder สอดคล้องกับการค้นหาชื่อหอพักหรือทำเล | ครบ |
| `FR-DOR-02` | `AC-DOR-01` | T-03, T-04, T-05 | `backend/app/database.py`: `load_dormitory_catalog`; `backend/app/search_api.py`: `get_dormitories`; `frontend/src/pages/HomePage.jsx`: `DormCard` | tests ของ `AC-DOR-01`, `TC-DOR-01-1` ถึง `TC-DOR-01-3` และ `test_AC_DOR_01_search_reads_latest_database_values` — ผ่าน; API อ่านค่าเช่า/สถานะล่าสุดจาก SQLite | ครบ |
| `FR-DOR-03` | `AC-DOR-02` | T-06, T-07, T-08 | `backend/app/details.py`: `build_dormitory_detail`; `frontend/src/pages/DormDetailPage.jsx`: `DormitoryDetail` | `test_TC_DOR_02_1_approved_verified_detail`, `test_TC_DOR_02_2_approved_unverified_detail`, `test_AC_DOR_02_unverified_detail_contains_all_required_fields`, `AC-DOR-02-unverified-detail.test.jsx` — ผ่าน; coverage เสริมตรวจราคาและข้อมูลรายละเอียดครบกรณีไม่ Verified | ครบ |
| `FR-DOR-04` | `AC-DOR-02` | T-06, T-07, T-08 | `backend/app/details.py`: ส่งภาพและสถานที่ใกล้เคียง; `frontend/src/pages/DormDetailPage.jsx`: gallery และรายการสถานที่ | `test_TC_DOR_02_1_approved_verified_detail`, `test_TC_DOR_02_2_approved_unverified_detail`, `test_AC_DOR_02_unverified_detail_contains_all_required_fields`, `AC-DOR-02-unverified-detail.test.jsx` — ผ่าน; coverage เสริมตรวจรูปภาพและชื่อ/ระยะทางสถานที่ใกล้เคียงกรณีไม่ Verified | ครบ |
| `FR-DOR-05` | `AC-DOR-02` | T-06, T-07 | `backend/app/models.py`: `has_verified_badge`; `backend/app/details.py`; `frontend/src/pages/DormDetailPage.jsx` | `test_TC_DOR_02_1_approved_verified_detail`, `test_TC_DOR_02_2_approved_unverified_detail`, `test_TC_DOR_02_3_unapproved_dormitory_detail` — ผ่าน | ครบ |
| `FR-DOR-06` | `AC-DOR-04` | T-10 | `frontend/src/hooks/useDorms.js`: `clearFilters`; `frontend/src/pages/HomePage.jsx` | `test_AC_DOR_04_clear_filter_loads_all_dormitories`, `test_TC_DOR_04_1_clear_filters_loads_all_approved`, `test_TC_DOR_04_2_clears_all_filter_fields`, `test_TC_DOR_04_3_clear_filters_when_none_are_set` — ผ่าน; กรณีที่ spec ไม่กำหนดผลลัพธ์ไม่มี assertion เชิงพฤติกรรม | ครบ |
| `FR-DOR-07` | `AC-DOR-03` | T-11, T-12 | `backend/app/recommendations.py`: `recommend_dormitories`; `backend/app/search_api.py`: recommendations endpoint; `frontend/src/hooks/useDorms.js`; `frontend/src/pages/HomePage.jsx` | `test_AC_DOR_03_empty_search_returns_recommendations`, `test_AC_DOR_03_recommendations_are_relevant_approved_and_limited`, `test_AC_DOR_03_exact_location_precedes_price_distance`, `test_TC_DOR_03_1_empty_search_shows_recommendations`, `test_TC_DOR_03_2_recommendations_are_limited_to_five`, `test_TC_DOR_03_3_matching_results_exist` — ผ่าน; ใช้กติกาตาม `ASM-05` | ครบ |
| `FR-DOR-08` | `AC-DOR-05` | T-13, T-14 | `backend/app/details.py`: `get_dormitory_detail`; `frontend/src/api/client.js`: `getDormitoryDetail`; `frontend/src/pages/DormDetailPage.jsx`: `load` | `test_AC_DOR_05_detail_load_error_has_retry`, `test_TC_DOR_05_1_detail_load_error_shows_retry`, `test_TC_DOR_05_2_retry_after_detail_load_error`, `test_TC_DOR_05_3_detail_load_succeeds` — ผ่าน | ครบ |
| `NFR-USE-01` | ไม่มี AC | T-09 | `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/DormDetailPage.jsx` | กำหนดเกณฑ์ตรวจด้วยผู้ใช้ทั่วไป 5 คน: ทำงานค้นหา/กรอง, ล้างตัวกรอง และเปิดรายละเอียด; แต่ละงานต้องสำเร็จโดยไม่รับความช่วยเหลืออย่างน้อย 4 ใน 5 คน; ยังไม่ได้ดำเนินการทดสอบจริง (`F-04`) | ยังไม่ถึง |
| `NFR-ACC-01` | `AC-DOR-02` | T-08 | `backend/app/database.py`; `backend/app/details.py`; `frontend/src/pages/DormDetailPage.jsx` | `test_AC_DOR_02_detail_reads_latest_database_values` ยืนยันว่า API อ่านค่าปัจจุบันจาก SQLite แต่ฐานข้อมูลใหม่ยัง seed ข้อมูลตัวอย่างจาก fixtures และไม่มีแหล่งข้อมูลจริงที่ระบุใน scope จึงยังยืนยันความถูกต้องกับสภาพจริงไม่ได้ (`F-01`) | ช่องโหว่ |
| `NFR-PERF-01` | `AC-DOR-06` | T-15 | `backend/tests/test_performance.py`: `measure_requests`, `percentile_95` | `test_AC_DOR_06_search_and_detail_p95_under_three_seconds` — ผ่านด้วย HTTP จริงบน localhost/loopback จำนวน 100 requests แบบ sequential ต่อ API ตามที่ทีมเลือก; ผลไม่ยืนยัน deployment; `test_TC_DOR_06_1` ยังคงใช้ ASGITransport (ไม่ได้แก้ตามข้อห้าม) (`F-02`) | ช่องโหว่ |
| `NFR-SEC-01` | ไม่มี AC | T-16 | ยังไม่พบ deployment/TLS configuration ในขอบเขต source ที่ตรวจ | ไม่มี test; T-16 ถูก block เพื่อรอ environment/URL (`tasks.md`) | ยังไม่ถึง |
| `CON-ACC-01` | `AC-DOR-01`, `AC-DOR-02` | T-05, T-07 | `backend/app/main.py`; endpoints ใน `search_api.py` และ `details.py` ไม่มี authentication; `frontend/src/main.jsx` | API และ UI tests ผ่านโดยเรียกใช้งานโดยไม่ส่งข้อมูลเข้าสู่ระบบ | ครบ |
| `CON-BUS-01` | `AC-DOR-01` ถึง `AC-DOR-05` | T-03, T-06, T-10, T-11, T-12 | `backend/app/models.py`: `is_publicly_listable`; `search.py`, `recommendations.py`, `details.py` | tests ค้นหา/แนะนำ/รายละเอียด รวมกรณีไม่ Approved ผ่าน | ครบ |
| `CON-BUS-02` | `AC-DOR-02` | T-06, T-07 | `backend/app/models.py`: `has_verified_badge`; `frontend/src/pages/DormDetailPage.jsx` | tests Verified, Approved แต่ไม่ Verified และไม่ Approved ผ่าน | ครบ |
| `CON-UI-01` | ไม่มี AC | T-09 | responsive classes ใน `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/DormDetailPage.jsx`, `frontend/src/styles/global.css` | `prompt-log.md` บันทึกผลตรวจ browser ที่ 1280×800 และ 375×812 ผ่าน; ไม่พบ overflow | ครบ |
| `DOM-RULE-01` | `AC-DOR-02` | T-06, T-07, T-08 | `backend/app/details.py`: ค่าใช้จ่ายและ `rules`; `frontend/src/pages/DormDetailPage.jsx` | `test_TC_DOR_02_1_approved_verified_detail` และ `test_AC_DOR_02_detail_matches_source_fixtures` ตรวจค่าใช้จ่าย/กฎผ่าน | ครบ |

**สรุปสถานะ:** ครบ 13 แถว, ยังไม่ถึง 2 แถว, รอ Q 0 แถว, ช่องโหว่ 2 แถว (รวม 17 แถว)

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)

| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `backend/app/search.py`: `search_dormitories` | `FR-DOR-01`, `FR-DOR-02`, `CON-BUS-01`, `ASM-02`, `ASM-03` | ตรงกับตัวกรอง ช่วงราคา และสถานะตามข้อมูลที่ส่งให้ฟังก์ชัน | endpoint โหลดข้อมูลปัจจุบันจาก SQLite |
| `backend/app/search_api.py`: `GET /dormitories`, `_serialize_search_results` | `FR-DOR-01`, `FR-DOR-02`, `CON-BUS-01` | endpoint ตรงกับแผน; กรอง Approved ผ่าน service และ serialize สถานะ/ราคา | ใช้ SQLite เป็น runtime source; fixtures ใช้ seed ฐานข้อมูลใหม่เท่านั้น |
| `backend/app/recommendations.py`: `_price_distance`, `recommend_dormitories` | `FR-DOR-07`, `CON-BUS-01`, `ASM-05` | เลือก Approved ที่ตรงทำเลทั้งข้อความหรือมีระยะห่างราคา; เมื่อมีทั้งสองเกณฑ์ให้ทำเลมาก่อนและใช้ระยะราคาเป็นลำดับรอง; จำกัดไม่เกิน 5 ตาม ASM-05 | ทดสอบกรณีทำเลตรงแต่ราคาไกลกว่ารายการที่ราคาใกล้ เพื่อยืนยันลำดับที่ทีมกำหนด |
| `backend/app/search_api.py`: `GET /dormitories/recommendations` | `FR-DOR-07`, `CON-BUS-01`, `ASM-05` | API ตาม plan และส่งผลลัพธ์จาก recommendation service | ใช้ SQLite เป็น runtime source; fixtures ใช้ seed ฐานข้อมูลใหม่เท่านั้น |
| `backend/app/details.py`: `load_dormitory_detail_data` | `FR-DOR-02`, `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `FR-DOR-08` | โหลดรายละเอียดและข้อมูลห้องจาก SQLite; การทดสอบ error ใช้ mock ให้ฟังก์ชัน raise | ฐานข้อมูลใหม่ seed fixtures เฉพาะครั้งแรก; แหล่งข้อมูลจริงยังเป็นประเด็นคงเหลือใน `F-01` |
| `backend/app/details.py`: `build_dormitory_detail`, `get_dormitory_detail`, `GET /dormitories/{dormitory_id}` | `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `CON-BUS-01`, `CON-BUS-02`, `DOM-RULE-01` | รูปแบบข้อมูลและการกรอง Approved/Badge สอดคล้องกับข้อกำหนด | ข้อมูลตอบกลับมาจาก SQLite |
| `backend/app/models.py`: `Dormitory.is_publicly_listable`, `Dormitory.has_verified_badge` | `CON-BUS-01`, `CON-BUS-02`, `FR-DOR-05` | เงื่อนไข Approved และ verified เป็นจริงตาม boolean ที่เก็บ | ไม่มีการคำนวณความครบถ้วนของ “ข้อมูลได้รับการยืนยันครบถ้วน” นอกเหนือจาก `verified_status` |
| `backend/app/fixtures.py` | เป็นข้อมูลตัวอย่างของหลาย FR/CON | ใช้เป็นข้อมูลตั้งต้นเมื่อฐานข้อมูลใหม่ยังไม่มีข้อมูล; ไม่ใช่ runtime source หลังจากนั้น | แหล่งที่มาของข้อมูลจริงสำหรับ `NFR-ACC-01` ยังไม่ระบุ (`F-01`) |
| `frontend/src/api/client.js`: `searchDormitories`, `getRecommendedDormitories`, `getDormitoryDetail` | `FR-DOR-01` ถึง `FR-DOR-08`, `CON-ACC-01` | client เรียก endpoints ที่ plan ระบุและส่ง error เมื่อ HTTP ไม่สำเร็จ | ไม่มี endpoint ที่อยู่นอก API ใน plan |
| `frontend/src/hooks/useDorms.js`: `loadResults`, `submitSearch`, `clearFilters` | `FR-DOR-01`, `FR-DOR-06`, `FR-DOR-07` | รองรับค้นหา, reset filters และโหลด recommendations เมื่อไม่มีผล | พฤติกรรมหลักมี tests ผ่าน |
| `frontend/src/pages/HomePage.jsx`: `SearchFilter`, `DormCard`, `DormList`, `HomePage` | `FR-DOR-01`, `FR-DOR-02`, `FR-DOR-06`, `FR-DOR-07`, `CON-UI-01` | แสดงฟิลด์/ผลตาม feature; placeholder ระบุเฉพาะชื่อหอพักหรือทำเลตาม `FR-DOR-01` | loading/error copy เป็น UI เพิ่มเติมตาม plan |
| `frontend/src/pages/DormDetailPage.jsx`: `DormitoryDetail`, `DormDetailPage` | `FR-DOR-03`, `FR-DOR-04`, `FR-DOR-05`, `FR-DOR-08`, `DOM-RULE-01` | แสดงช่องทางติดต่อเป็นข้อมูลตาม `FR-DOR-03`; นำปุ่ม “โทร/ไลน์” ที่ไม่มี requirement/action รองรับออก (`F-08`) | |
| `frontend/src/App.jsx`, `frontend/src/main.jsx` | `FR-DOR-01` ถึง `FR-DOR-08`, `CON-ACC-01` | มี routes ค้นหาและรายละเอียด; public routes ไม่มี authentication | |
| `frontend/src/components/Navbar.jsx`, `Footer.jsx` | ไม่มี FR โดยตรง นอกจากทางนำทางหน้าแรก | Navbar แสดงลิงก์หน้าแรก; นำลิงก์เกี่ยวกับเราออกเพราะไม่มี route/requirement รองรับ (`F-06`) | |
| `frontend/src/utils/format.js`: `formatPriceRange` | `FR-DOR-01`, `ASM-03` | แสดงช่วงราคา Min-Max ตามผล search | |
| `frontend/src/styles/global.css`, `variables.css` | `CON-UI-01` | styles ใช้ responsive utility classes; ผลตรวจ manual อ้างใน log | ไม่มีข้อค้นพบ |

## 3. ข้อค้นพบ

ชนิดอาจระบุเป็นประเด็นเฉพาะเมื่อรายการชนิดมาตรฐานไม่ตรงกับข้อค้นพบ  
ทีมตัดสิน: เว้นว่างไว้ให้ทีมพิจารณา

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | แหล่งข้อมูลจริงไม่รองรับ | `backend/app/database.py`, `backend/app/search_api.py`, `backend/app/details.py` | `NFR-ACC-01` | แก้การอ่านข้อมูล runtime จาก fixtures เป็น SQLite ถาวรแล้ว และ API สะท้อนค่าที่เปลี่ยนในฐานข้อมูล; อย่างไรก็ตามฐานข้อมูลใหม่ seed ข้อมูลตัวอย่างจาก fixtures เพียงครั้งแรก และยังไม่มีแหล่งข้อมูลจริงที่ระบุใน scope จึงยืนยันความถูกต้องกับสภาพห้องจริงไม่ได้ | |
| F-02 | test อ่อน | `backend/tests/test_performance.py`, `backend/tests/test_AC_DOR_06.py` | `NFR-PERF-01`, `AC-DOR-06` | ปรับ test `AC-DOR-06` ให้ยิง HTTP จริงผ่าน localhost/loopback 100 requests แบบ sequential ต่อ API ตามโปรไฟล์ที่ทีมเลือกแล้ว; อย่างไรก็ตามโปรไฟล์ loopback ไม่ใช่ deployment และ `test_TC_DOR_06_1` ยังใช้ ASGITransport ตามข้อห้ามแก้ test `test_TC_*` จึงยังยืนยัน NFR-PERF-01 ในสภาวะเครือข่ายปกติของ deployment ไม่ได้ | |
| F-03 | เดา ASM-05 | `backend/app/recommendations.py`: `recommend_dormitories` | `FR-DOR-07`, `ASM-05` | ทีมกำหนดให้ทำเลตรงเมื่อข้อความ `q` ตรงกับ `location` ทั้งข้อความ; ราคาเทียบด้วยระยะห่างจากช่วงค้นหา (ช่วงทับซ้อนระยะ 0); เมื่อมีทั้งคู่ให้ทำเลมาก่อนและใช้ระยะราคาเป็นลำดับรอง; implementation และ regression test ปรับตามกติกานี้แล้ว | |
| F-04 | NFR ไม่มีเกณฑ์ตรวจรับ | `spec.md`: `NFR-USE-01`; `tasks.md`: T-09 | `NFR-USE-01` | ทีมกำหนดเกณฑ์ตรวจรับแล้ว: ผู้ใช้ทั่วไป 5 คนทำงานค้นหา/กรอง, ล้างตัวกรอง และเปิดดูรายละเอียด; แต่ละงานต้องสำเร็จโดยไม่รับความช่วยเหลืออย่างน้อย 4 ใน 5 คน. ขั้นตอนและเกณฑ์ถูกเพิ่มใน spec/plan; การทดสอบจริงยังรอดำเนินการ | เกณฑ์กำหนดแล้ว |
| F-05 | test อ่อน | `frontend/src/__tests__/TC-DOR-02-2.test.jsx`; `backend/tests/test_AC_DOR_02.py` | `TC-DOR-02-2`, `FR-DOR-03`, `FR-DOR-04` | test `TC-DOR-02-2` เดิมยังคงเดิมตามข้อห้าม แต่เพิ่ม coverage เสริมที่ไม่ใช่ `test_TC_*` ทั้ง API และ UI ตรวจค่าเช่า ค่าน้ำ ค่าไฟ ค่ามัดจำ สิ่งอำนวยความสะดวก กฎ ความปลอดภัย ช่องทางติดต่อ รูปภาพ สถานที่ใกล้เคียง และการไม่มี Verified Badge | แก้แล้ว |
| F-06 | โค้ดไม่มี FR | `frontend/src/components/Navbar.jsx`, `frontend/src/App.jsx` | ไม่มี requirement ที่รองรับ | นำลิงก์ “เกี่ยวกับเรา” ที่ชี้ไป `/about` ออกจาก navbar เนื่องจากไม่มี route และไม่มี requirement รองรับ เพิ่ม regression test ยืนยันว่าเมนูไม่แสดงลิงก์ดังกล่าว | แก้แล้ว |
| F-07 | โค้ดไม่มี FR | `frontend/src/pages/HomePage.jsx` | `FR-DOR-01` | แก้ placeholder จาก “ระบุชื่อหอพัก, ย่าน หรือสถานศึกษา” เป็น “ระบุชื่อหอพักหรือทำเล” ให้ตรงขอบเขตการค้นหาตาม FR-DOR-01; เพิ่ม regression test ยืนยันข้อความ | แก้แล้ว |
| F-08 | โค้ดไม่มี FR | `frontend/src/pages/DormDetailPage.jsx`: `DormitoryDetail` | `FR-DOR-03` | นำปุ่ม “โทร/ไลน์” ที่ไม่มี handler หรือ requirement รองรับออก โดยคงข้อมูลช่องทางติดต่อที่ FR-DOR-03 กำหนด; เพิ่ม regression test ยืนยันว่าข้อมูลยังแสดงและไม่มีปุ่มดังกล่าว | แก้แล้ว |

## 4. แก้แล้ว

| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 (ส่วน FR-DOR-02/runtime) | เพิ่ม SQLite ตาม model และเปลี่ยน API ค้นหา/แนะนำ/รายละเอียดให้อ่านข้อมูลที่บันทึกไว้; seed fixtures เฉพาะฐานข้อมูลใหม่ที่ยังไม่มีข้อมูล | `test_AC_DOR_01_search_reads_latest_database_values`, `test_AC_DOR_02_detail_reads_latest_database_values` และ backend suite 34 tests ผ่าน; ยังไม่มีแหล่งข้อมูลจริงตามที่ระบุใน scope |
| F-02 (ส่วน AC-DOR-06 test profile) | เปลี่ยน test `AC-DOR-06` จาก ASGITransport เป็น HTTP จริงผ่าน localhost/loopback และใช้ 100 requests แบบ sequential ต่อ API ตามที่ทีมเลือก; ไม่แก้ `test_TC_*` | `test_AC_DOR_06_search_and_detail_p95_under_three_seconds` ตรวจ p95 <= 3 วินาทีผ่าน; backend suite 34 tests ผ่าน; ข้อจำกัดเรื่อง deployment คงบันทึกในข้อค้นพบ F-02 |
| F-03 | ปรับ recommendation ให้ match ทำเลแบบทั้งข้อความ ใช้ระยะห่างจากช่วงราคาค้นหา และให้ทำเลมาก่อนราคา ตามคำตอบทีมที่บันทึกใน `ASM-05` | `test_AC_DOR_03_exact_location_precedes_price_distance` และ backend suite ผ่าน |
| F-04 (เกณฑ์ตรวจรับ) | ระบุผู้ทดสอบ งาน และ threshold ของ `NFR-USE-01` ใน spec และขั้นตอนตรวจด้วยคนใน plan; ทดสอบจริงยังไม่ดำเนินการ | เกณฑ์ตรวจสอบย้อนกลับได้จาก `NFR-USE-01`; ผลทดสอบผู้ใช้ยังรอการดำเนินการ |
| F-05 | เพิ่ม regression coverage แยกที่ตรวจข้อมูลรายละเอียดครบทุกฟิลด์ทั้ง API และ UI สำหรับหอพัก Approved แต่ไม่ Verified โดยไม่แก้ `test_TC_*` | `test_AC_DOR_02_unverified_detail_contains_all_required_fields` และ `AC-DOR-02-unverified-detail.test.jsx` ผ่าน |
| F-06 | นำลิงก์ “เกี่ยวกับเรา” ที่ไม่มี route/requirement รองรับออกจาก navbar; ไม่เพิ่มหน้าใหม่เพื่อหลีกเลี่ยงการเพิ่ม scope | `test_F_06_about_link_removed` ยืนยันว่ามีลิงก์หน้าแรกและไม่มีลิงก์เกี่ยวกับเรา |
| F-07 | ปรับ placeholder ในช่องค้นหาให้ระบุเฉพาะชื่อหอพักหรือทำเลตาม `FR-DOR-01` | `test_F_07_search_hint_only_mentions_supported_search_fields` ผ่าน |
| F-08 | นำปุ่ม “โทร/ไลน์” ที่ไม่มี behavior/requirement รองรับออกจากหน้ารายละเอียด โดยคงช่องทางติดต่อเป็นข้อมูลแสดงผลตาม `FR-DOR-03` | `test_AC_DOR_02_contact_info_displays_without_an_unsupported_call_action` ผ่าน |
