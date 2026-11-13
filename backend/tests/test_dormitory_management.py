import sqlite3

from backend.app.database import get_database_path, initialize_database


def test_owner_image_approval_migration_inherits_dormitory_status(
    tmp_path,
    monkeypatch,
) -> None:
    # Given database เดิมที่ยังไม่มีสถานะอนุมัติรายรูป
    database_path = tmp_path / "legacy.sqlite3"
    monkeypatch.setenv("DORMITORY_DATABASE_PATH", str(database_path))
    connection = sqlite3.connect(database_path)
    try:
        connection.executescript(
            """
            CREATE TABLE owner_dormitories (
                dormitory_id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                type TEXT NOT NULL,
                contact_info TEXT NOT NULL,
                approval_status TEXT NOT NULL,
                amenities TEXT,
                rules TEXT
            );
            CREATE TABLE owner_dormitory_rooms (
                room_id TEXT PRIMARY KEY,
                dormitory_id TEXT NOT NULL,
                monthly_rent TEXT NOT NULL
            );
            CREATE TABLE owner_dormitory_images (
                image_id TEXT PRIMARY KEY,
                dormitory_id TEXT,
                room_id TEXT,
                file_type TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL
            );
            INSERT INTO owner_dormitories VALUES
                ('approved-dorm', 'owner-1', 'A', 'L', 'T', 'C', 'Approved', NULL, NULL),
                ('pending-dorm', 'owner-2', 'B', 'L', 'T', 'C', 'Pending', NULL, NULL);
            INSERT INTO owner_dormitory_rooms VALUES
                ('pending-room', 'pending-dorm', '5000');
            INSERT INTO owner_dormitory_images VALUES
                ('approved-image', 'approved-dorm', NULL, 'JPG', 10),
                ('pending-image', NULL, 'pending-room', 'PNG', 10);
            """
        )
        connection.commit()
    finally:
        connection.close()

    # When initialize_database upgrades the existing schema
    initialize_database()

    # Then existing images inherit their parent dormitory approval status
    connection = sqlite3.connect(database_path)
    try:
        statuses = dict(
            connection.execute(
                """
                SELECT image_id, approval_status
                FROM owner_dormitory_images
                ORDER BY image_id
                """
            )
        )
        assert statuses == {
            "approved-image": "Approved",
            "pending-image": "Pending",
        }
    finally:
        connection.close()


def test_owner_dormitory_schema_supports_owner_rooms_and_images() -> None:
    # Given มีเจ้าของหอพักสองราย หอพัก ห้องพัก และ metadata รูปภาพที่เชื่อมโยงกัน
    initialize_database()
    connection = sqlite3.connect(get_database_path())
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        room_columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(owner_dormitory_rooms)"
            )
        }
        assert room_columns == {"room_id", "dormitory_id", "monthly_rent"}

        # When บันทึกข้อมูลหอพัก ห้องพัก และรูปภาพของหอพัก/ห้องพัก
        connection.executemany(
            """
            INSERT INTO owner_dormitories (
                dormitory_id, owner_id, name, location, type, contact_info,
                approval_status, amenities, rules
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    "managed-dorm-1",
                    "owner-1",
                    "หอพักตัวอย่าง 1",
                    "ทำเลตัวอย่าง 1",
                    "หอพักรวม",
                    "ติดต่อ owner-1",
                    "Pending",
                    None,
                    None,
                ),
                (
                    "managed-dorm-2",
                    "owner-2",
                    "หอพักตัวอย่าง 2",
                    "ทำเลตัวอย่าง 2",
                    "หอพักหญิง",
                    "ติดต่อ owner-2",
                    "Pending",
                    None,
                    None,
                ),
            ],
        )
        connection.execute(
            """
            INSERT INTO owner_dormitory_rooms (room_id, dormitory_id, monthly_rent)
            VALUES (?, ?, ?)
            """,
            ("managed-room-1", "managed-dorm-1", "5000"),
        )
        connection.executemany(
            """
            INSERT INTO owner_dormitory_images (
                image_id, dormitory_id, room_id, file_type, file_size_bytes
            ) VALUES (?, ?, ?, ?, ?)
            """,
            [
                ("managed-image-1", "managed-dorm-1", None, "JPG", 1024),
                ("managed-image-2", None, "managed-room-1", "PNG", 2048),
            ],
        )
        connection.commit()

        # Then แต่ละห้องเชื่อมกับหอพัก และรูปภาพเชื่อมกับหอพักหรือห้องได้อย่างใดอย่างหนึ่ง
        owner_rows = connection.execute(
            "SELECT dormitory_id, owner_id FROM owner_dormitories ORDER BY owner_id"
        ).fetchall()
        assert [(row[0], row[1]) for row in owner_rows] == [
            ("managed-dorm-1", "owner-1"),
            ("managed-dorm-2", "owner-2"),
        ]
        room = connection.execute(
            """
            SELECT dormitory_id, monthly_rent
            FROM owner_dormitory_rooms
            WHERE room_id = ?
            """,
            ("managed-room-1",),
        ).fetchone()
        assert tuple(room) == ("managed-dorm-1", "5000")
        image_targets = connection.execute(
            """
            SELECT dormitory_id, room_id
            FROM owner_dormitory_images
            ORDER BY image_id
            """
        ).fetchall()
        assert [tuple(row) for row in image_targets] == [
            ("managed-dorm-1", None),
            (None, "managed-room-1"),
        ]
    finally:
        connection.close()
