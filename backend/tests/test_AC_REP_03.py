from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_TC_REP_03_1_reject_missing_issue_type(tmp_path, monkeypatch):
    # Given ไม่เลือกประเภทปัญหา
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep03_1.sqlite3"))

    # When ส่งคำขอ POST /api/repairs
    response = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "", "description": "แอร์ไม่เย็น"},
    )

    # Then ปฏิเสธคำขอด้วย 422
    assert response.status_code == 422
    assert "issue_type" in response.json()["detail"]["errors"]


def test_TC_REP_03_2_reject_empty_or_overlength_description(tmp_path, monkeypatch):
    # Given รายละเอียดว่าง (0 ตัวอักษร) และยาวเกิน 1,000 ตัวอักษร
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep03_2.sqlite3"))

    # When ส่งคำขอ POST /api/repairs ทั้ง 2 กรณี
    res_empty = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ไฟฟ้า", "description": "   "},
    )
    res_over = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ไฟฟ้า", "description": "ก" * 1001},
    )

    # Then ปฏิเสธคำขอทั้ง 2 กรณี
    assert res_empty.status_code == 422
    assert res_over.status_code == 422