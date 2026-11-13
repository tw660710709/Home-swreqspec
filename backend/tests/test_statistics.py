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


if __name__ == "__main__":
    unittest.main()
