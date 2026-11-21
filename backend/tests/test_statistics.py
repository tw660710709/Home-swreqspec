import unittest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app


class DormitoryStatisticsApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=transport, base_url="http://testserver")

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_CON_AUTH_01_statistics_endpoints_reject_unverified_owner_ids(self) -> None:
        endpoints = [
            (
                "/dormitories/dorm-001/statistics",
                {"start_date": "2026-01-01", "end_date": "2026-01-03"},
            ),
            ("/dormitories/dorm-001/room-status", {}),
            (
                "/dormitories/dorm-001/statistics/date-range",
                {"start_date": "2026-01-01", "end_date": "2026-01-03"},
            ),
            (
                "/dormitories/dorm-001/statistics/report",
                {"start_date": "2026-01-01", "end_date": "2026-01-03"},
            ),
        ]
        owner_ids = (None, "owner-1", "forged-owner")

        for path, endpoint_params in endpoints:
            for owner_id in owner_ids:
                params = dict(endpoint_params)
                if owner_id is not None:
                    params["owner_id"] = owner_id

                with self.subTest(path=path, owner_id=owner_id):
                    response = await self.client.get(path, params=params)

                    self.assertEqual(response.status_code, 401)
                    self.assertIn(
                        "ยืนยันตัวตน",
                        response.json()["detail"]["message"],
                    )

    async def test_AC_STAT_02_room_status_uses_database_statuses(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-approved-verified/room-status",
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreater(payload["total_rooms"], 0)
        self.assertEqual(
            payload["vacant_rooms"] + payload["occupied_rooms"],
            payload["total_rooms"],
        )

    async def test_AC_STAT_03_inverted_date_range_is_rejected(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2026-01-10",
                "end_date": "2026-01-09",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("วันที่สิ้นสุด", response.json()["detail"]["message"])

    async def test_AC_STAT_03_inclusive_range_and_single_day_zero_are_filtered(self) -> None:
        range_response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-01-07",
            },
            headers={"X-Owner-Id": "owner-1"},
        )
        zero_response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2026-01-03",
                "end_date": "2026-01-03",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(range_response.status_code, 200)
        range_payload = range_response.json()
        self.assertFalse(range_payload["empty_data"])
        self.assertEqual(range_payload["summary"]["detail_page_views"], 108)
        self.assertEqual(range_payload["summary"]["appointments_count"], 23)

        self.assertEqual(zero_response.status_code, 200)
        zero_payload = zero_response.json()
        self.assertFalse(zero_payload["empty_data"])
        self.assertEqual(zero_payload["summary"]["detail_page_views"], 0)
        self.assertEqual(zero_payload["summary"]["appointments_count"], 0)

    async def test_AC_STAT_03_second_dormitory_uses_its_own_mock_range(self) -> None:
        range_response = await self.client.get(
            "/dormitories/dorm-approved-unverified/statistics",
            params={
                "start_date": "2026-01-03",
                "end_date": "2026-01-07",
            },
            headers={"X-Owner-Id": "owner-1"},
        )
        missing_response = await self.client.get(
            "/dormitories/dorm-approved-unverified/statistics",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-01-02",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(range_response.status_code, 200)
        range_payload = range_response.json()
        self.assertFalse(range_payload["empty_data"])
        self.assertEqual(range_payload["summary"]["detail_page_views"], 20)
        self.assertEqual(range_payload["summary"]["appointments_count"], 3)

        self.assertEqual(missing_response.status_code, 200)
        missing_payload = missing_response.json()
        self.assertTrue(missing_payload["empty_data"])
        self.assertIsNone(missing_payload["summary"]["detail_page_views"])
        self.assertIsNone(missing_payload["summary"]["appointments_count"])

    async def test_AC_STAT_04_empty_range_is_distinct_from_zero_metrics(self) -> None:
        empty_response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2027-01-01",
                "end_date": "2027-01-07",
            },
            headers={"X-Owner-Id": "owner-1"},
        )
        data_response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2026-01-03",
                "end_date": "2026-01-03",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(empty_response.status_code, 200)
        self.assertTrue(empty_response.json()["empty_data"])
        self.assertEqual(empty_response.json()["summary"]["detail_page_views"], None)

        self.assertEqual(data_response.status_code, 200)
        self.assertFalse(data_response.json()["empty_data"])
        self.assertIn("detail_page_views", data_response.json()["summary"])

    async def test_AC_STAT_04_missing_single_day_and_future_are_empty(self) -> None:
        missing_day = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2026-01-09",
                "end_date": "2026-01-09",
            },
            headers={"X-Owner-Id": "owner-1"},
        )
        future = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics",
            params={
                "start_date": "2027-01-01",
                "end_date": "2027-01-01",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        for response in (missing_day, future):
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertTrue(payload["empty_data"])
            self.assertIsNone(payload["summary"]["detail_page_views"])
            self.assertIsNone(payload["summary"]["appointments_count"])

    async def test_AC_STAT_05_report_download_is_csv_for_selected_range(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics/report",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-01-07",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.headers["content-type"])
        self.assertIn("attachment;", response.headers["content-disposition"])
        self.assertIn("2026-01-01", response.text)
        self.assertIn("ผู้เข้าชม", response.text)

    async def test_AC_STAT_05_empty_range_csv_has_no_fake_time_metrics(self) -> None:
        response = await self.client.get(
            "/dormitories/dorm-approved-verified/statistics/report",
            params={
                "start_date": "2027-01-01",
                "end_date": "2027-01-01",
            },
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.headers["content-type"])
        rows = response.text.splitlines()
        self.assertTrue(any("ยังไม่มีข้อมูลสถิติในรอบเวลานี้" in row for row in rows))
        self.assertFalse(any("ผู้เข้าชม" in row for row in rows))
        self.assertFalse(any("การนัดหมาย" in row for row in rows))
        self.assertFalse(any("ห้องว่าง" in row for row in rows))
        self.assertFalse(any("ห้องเต็ม" in row for row in rows))


if __name__ == "__main__":
    unittest.main()
