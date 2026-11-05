import sqlite3
import unittest

from httpx import ASGITransport, AsyncClient

from backend.app.database import get_database_path
from backend.app.main import app


class DormitorySearchApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_AC_DOR_03_empty_search_returns_recommendations(self) -> None:
        search_response = await self.client.get(
            "/dormitories",
            params={"q": "ทำเลที่ไม่มี", "min_price": "6000", "max_price": "7000"},
        )
        recommendation_response = await self.client.get(
            "/dormitories/recommendations",
            params={"q": "ทำเลที่ไม่มี", "min_price": "6000", "max_price": "7000"},
        )

        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(search_response.json(), [])
        self.assertEqual(recommendation_response.status_code, 200)
        recommendations = recommendation_response.json()
        self.assertGreater(len(recommendations), 0)
        self.assertLessEqual(len(recommendations), 5)
        self.assertTrue(
            all(
                result["id"]
                in {"dorm-approved-verified", "dorm-approved-unverified"}
                for result in recommendations
            )
        )
        self.assertEqual(
            recommendations[0],
            {
                "id": "dorm-approved-verified",
                "name": "หอพักตัวอย่าง A",
                "location": "ทำเลตัวอย่าง A",
                "type": "หอพักหญิง",
                "min_rent": "5000",
                "max_rent": "7000",
                "availability_status": "ห้องว่าง",
            },
        )

    async def test_search_endpoint_returns_only_matching_approved_dormitories(
        self,
    ) -> None:
        response = await self.client.get(
            "/dormitories",
            params={"dormitory_type": "หอพักหญิง"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [result["id"] for result in response.json()],
            ["dorm-approved-verified"],
        )

    async def test_AC_DOR_01_search_reads_latest_database_values(self) -> None:
        initial_response = await self.client.get(
            "/dormitories",
            params={"dormitory_type": "หอพักหญิง"},
        )
        self.assertEqual(initial_response.status_code, 200)

        with sqlite3.connect(get_database_path()) as connection:
            connection.execute(
                """
                UPDATE room_types
                SET monthly_rent = ?, availability_status = ?
                WHERE id = ?
                """,
                ("8500", "ห้องเต็ม", "room-a-available"),
            )

        response = await self.client.get(
            "/dormitories",
            params={"dormitory_type": "หอพักหญิง"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": "dorm-approved-verified",
                    "name": "หอพักตัวอย่าง A",
                    "location": "ทำเลตัวอย่าง A",
                    "type": "หอพักหญิง",
                    "min_rent": "7000",
                    "max_rent": "8500",
                    "availability_status": "ห้องเต็ม",
                }
            ],
        )

    async def test_AC_DOR_02_detail_reads_latest_database_values(self) -> None:
        initial_response = await self.client.get(
            "/dormitories/dorm-approved-verified"
        )
        self.assertEqual(initial_response.status_code, 200)

        with sqlite3.connect(get_database_path()) as connection:
            connection.execute(
                "UPDATE room_types SET monthly_rent = ? WHERE id = ?",
                ("8500", "room-a-available"),
            )

        response = await self.client.get("/dormitories/dorm-approved-verified")

        self.assertEqual(response.status_code, 200)
        rooms_by_id = {room["id"]: room for room in response.json()["rooms"]}
        self.assertEqual(
            rooms_by_id["room-a-available"]["monthly_rent"],
            "8500",
        )


if __name__ == "__main__":
    unittest.main()
