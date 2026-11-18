from contextlib import closing

from fastapi.testclient import TestClient

import backend.app.repairs as repairs_module
from backend.app.database import _connect, get_database_path
from backend.app.main import app


client = TestClient(app)


def test_TC_REP_04_1_reject_unsupported_file_extension(tmp_path, monkeypatch):
    # Given แนบไฟล์ .pdf
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep04_1.sqlite3"))

    # When ส่งคำขอ POST /api/repairs
    response = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ไฟฟ้า", "description": "ปลั๊กไฟชำรุด"},
        files=[("images", ("manual.pdf", b"%PDF-1.4", "application/pdf"))],
    )

    # Then ปฏิเสธด้วย 400
    assert response.status_code == 400


def test_TC_REP_04_2_reject_oversized_or_too_many_images(tmp_path, monkeypatch):
    # Given แนบไฟล์เกิน 5MB และแนบเกิน 3 รูป
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep04_2.sqlite3"))
    oversized = b"\xff\xd8\xff" + (b"0" * (5 * 1024 * 1024 + 1))

    # When ส่งคำขอทั้ง 2 กรณี
    res_size = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ไฟฟ้า", "description": "ไฟดับ"},
        files=[("images", ("big.jpg", oversized, "image/jpeg"))],
    )
    res_count = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ไฟฟ้า", "description": "ไฟดับ"},
        files=[
            ("images", (f"img_{i}.jpg", b"\xff\xd8\xff123", "image/jpeg"))
            for i in range(4)
        ],
    )

    # Then ปฏิเสธทั้ง 2 กรณี
    assert res_size.status_code == 400
    assert res_count.status_code == 400


def test_TC_REP_04_3_rollback_db_and_cleanup_file_on_save_failure(tmp_path, monkeypatch):
    # Given จำลองข้อผิดพลาดระหว่างบันทึกฐานข้อมูล
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(tmp_path / "rep04_3.sqlite3"))

    def broken_insert(*args, **kwargs):
        raise RuntimeError("Simulated DB failure")

    monkeypatch.setattr(repairs_module, "_insert_repair_records", broken_insert)

    # When ส่งคำขอ POST /api/repairs พร้อมรูปภาพ
    response = client.post(
        "/api/repairs",
        headers={"X-Resident-Id": "resident-1"},
        data={"issue_type": "ประปา", "description": "ท่อน้ำรั่ว"},
        files=[("images", ("leak.jpg", b"\xff\xd8\xffabc", "image/jpeg"))],
    )

    # Then คืน 500 และไม่มีข้อมูลหรือไฟล์ค้างอยู่
    assert response.status_code == 500
    with closing(_connect(get_database_path().resolve())) as conn:
        count = conn.execute("SELECT COUNT(*) FROM repair_requests").fetchone()[0]
        assert count == 0
    images_dir = tmp_path / "repair_images"
    assert not images_dir.exists() or list(images_dir.iterdir()) == []