# ผลรันเทสต์ Frontend ของ UC-03 จัดการข้อมูลหอพัก

- วันที่รัน: 2026-11-22
- คำสั่ง: `cd frontend && npx vitest run src/__tests__/AC-DOR-0[7-9]* src/__tests__/AC-DOR-1[0-2]* src/__tests__/FR-DOR-12* src/__tests__/TC-DOR-0[7-9]* src/__tests__/TC-DOR-1[0-2]* --no-file-parallelism --testTimeout=30000`
- ผลรวม: **ผ่าน 36 / 36 tests, ไม่ผ่าน 0** จาก 24 ไฟล์
- หมายเหตุ: เมื่อรันแบบขนาน (ค่าเริ่มต้น) บนเครื่องที่ช้า มี test บางตัว timeout ที่ 5 วินาทีแบบสุ่ม จึงรันทีละไฟล์และเพิ่ม timeout เป็น 30 วินาที โดยไม่แก้ test
- Backend (pytest) ไม่ได้รันซ้ำในรอบนี้ ใช้ผลล่าสุดจาก [rtm.md](../../specs/003-manage_dormitory_data/rtm.md): pytest 89 ผ่าน, Vitest 65 ผ่าน (2569-11-13)

| ไฟล์ | test | อ้าง ID | ผล |
|---|---|---|---|
| `AC-DOR-07-owner-list.test.jsx` | `test_AC_DOR_07_owner_list_renders_only_owner_rows` | AC-DOR-07 | ผ่าน |
| `AC-DOR-07-owner-list.test.jsx` | `test_AC_DOR_07_edit_form_shows_existing_data` | AC-DOR-07 | ผ่าน |
| `AC-DOR-07-owner-list.test.jsx` | `test_CON_ACC_01_owner_client_sends_prototype_identity_header` | CON-ACC-01 | ผ่าน |
| `AC-DOR-08-dormitory-form.test.jsx` | `test_AC_DOR_08_dormitory_form_saves_valid_data` | AC-DOR-08 | ผ่าน |
| `AC-DOR-08-dormitory-form.test.jsx` | `test_AC_DOR_08_edit_form_sends_only_editable_fields` | AC-DOR-08 | ผ่าน |
| `AC-DOR-08-dormitory-form.test.jsx` | `test_AC_DOR_08_save_requests_use_owner_api` | AC-DOR-08 | ผ่าน |
| `AC-DOR-08-rooms-page.test.jsx` | `test_AC_DOR_08_room_management_page_is_separate_and_linked` | AC-DOR-08 | ผ่าน |
| `AC-DOR-08-rooms-page.test.jsx` | `test_AC_DOR_08_room_client_uses_owner_api_and_selected_ids` | AC-DOR-08 | ผ่าน |
| `AC-DOR-09-field-errors.test.jsx` | `test_AC_DOR_09_field_errors_display_without_saving` | AC-DOR-09 | ผ่าน |
| `AC-DOR-09-field-errors.test.jsx` | `test_AC_DOR_09_edit_field_error_clears_when_corrected` | AC-DOR-09 | ผ่าน |
| `AC-DOR-09-field-errors.test.jsx` | `test_AC_DOR_09_client_maps_api_validation_details_to_fields` | AC-DOR-09 | ผ่าน |
| `AC-DOR-10-image-upload.test.jsx` | `test_AC_DOR_10_rejected_files_keep_valid_files` | AC-DOR-10 | ผ่าน |
| `AC-DOR-10-image-upload.test.jsx` | `test_AC_DOR_10_new_dormitory_uploads_images_after_save` | AC-DOR-10 | ผ่าน |
| `AC-DOR-10-image-upload.test.jsx` | `test_AC_DOR_10_room_upload_shows_per_file_results` | AC-DOR-10 | ผ่าน |
| `AC-DOR-10-image-upload.test.jsx` | `test_AC_DOR_10_upload_client_sends_multipart_files_with_owner_identity` | AC-DOR-10 | ผ่าน |
| `AC-DOR-11-cancel.test.jsx` | `test_AC_DOR_11_cancel_discards_unsaved_changes` | AC-DOR-11 | ผ่าน |
| `AC-DOR-12-public-detail.test.jsx` | `test_AC_DOR_12_public_detail_renders_only_api_approved_data` | AC-DOR-12 | ผ่าน |
| `FR-DOR-12-image-management.test.jsx` | `test_FR_DOR_12_dormitory_form_displays_deletes_and_replaces_saved_images` | FR-DOR-12 | ผ่าน |
| `FR-DOR-12-image-management.test.jsx` | `test_FR_DOR_12_room_page_displays_deletes_and_replaces_saved_images` | FR-DOR-12 | ผ่าน |
| `FR-DOR-12-image-management.test.jsx` | `test_FR_DOR_12_image_api_sends_owner_identity_for_read_and_delete` | FR-DOR-12 | ผ่าน |
| `TC-DOR-07-1.test.jsx` | `test_TC_DOR_07_1_owner_list_and_actions` | TC-DOR-07-1 | ผ่าน |
| `TC-DOR-08-1.test.jsx` | `test_TC_DOR_08_1_save_and_show_pending_data` | TC-DOR-08-1 | ผ่าน |
| `TC-DOR-08-2.test.jsx` | `test_TC_DOR_08_2_edit_approved_dormitory_pending_q02` | TC-DOR-08-2 | ผ่าน |
| `TC-DOR-08-3.test.jsx` | `test_TC_DOR_08_3_room_management_is_separate_and_linked` | TC-DOR-08-3 | ผ่าน |
| `TC-DOR-09-1.test.jsx` | `test_TC_DOR_09_1_missing_required_fields_shows_reasons_without_saving` | TC-DOR-09-1 | ผ่าน |
| `TC-DOR-09-2.test.jsx` | `test_TC_DOR_09_2_single_missing_location_shows_error_without_saving` | TC-DOR-09-2 | ผ่าน |
| `TC-DOR-09-3.test.jsx` | `test_TC_DOR_09_3_valid_data_proceeds_to_save` | TC-DOR-09-3 | ผ่าน |
| `TC-DOR-09-4.test.jsx` | `test_TC_DOR_09_4_invalid_value_shows_reason_without_saving` | TC-DOR-09-4 | ผ่าน |
| `TC-DOR-10-1.test.jsx` | `test_TC_DOR_10_1_reject_only_unsupported_file_and_keep_valid_files` | TC-DOR-10-1 | ผ่าน |
| `TC-DOR-10-3.test.jsx` | `test_TC_DOR_10_3_reject_only_oversized_file` | TC-DOR-10-3 | ผ่าน |
| `TC-DOR-10-5.test.jsx` | `test_TC_DOR_10_5_reject_only_image_over_limit` | TC-DOR-10-5 | ผ่าน |
| `TC-DOR-11-1.test.jsx` | `test_TC_DOR_11_1_cancel_discards_changes_and_returns_to_list` | TC-DOR-11-1 | ผ่าน |
| `TC-DOR-11-2.test.jsx` | `test_TC_DOR_11_2_cancel_without_form_changes` | TC-DOR-11-2 | ผ่าน |
| `TC-DOR-12-1.test.jsx` | `test_TC_DOR_12_1_public_view_shows_latest_approved_data_and_images` | TC-DOR-12-1 | ผ่าน |
| `TC-DOR-12-2.test.jsx` | `test_TC_DOR_12_2_public_view_hides_pending_image` | TC-DOR-12-2 | ผ่าน |
| `TC-DOR-12-3.test.jsx` | `test_TC_DOR_12_3_public_view_hides_pending_dormitory_data` | TC-DOR-12-3 | ผ่าน |
