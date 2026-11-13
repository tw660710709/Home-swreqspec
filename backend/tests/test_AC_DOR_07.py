import sqlite3
import unittest
from contextlib import closing

from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from backend.app.database import get_database_path, initialize_database
from backend.app.main import app
from backend.app.owner_dormitories import get_owned_dormitory_room


def _seed_owner_dormitory_data() -> None:
    # รองรับ CON-AUTH-01, CON-DATA-01 และ FR-DOR-09
    initialize_database()
    with closing(sqlite3.connect(get_database_path())) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executemany(
            """
            INSERT INTO owner_dormitories (
                dormitory_id, owner_id, name, location, type, contact_info,
                approval_status, amenities, rules
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    "dorm-001",
                    "owner-1",
                    "หอพักเจ้าของ 1",
                    "ทำเล 1",
                    "หอพักรวม",
                    "ติดต่อ 1",
                    "Pending",
                    None,
                    None,
                ),
                (
                    "dorm-003",
                    "owner-1",
                    "หอพักเจ้าของ 1 อีกแห่ง",
                    "ทำเล 3",
                    "หอพักหญิง",
                    "ติดต่อ 3",
                    "Pending",
                    None,
                    None,
                ),
                (
                    "dorm-002",
                    "owner-2",
                    "หอพักเจ้าของ 2",
                    "ทำเล 2",
                    "หอพักชาย",
                    "ติดต่อ 2",
                    "Pending",
                    None,
                    None,
                ),
            ],
        )
        connection.executemany(
            """
            INSERT INTO owner_dormitory_rooms (room_id, dormitory_id, monthly_rent)
            VALUES (?, ?, ?)
            """,
            [
                ("room-001", "dorm-001", "5000"),
                ("room-002", "dorm-002", "6000"),
                ("room-003", "dorm-003", "7000"),
            ],
        )
        connection.commit()


class OwnerDormitoryApiTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ FR-DOR-09, FR-DOR-11, CON-ACC-01, CON-AUTH-01 และ NFR-SEC-02
    async def asyncSetUp(self) -> None:
        _seed_owner_dormitory_data()
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_AC_DOR_07_lists_only_authenticated_owners_dormitories(self) -> None:
        # Given มีรายการหอพักของ owner-1 และ owner-2 ในระบบ
        # When owner-1 เรียกดูรายการหอพักของตน และลองเรียกโดยไม่มี header
        response = await self.client.get(
            "/owners/dormitories",
            headers={"X-Owner-Id": "owner-1"},
        )
        unauthenticated_response = await self.client.get("/owners/dormitories")
        detail_response = await self.client.get(
            "/owners/dormitories/dorm-001",
            headers={"X-Owner-Id": "owner-1"},
        )

        # Then แสดงเฉพาะหอพักของ owner-1; ไม่มี header ถูกปฏิเสธ; รายละเอียดเดิมอ่านได้
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [dormitory["dormitory_id"] for dormitory in response.json()],
            ["dorm-001", "dorm-003"],
        )
        self.assertGreaterEqual(unauthenticated_response.status_code, 400)
        self.assertLess(unauthenticated_response.status_code, 500)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["name"], "หอพักเจ้าของ 1")

    async def test_NFR_SEC_02_rejects_foreign_dormitory_and_room_access(self) -> None:
        # Given owner-1 มีหอพัก/ห้องของตน และมีหอพัก/ห้องของ owner-2 ในระบบ
        # When owner-1 ขอรายละเอียดหรือสิทธิ์เข้าห้องของ owner-2 หรือใช้คู่ dormitory/room ที่ไม่ตรงกัน
        foreign_dormitory_response = await self.client.get(
            "/owners/dormitories/dorm-002",
            headers={"X-Owner-Id": "owner-1"},
        )
        own_room = get_owned_dormitory_room("owner-1", "dorm-001", "room-001")

        # Then ปฏิเสธข้อมูลของ owner-2 และคู่ dormitory/room ที่ไม่สัมพันธ์กัน
        self.assertGreaterEqual(foreign_dormitory_response.status_code, 400)
        self.assertLess(foreign_dormitory_response.status_code, 500)
        self.assertEqual(own_room["room_id"], "room-001")
        with self.assertRaises(HTTPException) as foreign_room_error:
            get_owned_dormitory_room("owner-1", "dorm-002", "room-002")
        self.assertGreaterEqual(foreign_room_error.exception.status_code, 400)
        self.assertLess(foreign_room_error.exception.status_code, 500)
        with self.assertRaises(HTTPException) as mismatched_room_error:
            get_owned_dormitory_room("owner-1", "dorm-001", "room-003")
        self.assertGreaterEqual(mismatched_room_error.exception.status_code, 400)
        self.assertLess(mismatched_room_error.exception.status_code, 500)
