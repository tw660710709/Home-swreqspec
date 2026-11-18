from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_TC_REP_01_1_submit_valid_repair_request(tmp_path, monkeypatch):
    # Given ผู้ใช้มีสิทธิ์ Resident ของห้อง 101 เลือกประเภทปัญหา "ไฟฟ้า" และกรอกรายละเอียด
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep01.sqlite3"))

    # When ส่งคำขอ POST /api/repairs
    response = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ไฟฟ้า", "description": "หลอดไฟเพดานห้องน้ำเสีย"},
    )

    # Then ตอบกลับ 201 Created, สถานะ Pending และผูกกับ resident_id และ room_id ถูกต้อง
    assert response.status_code == 201
    body = response.json()
    assert body["resident_id"] == "resident-1"
    assert body["room_id"] == "room-101"
    assert body["issue_type"] == "ไฟฟ้า"
    assert body["description"] == "หลอดไฟเพดานห้องน้ำเสีย"
    assert body["status"] == "Pending"

    list_res = client.get("/api/repairs", headers={"X-Resident-Id": "resident-1"})
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


def test_TC_REP_01_3_boundary_description_length_valid(tmp_path, monkeypatch):
    # Given รายละเอียดความยาว 1 ตัวอักษร และ 1,000 ตัวอักษร
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep01_bound.sqlite3"))

    # When ส่งคำขอ POST /api/repairs ทั้ง 2 กรณี
    res_min = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ประปา", "description": "ก"},
    )
    res_max = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ประปา", "description": "ข" * 1000},
    )

    # Then บันทึกสำเร็จทั้ง 2 กรณี
    assert res_min.status_code == 201
    assert res_max.status_code == 201


def test_TC_REP_01_4_reject_unauthenticated_or_non_resident(tmp_path, monkeypatch):
    # Given ผู้ใช้ไม่มี Header X-Resident-Id หรือส่งรหัสที่ไม่มีสิทธิ์
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep01_auth.sqlite3"))

    # When พยายามส่งคำขอ POST และ GET /api/repairs
    res_no_header = client.post(
        "/api/repairs",
        data={"issue_type": "ไฟฟ้า", "description": "ไฟดับ"},
    )
    res_invalid_user = client.get(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-unknown"},
    )

    # Then ปฏิเสธด้วย 401 และ 403
    assert res_no_header.status_code == 401
    assert res_invalid_user.status_code == 403