import json
import os
import sqlite3
import threading
from contextlib import closing
from decimal import Decimal
from pathlib import Path
from typing import Optional, Sequence

from .models import Dormitory, DormitoryImage, Facility, RoomType


SeedData = tuple[
    Sequence[Dormitory],
    Sequence[RoomType],
    Sequence[DormitoryImage],
    Sequence[Facility],
]

_initialized_paths: set[Path] = set()
_initialization_lock = threading.Lock()


def get_database_path() -> Path:
    configured_path = os.environ.get("DORMITORY_DATABASE_PATH")
    if configured_path:
        return Path(configured_path).expanduser()
    return Path(__file__).resolve().parents[1] / "data" / "dormitory.sqlite3"


def _connect(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _create_owner_management_schema(connection: sqlite3.Connection) -> None:
    # รองรับ CON-AUTH-01, CON-DATA-01, CON-FILE-01, FR-DOR-12,
    # NFR-DATA-02 และ AC-DOR-12
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS owner_dormitories (
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
        CREATE TABLE IF NOT EXISTS owner_dormitory_rooms (
            room_id TEXT PRIMARY KEY,
            dormitory_id TEXT NOT NULL
                REFERENCES owner_dormitories(dormitory_id),
            monthly_rent TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS owner_dormitory_images (
            image_id TEXT PRIMARY KEY,
            dormitory_id TEXT REFERENCES owner_dormitories(dormitory_id),
            room_id TEXT REFERENCES owner_dormitory_rooms(room_id),
            file_type TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL,
            approval_status TEXT NOT NULL DEFAULT 'Pending',
            CHECK (
                (dormitory_id IS NOT NULL AND room_id IS NULL)
                OR (dormitory_id IS NULL AND room_id IS NOT NULL)
            )
        );
        """
    )
    image_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(owner_dormitory_images)")
    }
    if "approval_status" not in image_columns:
        connection.execute(
            """
            ALTER TABLE owner_dormitory_images
            ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'Pending'
            """
        )
        connection.execute(
            """
            UPDATE owner_dormitory_images
            SET approval_status = COALESCE(
                (
                    SELECT dormitory.approval_status
                    FROM owner_dormitories AS dormitory
                    WHERE dormitory.dormitory_id =
                          owner_dormitory_images.dormitory_id
                ),
                (
                    SELECT dormitory.approval_status
                    FROM owner_dormitory_rooms AS room
                    JOIN owner_dormitories AS dormitory
                      ON dormitory.dormitory_id = room.dormitory_id
                    WHERE room.room_id = owner_dormitory_images.room_id
                ),
                'Pending'
            )
            """
        )
    connection.commit()


def _default_seed_data() -> SeedData:
    from .fixtures import (
        DORMITORY_FIXTURES,
        DORMITORY_IMAGE_FIXTURES,
        FACILITY_FIXTURES,
        ROOM_TYPE_FIXTURES,
    )

    return (
        DORMITORY_FIXTURES,
        ROOM_TYPE_FIXTURES,
        DORMITORY_IMAGE_FIXTURES,
        FACILITY_FIXTURES,
    )


def _create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS database_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS dormitories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            type TEXT NOT NULL,
            approval_status TEXT NOT NULL,
            verified_status INTEGER NOT NULL,
            security_info TEXT NOT NULL,
            contact_info TEXT NOT NULL,
            rules TEXT NOT NULL,
            amenities TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS room_types (
            id TEXT PRIMARY KEY,
            dormitory_id TEXT NOT NULL REFERENCES dormitories(id),
            name TEXT NOT NULL,
            monthly_rent TEXT NOT NULL,
            water_fee TEXT NOT NULL,
            electricity_fee TEXT NOT NULL,
            deposit TEXT NOT NULL,
            availability_status TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS dormitory_images (
            id TEXT PRIMARY KEY,
            dormitory_id TEXT NOT NULL REFERENCES dormitories(id),
            url TEXT NOT NULL,
            caption TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS facilities (
            id TEXT PRIMARY KEY,
            dormitory_id TEXT NOT NULL REFERENCES dormitories(id),
            name TEXT NOT NULL,
            distance_text TEXT NOT NULL
        );
        """
    )
    _create_owner_management_schema(connection)


def _seed_database(connection: sqlite3.Connection, seed_data: SeedData) -> None:
    dormitories, room_types, images, facilities = seed_data
    connection.executemany(
        """
        INSERT INTO dormitories (
            id, name, location, type, approval_status, verified_status,
            security_info, contact_info, rules, amenities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                dorm.id,
                dorm.name,
                dorm.location,
                dorm.type,
                dorm.approval_status,
                int(dorm.verified_status),
                dorm.security_info,
                dorm.contact_info,
                dorm.rules,
                json.dumps(dorm.amenities, ensure_ascii=False),
            )
            for dorm in dormitories
        ],
    )
    connection.executemany(
        """
        INSERT INTO room_types (
            id, dormitory_id, name, monthly_rent, water_fee,
            electricity_fee, deposit, availability_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                room.id,
                room.dormitory_id,
                room.name,
                str(room.monthly_rent),
                str(room.water_fee),
                str(room.electricity_fee),
                str(room.deposit),
                room.availability_status,
            )
            for room in room_types
        ],
    )
    connection.executemany(
        """
        INSERT INTO dormitory_images (id, dormitory_id, url, caption)
        VALUES (?, ?, ?, ?)
        """,
        [(image.id, image.dormitory_id, image.url, image.caption) for image in images],
    )
    connection.executemany(
        """
        INSERT INTO facilities (id, dormitory_id, name, distance_text)
        VALUES (?, ?, ?, ?)
        """,
        [
            (facility.id, facility.dormitory_id, facility.name, facility.distance_text)
            for facility in facilities
        ],
    )


def initialize_database(seed_data: Optional[SeedData] = None) -> None:
    path = get_database_path().resolve()
    with _initialization_lock:
        if path in _initialized_paths and path.exists():
            return

        path.parent.mkdir(parents=True, exist_ok=True)
        connection = _connect(path)
        try:
            _create_schema(connection)
            connection.execute("BEGIN IMMEDIATE")
            seeded = connection.execute(
                "SELECT value FROM database_metadata WHERE key = ?",
                ("initial_seed_completed",),
            ).fetchone()
            if seeded is None:
                has_dormitories = connection.execute(
                    "SELECT EXISTS(SELECT 1 FROM dormitories)"
                ).fetchone()[0]
                if not has_dormitories:
                    _seed_database(
                        connection,
                        seed_data if seed_data is not None else _default_seed_data(),
                    )
                connection.execute(
                    """
                    INSERT INTO database_metadata (key, value)
                    VALUES (?, ?)
                    """,
                    ("initial_seed_completed", "true"),
                )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

        _initialized_paths.add(path)


def load_dormitory_catalog(
    seed_data: Optional[SeedData] = None,
) -> SeedData:
    initialize_database(seed_data)
    path = get_database_path().resolve()
    with closing(_connect(path)) as connection:
        dormitories = [
            Dormitory(
                id=row["id"],
                name=row["name"],
                location=row["location"],
                type=row["type"],
                approval_status=row["approval_status"],
                verified_status=bool(row["verified_status"]),
                security_info=row["security_info"],
                contact_info=row["contact_info"],
                rules=row["rules"],
                amenities=json.loads(row["amenities"]),
            )
            for row in connection.execute(
                "SELECT * FROM dormitories ORDER BY rowid"
            )
        ]
        room_types = [
            RoomType(
                id=row["id"],
                dormitory_id=row["dormitory_id"],
                name=row["name"],
                monthly_rent=Decimal(row["monthly_rent"]),
                water_fee=Decimal(row["water_fee"]),
                electricity_fee=Decimal(row["electricity_fee"]),
                deposit=Decimal(row["deposit"]),
                availability_status=row["availability_status"],
            )
            for row in connection.execute("SELECT * FROM room_types ORDER BY rowid")
        ]
        images = [
            DormitoryImage(
                id=row["id"],
                dormitory_id=row["dormitory_id"],
                url=row["url"],
                caption=row["caption"],
            )
            for row in connection.execute(
                "SELECT * FROM dormitory_images ORDER BY rowid"
            )
        ]
        facilities = [
            Facility(
                id=row["id"],
                dormitory_id=row["dormitory_id"],
                name=row["name"],
                distance_text=row["distance_text"],
            )
            for row in connection.execute("SELECT * FROM facilities ORDER BY rowid")
        ]
    return dormitories, room_types, images, facilities
