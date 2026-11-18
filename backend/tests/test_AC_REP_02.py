from contextlib import closing

from fastapi.testclient import TestClient

from backend.app.database import _connect, get_database_path, initialize_database
from backend.app.main import app


client = TestClient(app)


def test_TC_REP_02_1_upload_single_valid_image(tmp_path, monkeypatch):
    # Given ผู้พักอาศัยแนบไฟล์ .jpg ขนาด 1MB จำนวน 1 รูป
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep02_1.sqlite3"))
    fake_jpg = b"\xff\xd8\xff" + (b"0" * (1024 * 1024))

    # When ส่งคำขอ POST /api/repairs
    response = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "เฟอร์นิเจอร์/อุปกรณ์", "description": "บานพับตู้หลุด"},
        files=[("images", ("cabinet.jpg", fake_jpg, "image/jpeg"))],
    )

    # Then บันทึกสำเร็จและเปิดดูรูปภาพได้เมื่อมีสิทธิ์
    assert response.status_code == 201
    body = response.json()
    assert len(body["images"]) == 1
    img_url = body["images"][0]["url"]

    img_res = client.get(img_url, headers={"X-Resident-Id": "resident-1"})
    assert img_res.status_code == 200
    assert img_res.content == fake_jpg


def test_TC_REP_02_2_upload_max_three_images_at_5mb_limit(tmp_path, monkeypatch):
    # Given แนบไฟล์ .png ขนาด 5MB พอดี จำนวน 3 รูปพร้อมกัน
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep02_2.sqlite3"))
    max_png = b"\x89PNG\r\n\x1a\n" + (b"1" * (5 * 1024 * 1024 - 8))
    files = [
        ("images", (f"img_{i}.png", max_png, "image/png"))
        for i in range(3)
    ]

    # When ส่งคำขอ POST /api/repairs
    response = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "อื่นๆ", "description": "ผนังมีรอยร้าว"},
        files=files,
    )

    # Then บันทึกครบทั้ง 3 รูปสำเร็จ
    assert response.status_code == 201
    assert len(response.json()["images"]) == 3


def test_TC_REP_02_3_deny_image_access_for_other_resident(tmp_path, monkeypatch):
    # Given มีรายการแจ้งซ่อมพร้อมรูปภาพของ resident-1 (ห้อง 101)
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep02_3.sqlite3"))
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as conn:
        conn.execute(
            """
            INSERT INTO resident_rooms (resident_id, room_id, dormitory_id, room_number)
            VALUES (?, ?, ?, ?)
            """,
            ("resident-2", "room-102", "dorm-1", "102"),
        )
        conn.commit()

    create_res = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ประปา", "description": "ก๊อกน้ำรั่ว"},
        files=[("images", ("tap.jpg", b"\xff\xd8\xffabc", "image/jpeg"))],
    )
    img_url = create_res.json()["images"][0]["url"]

    # When resident-2 ห้อง 102 พยายามเข้าถึงรูปภาพ
    forbidden_res = client.get(img_url, headers={"X-Resident-Id": "resident-2"})

    # Then ระบบปฏิเสธด้วย 403 Forbidden
    assert forbidden_res.status_code == 403