import time
import unittest

from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from test_performance import MAX_P95_SECONDS, REQUEST_COUNT, percentile_95


class DormitoryPerformanceAcceptanceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def measure_requests(self, path: str) -> list[float]:
        durations = []
        for _ in range(REQUEST_COUNT):
            started_at = time.perf_counter()
            response = await self.client.get(path)
            durations.append(time.perf_counter() - started_at)
            self.assertEqual(response.status_code, 200)
        return durations

    async def test_TC_DOR_06_1_search_and_detail_p95_under_three_seconds(
        self,
    ) -> None:
        # Given มีรายการหอพักในระบบ
        # When วัดเวลา response ของการค้นหาและเปิดรายละเอียดแยกกัน
        search_durations = await self.measure_requests("/dormitories")
        detail_durations = await self.measure_requests(
            "/dormitories/dorm-approved-verified"
        )

        # Then p95 ของ API ค้นหาและ API รายละเอียดไม่เกิน 3 วินาที
        self.assertLessEqual(
            percentile_95(search_durations),
            MAX_P95_SECONDS,
        )
        self.assertLessEqual(
            percentile_95(detail_durations),
            MAX_P95_SECONDS,
        )

    async def test_TC_DOR_06_2_p95_at_three_seconds_meets_limit(self) -> None:
        # Given มีรายการหอพักในระบบและผลวัด p95 เท่ากับ 3 วินาที
        durations = [1.0] * 18 + [3.0, 3.0]

        # When ตรวจผล p95 เทียบกับเกณฑ์
        measured_p95 = percentile_95(durations)

        # Then p95 ที่เท่ากับ 3 วินาทีอยู่ในเกณฑ์ผ่าน
        self.assertEqual(measured_p95, 3.0)
        self.assertLessEqual(measured_p95, MAX_P95_SECONDS)


if __name__ == "__main__":
    unittest.main()
