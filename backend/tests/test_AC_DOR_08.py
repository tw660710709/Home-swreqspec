import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from backend.app.database import initialize_database
from backend.app.main import app


class OwnerDormitorySaveTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ CON-DATA-01, CON-BUS-01, DOM-RULE-01, FR-DOR-10,
    # FR-DOR-12, FR-DOR-15, AC-DOR-08, AC-DOR-12 และ ASM-20
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

    async def test_TC_DOR_08_2_edit_approved_dormitory_pending_q02(self) -> None:
        # Given หอพักที่อนุมัติแล้วและผู้ใช้ทั่วไปเปิดดูข้อมูลเดิมได้
        with tempfile.TemporaryDirectory() as temporary_directory:
            database_path = Path(temporary_directory) / "dormitory.sqlite3"
            with patch.dict(
                os.environ,
                {"DORMITORY_DATABASE_PATH": str(database_path)},
            ):
                initialize_database()
                created = await self.client.post(
                    "/owners/dormitories",
                    headers={"X-Owner-Id": "owner-1"},
                    json={
                        "name": "หอพักเดิมที่อนุมัติ",
                        "location": "ทำเลเดิม",
                        "type": "หอพักรวม",
                        "contact_info": "ติดต่อเดิม",
                    },
                )
                self.assertEqual(created.status_code, 200)
                dormitory_id = created.json()["dormitory_id"]

                with sqlite3.connect(database_path) as connection:
                    connection.execute(
                        """
                        UPDATE owner_dormitories
                        SET approval_status = 'Approved'
                        WHERE dormitory_id = ?
                        """,
                        (dormitory_id,),
                    )

                approved_public_view = await self.client.get(
                    f"/dormitories/{dormitory_id}"
                )
                self.assertEqual(approved_public_view.status_code, 200)
                self.assertEqual(
                    approved_public_view.json()["name"],
                    "หอพักเดิมที่อนุมัติ",
                )

                # When เจ้าของบันทึกการแก้ไขหอพักที่อนุมัติแล้ว
                updated_response = await self.client.put(
                    f"/owners/dormitories/{dormitory_id}",
                    headers={"X-Owner-Id": "owner-1"},
                    json={
                        "name": "หอพักใหม่ที่รออนุมัติ",
                        "location": "ทำเลใหม่",
                        "type": "หอพักหญิง",
                        "contact_info": "ติดต่อใหม่",
                    },
                )
                owner_view = await self.client.get(
                    f"/owners/dormitories/{dormitory_id}",
                    headers={"X-Owner-Id": "owner-1"},
                )
                public_view = await self.client.get(
                    f"/dormitories/{dormitory_id}"
                )

                # Then เจ้าของเห็นข้อมูลใหม่ Pending; ผู้ใช้ทั่วไปไม่เห็นข้อมูลเดิมหรืองานแก้ไข
                self.assertEqual(updated_response.status_code, 200)
                self.assertEqual(owner_view.status_code, 200)
                self.assertEqual(owner_view.json()["name"], "หอพักใหม่ที่รออนุมัติ")
                self.assertEqual(owner_view.json()["approval_status"], "Pending")
                self.assertEqual(public_view.status_code, 404)
                self.assertNotIn("หอพักเดิมที่อนุมัติ", public_view.text)
                self.assertNotIn("หอพักใหม่ที่รออนุมัติ", public_view.text)

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

    async def test_AC_DOR_08_room_management_is_separate_and_linked(self) -> None:
        # Given owner-1 และ owner-2 มีหอพักคนละแห่ง
        owner_one_dormitory = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพัก owner-1",
                "location": "ทำเล owner-1",
                "type": "หอพักรวม",
                "contact_info": "ติดต่อ owner-1",
            },
        )
        owner_two_dormitory = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-2"},
            json={
                "name": "หอพัก owner-2",
                "location": "ทำเล owner-2",
                "type": "หอพักหญิง",
                "contact_info": "ติดต่อ owner-2",
            },
        )
        self.assertEqual(owner_one_dormitory.status_code, 200)
        self.assertEqual(owner_two_dormitory.status_code, 200)
        owner_one_id = owner_one_dormitory.json()["dormitory_id"]
        owner_two_id = owner_two_dormitory.json()["dormitory_id"]

        # When แต่ละเจ้าของเพิ่มห้องในหอพักของตน และ owner-1 แก้ราคา
        owner_one_room = await self.client.post(
            f"/owners/dormitories/{owner_one_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
            json={"monthly_rent": "5000"},
        )
        owner_one_second_room = await self.client.post(
            f"/owners/dormitories/{owner_one_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
            json={"monthly_rent": "6000"},
        )
        owner_two_room = await self.client.post(
            f"/owners/dormitories/{owner_two_id}/rooms",
            headers={"X-Owner-Id": "owner-2"},
            json={"monthly_rent": "7000"},
        )
        self.assertEqual(owner_one_room.status_code, 200)
        self.assertEqual(owner_one_second_room.status_code, 200)
        self.assertEqual(owner_two_room.status_code, 200)
        owner_one_room_data = owner_one_room.json()
        owner_two_room_data = owner_two_room.json()

        owner_one_rooms = await self.client.get(
            f"/owners/dormitories/{owner_one_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
        )
        updated_room = await self.client.put(
            f"/owners/dormitories/{owner_one_id}/rooms/"
            f"{owner_one_room_data['room_id']}",
            headers={"X-Owner-Id": "owner-1"},
            json={"monthly_rent": "5500"},
        )
        foreign_dormitory_rooms = await self.client.get(
            f"/owners/dormitories/{owner_two_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
        )
        mismatched_room_update = await self.client.put(
            f"/owners/dormitories/{owner_two_id}/rooms/"
            f"{owner_one_room_data['room_id']}",
            headers={"X-Owner-Id": "owner-2"},
            json={"monthly_rent": "8000"},
        )
        foreign_room_update = await self.client.put(
            f"/owners/dormitories/{owner_one_id}/rooms/"
            f"{owner_one_room_data['room_id']}",
            headers={"X-Owner-Id": "owner-2"},
            json={"monthly_rent": "8000"},
        )

        # Then แต่ละห้องเชื่อมกับหอพักของตน รองรับหลายห้อง และปฏิเสธคู่ ID ที่ไม่มีสิทธิ์
        self.assertEqual(owner_one_rooms.status_code, 200)
        owner_one_room_rows = owner_one_rooms.json()
        self.assertEqual(len(owner_one_room_rows), 2)
        self.assertEqual(
            {room["dormitory_id"] for room in owner_one_room_rows},
            {owner_one_id},
        )
        self.assertEqual(
            {room["room_id"] for room in owner_one_room_rows},
            {
                owner_one_room_data["room_id"],
                owner_one_second_room.json()["room_id"],
            },
        )
        self.assertEqual(
            set(owner_one_room_rows[0]),
            {"room_id", "dormitory_id", "monthly_rent"},
        )
        self.assertEqual(updated_room.status_code, 200)
        self.assertEqual(updated_room.json()["monthly_rent"], "5500")
        self.assertEqual(owner_two_room_data["dormitory_id"], owner_two_id)
        for rejected_response in (
            foreign_dormitory_rooms,
            mismatched_room_update,
            foreign_room_update,
        ):
            self.assertGreaterEqual(rejected_response.status_code, 400)
            self.assertLess(rejected_response.status_code, 500)
        persisted_rooms = await self.client.get(
            f"/owners/dormitories/{owner_one_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
        )
        persisted_by_id = {
            room["room_id"]: room for room in persisted_rooms.json()
        }
        self.assertEqual(
            persisted_by_id[owner_one_room_data["room_id"]]["monthly_rent"],
            "5500",
        )

    async def test_AC_DOR_08_room_requires_monthly_rent(self) -> None:
        # Given เจ้าของมีหอพักที่บันทึกแล้ว แต่ไม่ได้ระบุราคาห้อง
        dormitory = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพักไม่มีราคาห้อง",
                "location": "ทำเล",
                "type": "หอพักรวม",
                "contact_info": "ติดต่อ",
            },
        )
        dormitory_id = dormitory.json()["dormitory_id"]

        # When ยืนยันเพิ่มห้องโดยไม่มี monthly_rent
        response = await self.client.post(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
            json={},
        )

        # Then ระบบปฏิเสธและไม่มีห้องถูกบันทึก
        self.assertGreaterEqual(response.status_code, 400)
        self.assertLess(response.status_code, 500)
        rooms = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(rooms.json(), [])

    async def test_TC_DOR_08_1_save_and_show_pending_data(self) -> None:
        # Given เจ้าของอยู่ในฟอร์มจัดการหอพักและกรอกข้อมูลใหม่ที่ถูกต้อง
        payload = {
            "name": "หอพักทดสอบ TC-DOR-08-1",
            "location": "ทำเลทดสอบ",
            "type": "หอพักรวม",
            "contact_info": "ช่องทางติดต่อทดสอบ",
        }

        # When เจ้าของยืนยันบันทึกข้อมูลหอพักใหม่
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

        # Then บันทึกและอ่านข้อมูลล่าสุดได้ โดย Admin อยู่นอกขอบเขตให้ตรวจเฉพาะสถานะ
        self.assertEqual(owner_response.status_code, 200)
        self.assertEqual(owner_response.json()["name"], payload["name"])
        self.assertEqual(owner_response.json()["approval_status"], "Pending")
        self.assertEqual(saved["approval_status"], "Pending")
        self.assertNotIn(
            dormitory_id,
            [item["id"] for item in public_list_response.json()],
        )
        self.assertEqual(public_detail_response.status_code, 404)

    async def test_TC_DOR_08_3_room_management_is_separate_and_linked(
        self,
    ) -> None:
        # Given เจ้าของเลือกหอพักที่บันทึกแล้วซึ่งมีหลายห้องเชื่อมโยงอยู่
        dormitory_response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพักทดสอบ TC-DOR-08-3",
                "location": "ทำเลทดสอบ",
                "type": "หอพักรวม",
                "contact_info": "ช่องทางติดต่อทดสอบ",
            },
        )
        self.assertEqual(dormitory_response.status_code, 200)
        dormitory_id = dormitory_response.json()["dormitory_id"]
        for monthly_rent in ("5000", "6000"):
            room_response = await self.client.post(
                f"/owners/dormitories/{dormitory_id}/rooms",
                headers={"X-Owner-Id": "owner-1"},
                json={"monthly_rent": monthly_rent},
            )
            self.assertEqual(room_response.status_code, 200)

        # When เจ้าของเปิดหน้าจัดการห้องพักและเพิ่มห้องพร้อมราคาต่อเดือน
        added_room_response = await self.client.post(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
            json={"monthly_rent": "7000"},
        )
        rooms_response = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
        )

        # Then หน้าจอแยกทดสอบใน Vitest และ API แสดงห้องหลายห้องที่ผูกกับหอพักพร้อมราคา
        self.assertEqual(added_room_response.status_code, 200)
        self.assertEqual(rooms_response.status_code, 200)
        self.assertEqual(added_room_response.json()["monthly_rent"], "7000")
        rooms = rooms_response.json()
        self.assertEqual(len(rooms), 3)
        self.assertEqual({room["dormitory_id"] for room in rooms}, {dormitory_id})
        self.assertEqual(
            {room["monthly_rent"] for room in rooms},
            {"5000", "6000", "7000"},
        )

    async def test_TC_DOR_08_4_reject_room_without_required_rent(
        self,
    ) -> None:
        # Given เจ้าของอยู่ในหน้าจัดการห้องพักและไม่ระบุราคาค่าเช่าต่อเดือน
        dormitory_response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
            json={
                "name": "หอพักทดสอบ TC-DOR-08-4",
                "location": "ทำเลทดสอบ",
                "type": "หอพักรวม",
                "contact_info": "ช่องทางติดต่อทดสอบ",
            },
        )
        self.assertEqual(dormitory_response.status_code, 200)
        dormitory_id = dormitory_response.json()["dormitory_id"]

        # When เจ้าของยืนยันบันทึกข้อมูลห้องโดยไม่มี monthly_rent
        response = await self.client.post(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
            json={},
        )
        rooms_response = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
        )

        # Then ระบบไม่บันทึกห้องที่ขาดราคา โดยไม่กำหนดรูปแบบข้อความผิดพลาด
        self.assertGreaterEqual(response.status_code, 400)
        self.assertLess(response.status_code, 500)
        self.assertEqual(rooms_response.json(), [])
