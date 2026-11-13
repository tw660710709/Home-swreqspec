import unittest

from httpx import ASGITransport, AsyncClient

from backend.app.database import initialize_database
from backend.app.main import app


class DormitoryCancelPersistenceTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ FR-DOR-16, CON-BUS-01 และ AC-DOR-11
    async def asyncSetUp(self) -> None:
        initialize_database()
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_TC_DOR_11_1_cancel_discards_changes_and_returns_to_list(
        self,
    ) -> None:
        # Given เจ้าของแก้ไขข้อมูลหอพักที่โหลดจากฐานข้อมูลและเปลี่ยนค่าโดยยังไม่บันทึก
        original_payload = {
            "name": "หอพักเดิม",
            "location": "ทำเลเดิม",
            "type": "หอพักรวม",
            "contact_info": "ช่องทางติดต่อเดิม",
        }
        saved_response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json=original_payload,
        )
        self.assertEqual(saved_response.status_code, 200)
        original = saved_response.json()
        unsaved_values = {
            **original_payload,
            "name": "ชื่อที่แก้แต่ไม่บันทึก",
            "location": "ทำเลที่แก้แต่ไม่บันทึก",
        }
        self.assertNotEqual(unsaved_values, original_payload)

        # When เจ้าของกดยกเลิกและไม่ส่งคำขอบันทึกการเปลี่ยนแปลงไปยัง API
        current_response = await self.client.get(
            f"/owners/dormitories/{original['dormitory_id']}",
            headers={"X-Owner-Id": "owner-1"},
        )
        owner_list_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )

        # Then ข้อมูลเดิมยังอยู่ในฐานข้อมูลและรายการเจ้าของแสดงข้อมูลเดิม
        self.assertEqual(current_response.status_code, 200)
        self.assertEqual(current_response.json(), original)
        self.assertNotEqual(current_response.json()["name"], unsaved_values["name"])
        self.assertEqual(owner_list_response.status_code, 200)
        self.assertIn(original, owner_list_response.json())
