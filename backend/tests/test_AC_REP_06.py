import time

from fastapi.testclient import TestClient

from backend.app.config import REPAIR_API_MAX_RESPONSE_SECONDS
from backend.app.main import app


client = TestClient(app)


def test_TC_REP_06_1_api_response_p95_under_2_seconds(tmp_path, monkeypatch):
    # Given ระบบพร้อมใช้งานและมีสิทธิ์ Resident
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep06.sqlite3"))
    durations: list[float] = []

    # When ส่งคำขอ POST /api/repairs ต่อเนื่อง 20 ครั้ง
    for i in range(20):
        start = time.perf_counter()
        res = client.post(
            "/api/repairs",
            headers={"X-Resident-Id": "resident-1"},
            data={"issue_type": "ไฟฟ้า", "description": f"ทดสอบความเร็วครั้งที่ {i + 1}"},
            files=[("images", ("sample.jpg", b"\xff\xd8\xff12345", "image/jpeg"))],
        )
        elapsed = time.perf_counter() - start
        assert res.status_code == 201
        durations.append(elapsed)

    # Then ค่า p95 ต้องน้อยกว่าหรือเท่ากับ 2.0 วินาที
    durations.sort()
    p95_index = int(0.95 * len(durations)) - 1
    assert durations[p95_index] <= REPAIR_API_MAX_RESPONSE_SECONDS