import asyncio
import math
import socket
import time
import unittest

import uvicorn
from httpx import AsyncClient

from backend.app.main import app


REQUEST_COUNT = 100
MAX_P95_SECONDS = 3.0


def percentile_95(durations: list[float]) -> float:
    # รองรับ AC-DOR-06 และ NFR-PERF-01
    ordered_durations = sorted(durations)
    percentile_index = math.ceil(0.95 * len(ordered_durations)) - 1
    return ordered_durations[percentile_index]


class DormitoryApiPerformanceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind(("127.0.0.1", 0))
        self.server_socket.listen()
        self.server_socket.setblocking(False)
        port = self.server_socket.getsockname()[1]

        self.server = uvicorn.Server(
            uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error")
        )
        self.server_task = asyncio.create_task(
            self.server.serve(sockets=[self.server_socket])
        )
        for _ in range(500):
            if self.server.started:
                break
            if self.server_task.done():
                await self.server_task
                break
            await asyncio.sleep(0.01)
        if not self.server.started:
            self.server.should_exit = True
            await self.server_task
            self.server_socket.close()
            raise RuntimeError("Performance test server did not start")

        self.client = AsyncClient(
            base_url=f"http://127.0.0.1:{port}",
            timeout=10.0,
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()
        self.server.should_exit = True
        try:
            await self.server_task
        finally:
            self.server_socket.close()

    async def measure_requests(self, path: str) -> list[float]:
        durations = []
        for _ in range(REQUEST_COUNT):
            started_at = time.perf_counter()
            response = await self.client.get(path)
            durations.append(time.perf_counter() - started_at)
            self.assertEqual(response.status_code, 200)
        return durations

    async def test_AC_DOR_06_search_and_detail_p95_under_three_seconds(
        self,
    ) -> None:
        # รองรับ AC-DOR-06 และ NFR-PERF-01
        search_durations = await self.measure_requests("/dormitories")
        detail_durations = await self.measure_requests(
            "/dormitories/dorm-approved-verified"
        )

        search_p95 = percentile_95(search_durations)
        detail_p95 = percentile_95(detail_durations)
        self.assertLessEqual(search_p95, MAX_P95_SECONDS)
        self.assertLessEqual(detail_p95, MAX_P95_SECONDS)


if __name__ == "__main__":
    unittest.main()
