import unittest
import time
from decimal import Decimal
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models import RoomType


class DormitoryStatisticsApiTests(unittest.IsolatedAsyncioTestCase):
    def room_catalog(self) -> tuple[list, list[RoomType], list, list]:
        room_types = [
            RoomType(
                id=f"room-{index}",
                dormitory_id="dorm-001",
                name=f"ห้อง {index}",
                monthly_rent=Decimal("1000"),
                water_fee=Decimal("0"),
                electricity_fee=Decimal("0"),
                deposit=Decimal("0"),
                availability_status="ห้องว่าง" if index < 4 else "ห้องเต็ม",
            )
            for index in range(10)
        ]
        return [], room_types, [], []

    async def asyncSetUp(self) -> None:
        transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=transport, base_url="http://testserver")

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_statistics_endpoint_returns_room_status_and_empty_range(self) -> None:
        with patch(
            "backend.app.statistics.load_dormitory_catalog",
            return_value=self.room_catalog(),
        ):
            response = await self.client.get(
                "/dormitories/dorm-001/statistics",
                params={
                    "start_date": "2026-01-01",
                    "end_date": "2026-01-03",
                    "owner_id": "owner-1",
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["summary"]["total_rooms"], 10)
        self.assertEqual(payload["summary"]["vacant_rooms"], 4)
        self.assertEqual(payload["summary"]["occupied_rooms"], 6)
        self.assertEqual(payload["date_range"]["detail_page_views"], 0)
        self.assertEqual(payload["date_range"]["appointments_count"], 0)
        self.assertTrue(payload["empty_data"])

    async def test_statistics_endpoint_marks_range_without_records_as_empty(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-001/statistics",
            params={
                "start_date": "2026-02-01",
                "end_date": "2026-02-02",
                "owner_id": "owner-1",
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["empty_data"])
        self.assertEqual(payload["date_range"]["detail_page_views"], 0)
        self.assertEqual(payload["date_range"]["appointments_count"], 0)

    async def test_NFR_PERF_01_statistics_endpoint_completes_under_three_seconds(self) -> None:
        started_at = time.perf_counter()
        response = await self.client.get(
            "/dormitories/dorm-001/statistics",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-01-03",
                "owner_id": "owner-1",
            },
        )
        elapsed_seconds = time.perf_counter() - started_at

        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(elapsed_seconds, 3.0)

    async def test_csv_report_includes_selected_range_metrics(self) -> None:
        with patch(
            "backend.app.statistics.load_dormitory_catalog",
            return_value=self.room_catalog(),
        ):
            response = await self.client.get(
                "/dormitories/dorm-001/statistics/report",
                params={
                    "start_date": "2026-01-01",
                    "end_date": "2026-01-03",
                    "owner_id": "owner-1",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.headers["content-type"])
        self.assertIn("attachment;", response.headers["content-disposition"])
        self.assertIn("2026-01-01,2026-01-03,4,6,0,0", response.text)

    async def test_invalid_date_range_is_rejected(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-001/statistics",
            params={
                "start_date": "2026-01-10",
                "end_date": "2026-01-01",
                "owner_id": "owner-1",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("วันที่สิ้นสุด", response.json()["detail"]["message"])

    async def test_other_owner_cannot_access_statistics(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-001/statistics",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-01-03",
                "owner_id": "owner-2",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("เจ้าของหอพัก", response.json()["detail"]["message"])

    async def test_room_status_endpoint_returns_current_counts(self) -> None:
        with patch(
            "backend.app.statistics.load_dormitory_catalog",
            return_value=self.room_catalog(),
        ):
            response = await self.client.get(
                "/dormitories/dorm-001/room-status",
                params={"owner_id": "owner-1"},
            )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["room_status"]["vacant_rooms"], 4)
        self.assertEqual(payload["room_status"]["occupied_rooms"], 6)


if __name__ == "__main__":
    unittest.main()
