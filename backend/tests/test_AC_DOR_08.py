import unittest

from httpx import ASGITransport, AsyncClient

from backend.app.database import initialize_database
from backend.app.main import app


class OwnerDormitorySaveTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ CON-DATA-01, CON-BUS-01, DOM-RULE-01, FR-DOR-10,
    # FR-DOR-12, FR-DOR-15 และ AC-DOR-08
    async def asyncSetUp(self) -> None:
        initialize_database()
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_AC_DOR_08_save_shows_pending_status_to_owner_and_admin_only(
        self,
    ) -> None:
        # Given เจ้าของกรอกข้อมูลหอพักใหม่ที่ครบถ้วนและถูกต้อง
        payload = {
            "name": "หอพักใหม่ของ owner-1",
            "location": "ทำเลใหม่",
            "type": "หอพักรวม",
            "contact_info": "ช่องทางติดต่อใหม่",
            "amenities": ["อินเทอร์เน็ตไร้สาย"],
            "rules": "กฎระเบียบตัวอย่าง",
        }

        # When เจ้าของยืนยันบันทึก แล้วอ่านข้อมูลล่าสุดของตนและขอมุมมองสาธารณะ
        saved_response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json=payload,
        )
        self.assertEqual(saved_response.status_code, 200)
        saved = saved_response.json()
        dormitory_id = saved["dormitory_id"]
        owner_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        public_list_response = await self.client.get("/dormitories")
        public_detail_response = await self.client.get(
            f"/dormitories/{dormitory_id}",
        )

        # Then ข้อมูลที่บันทึกแล้วอ่านกลับได้พร้อมสถานะ Pending และไม่ปรากฏต่อสาธารณะ
        self.assertEqual(saved["approval_status"], "Pending")
        self.assertEqual(saved["name"], payload["name"])
        owner_dormitories = owner_response.json()
        persisted = next(
            item for item in owner_dormitories
            if item["dormitory_id"] == dormitory_id
        )
        self.assertEqual(persisted, saved)
        self.assertNotIn(
            dormitory_id,
            [item["id"] for item in public_list_response.json()],
        )
        self.assertEqual(public_detail_response.status_code, 404)

    async def test_AC_DOR_08_updates_latest_data_only_for_owning_owner(self) -> None:
        # Given owner-1 ได้บันทึกข้อมูลหอพักที่ยังรออนุมัติ
        created = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพักก่อนแก้ไข",
                "location": "ทำเลเดิม",
                "type": "หอพักรวม",
                "contact_info": "ติดต่อเดิม",
            },
        )
        self.assertEqual(created.status_code, 200)
        dormitory_id = created.json()["dormitory_id"]

        # When owner-1 แก้ไขข้อมูล แล้ว owner-2 พยายามแก้ไขหอพักเดียวกัน
        updated_payload = {
            "name": "หอพักหลังแก้ไข",
            "location": "ทำเลใหม่",
            "type": "หอพักหญิง",
            "contact_info": "ติดต่อใหม่",
        }
        updated = await self.client.put(
            f"/owners/dormitories/{dormitory_id}",
            headers={"X-Owner-Id": "owner-1"},
            json=updated_payload,
        )
        foreign_update = await self.client.put(
            f"/owners/dormitories/{dormitory_id}",
            headers={"X-Owner-Id": "owner-2"},
            json=updated_payload,
        )

        # Then owner-1 อ่านข้อมูลล่าสุดได้ และ owner-2 ไม่สามารถอ่านหรือแก้ไขได้
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["name"], updated_payload["name"])
        self.assertEqual(updated.json()["approval_status"], "Pending")
        self.assertEqual(foreign_update.status_code, 404)
        owner_read = await self.client.get(
            f"/owners/dormitories/{dormitory_id}",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(owner_read.json(), updated.json())

    async def test_AC_DOR_08_rejects_save_without_authenticated_owner(self) -> None:
        # Given ข้อมูลหอพักครบถ้วน แต่ไม่มีตัวตนเจ้าของที่ผ่านการยืนยัน
        payload = {
            "name": "หอพักไม่มีเจ้าของ",
            "location": "ทำเล",
            "type": "หอพักรวม",
            "contact_info": "ติดต่อ",
        }

        # When พยายามบันทึกโดยไม่มี X-Owner-Id
        response = await self.client.post("/owners/dormitories", json=payload)

        # Then ระบบปฏิเสธคำขอและไม่บันทึกข้อมูล
        self.assertEqual(response.status_code, 401)
        owner_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(owner_response.json(), [])

    async def test_AC_DOR_08_rejects_incomplete_data_without_saving(self) -> None:
        # Given ข้อมูลหอพักขาดช่องทางติดต่อและมีชื่อว่าง
        payload = {
            "name": "",
            "location": "ทำเล",
            "type": "หอพักรวม",
        }

        # When เจ้าของยืนยันบันทึกข้อมูลที่ไม่ครบถ้วน
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json=payload,
        )

        # Then ระบบปฏิเสธและไม่มีข้อมูลถูกบันทึก
        self.assertGreaterEqual(response.status_code, 400)
        self.assertLess(response.status_code, 500)
        owner_response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(owner_response.json(), [])
