import unittest

from httpx import ASGITransport, AsyncClient

from backend.app.database import initialize_database
from backend.app.main import app


def _field_errors(response: dict[str, object]) -> dict[str, str]:
    # รองรับ FR-DOR-13, FR-DOR-17 และ AC-DOR-09
    details = response.get("detail")
    if not isinstance(details, list):
        return {}

    return {
        str(error["loc"][-1]): str(error["msg"])
        for error in details
        if isinstance(error, dict)
        and isinstance(error.get("loc"), list)
        and len(error["loc"]) > 1
        and error["loc"][0] == "body"
        and error.get("msg")
    }


class OwnerDormitoryValidationTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ CON-DATA-01, FR-DOR-13, FR-DOR-17 และ AC-DOR-09
    async def asyncSetUp(self) -> None:
        initialize_database()
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_AC_DOR_09_required_and_invalid_fields_show_per_field_errors_without_saving(
        self,
    ) -> None:
        # Given ข้อมูลชื่อ ทำเล และประเภทว่าง และไม่มีช่องทางติดต่อ
        before_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        before_ids = {
            dormitory["dormitory_id"] for dormitory in before_response.json()
        }

        # When เจ้าของยืนยันบันทึกข้อมูลที่ไม่ครบถ้วน
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "",
                "location": "",
                "type": "",
            },
        )

        # Then API แจ้งเหตุผลแยกตามทั้งสี่ช่องและไม่บันทึกข้อมูล
        self.assertEqual(response.status_code, 422)
        errors = _field_errors(response.json())
        self.assertEqual(
            set(errors),
            {"name", "location", "type", "contact_info"},
        )
        self.assertTrue(all(message.strip() for message in errors.values()))

        after_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        after_ids = {
            dormitory["dormitory_id"] for dormitory in after_response.json()
        }
        self.assertEqual(after_ids, before_ids)

    async def test_AC_DOR_09_single_missing_location_shows_error_without_saving(
        self,
    ) -> None:
        # Given ข้อมูลจำเป็นครบ ยกเว้นที่อยู่/ทำเล
        before_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        before_ids = {
            dormitory["dormitory_id"] for dormitory in before_response.json()
        }

        # When เจ้าของยืนยันบันทึก
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพักที่อยู่ไม่ครบ",
                "type": "หอพักรวม",
                "contact_info": "โทรศัพท์",
            },
        )

        # Then แจ้งเฉพาะช่องที่อยู่/ทำเลและไม่บันทึกข้อมูล
        self.assertEqual(response.status_code, 422)
        errors = _field_errors(response.json())
        self.assertEqual(set(errors), {"location"})
        self.assertTrue(errors["location"].strip())
        after_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        after_ids = {
            dormitory["dormitory_id"] for dormitory in after_response.json()
        }
        self.assertEqual(after_ids, before_ids)

    async def test_AC_DOR_09_invalid_update_does_not_change_saved_data(self) -> None:
        # Given เจ้าของมีข้อมูลหอพักที่บันทึกแล้ว
        original_response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพักก่อนตรวจ",
                "location": "ทำเลเดิม",
                "type": "หอพักรวม",
                "contact_info": "โทรศัพท์เดิม",
            },
        )
        self.assertEqual(original_response.status_code, 200)
        original = original_response.json()

        # When เจ้าของส่งการแก้ไขที่มีข้อมูลจำเป็นว่าง
        response = await self.client.put(
            f"/owners/dormitories/{original['dormitory_id']}",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "",
                "location": "ทำเลใหม่",
                "type": "หอพักรวม",
                "contact_info": "โทรศัพท์ใหม่",
            },
        )

        # Then API แจ้งข้อผิดพลาดของช่องชื่อและคงข้อมูลเดิม
        self.assertEqual(response.status_code, 422)
        self.assertIn("name", _field_errors(response.json()))
        current_response = await self.client.get(
            f"/owners/dormitories/{original['dormitory_id']}",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(current_response.status_code, 200)
        self.assertEqual(current_response.json(), original)

    async def test_TC_DOR_09_1_missing_required_fields_shows_reasons_without_saving(
        self,
    ) -> None:
        # Given เจ้าของกรอกข้อมูลหอพักโดยเว้นชื่อ ทำเล ประเภท และช่องทางติดต่อ
        before_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        before_ids = {
            dormitory["dormitory_id"] for dormitory in before_response.json()
        }

        # When เจ้าของกดยืนยันการบันทึก
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={"name": "", "location": "", "type": ""},
        )

        # Then แจ้งเหตุผลแยกช่องและไม่บันทึกข้อมูล
        self.assertEqual(response.status_code, 422)
        errors = _field_errors(response.json())
        self.assertEqual(
            set(errors),
            {"name", "location", "type", "contact_info"},
        )
        self.assertTrue(all(message.strip() for message in errors.values()))
        after_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        after_ids = {
            dormitory["dormitory_id"] for dormitory in after_response.json()
        }
        self.assertEqual(after_ids, before_ids)

    async def test_TC_DOR_09_2_single_missing_location_shows_error_without_saving(
        self,
    ) -> None:
        # Given เจ้าของกรอกข้อมูลจำเป็นครบ ยกเว้นที่อยู่/ทำเล
        before_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        before_ids = {
            dormitory["dormitory_id"] for dormitory in before_response.json()
        }

        # When เจ้าของกดยืนยันการบันทึก
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพัก TC-DOR-09-2",
                "type": "หอพักรวม",
                "contact_info": "ช่องทางติดต่อทดสอบ",
            },
        )

        # Then แจ้งเฉพาะช่องที่อยู่/ทำเลและไม่บันทึกข้อมูล
        self.assertEqual(response.status_code, 422)
        errors = _field_errors(response.json())
        self.assertEqual(set(errors), {"location"})
        self.assertTrue(errors["location"].strip())
        after_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        after_ids = {
            dormitory["dormitory_id"] for dormitory in after_response.json()
        }
        self.assertEqual(after_ids, before_ids)

    async def test_TC_DOR_09_3_valid_data_proceeds_to_save(self) -> None:
        # Given เจ้าของกรอกข้อมูลครบและผ่านการตรวจสอบที่กำหนด
        payload = {
            "name": "หอพัก TC-DOR-09-3",
            "location": "ทำเลทดสอบ",
            "type": "หอพักรวม",
            "contact_info": "ช่องทางติดต่อทดสอบ",
        }

        # When เจ้าของกดยืนยันการบันทึก
        saved_response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json=payload,
        )
        self.assertEqual(saved_response.status_code, 200)
        saved = saved_response.json()
        dormitory_id = saved["dormitory_id"]
        owner_response = await self.client.get(
            f"/owners/dormitories/{dormitory_id}",
            headers={"X-Owner-Id": "owner-1"},
        )
        public_list_response = await self.client.get("/dormitories")
        public_detail_response = await self.client.get(
            f"/dormitories/{dormitory_id}",
        )

        # Then ข้อมูลล่าสุดแสดงแก่เจ้าของ สถานะ Pending และผู้ใช้ทั่วไปไม่เห็นข้อมูล
        self.assertEqual(owner_response.status_code, 200)
        self.assertEqual(owner_response.json(), saved)
        self.assertEqual(saved["name"], payload["name"])
        self.assertEqual(saved["approval_status"], "Pending")
        self.assertNotIn(
            dormitory_id,
            [item["id"] for item in public_list_response.json()],
        )
        self.assertEqual(public_detail_response.status_code, 404)
