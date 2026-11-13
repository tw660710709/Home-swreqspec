import json
import sqlite3
from contextlib import closing
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from .database import _connect, get_database_path, initialize_database


router = APIRouter()


def get_current_owner(
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> str:
    # รองรับ CON-ACC-01; ใช้เป็นจุดเดียวสำหรับเปลี่ยนไปใช้ auth ของ 007
    if x_owner_id is None or not x_owner_id.strip():
        raise HTTPException(status_code=401)
    return x_owner_id


def _serialize_dormitory(row: sqlite3.Row) -> dict[str, object]:
    # รองรับ FR-DOR-09 และ FR-DOR-11
    return {
        "dormitory_id": row["dormitory_id"],
        "name": row["name"],
        "location": row["location"],
        "type": row["type"],
        "contact_info": row["contact_info"],
        "approval_status": row["approval_status"],
        "amenities": (
            json.loads(row["amenities"]) if row["amenities"] is not None else None
        ),
        "rules": row["rules"],
    }


def get_owned_dormitory(owner_id: str, dormitory_id: str) -> dict[str, object]:
    # รองรับ CON-AUTH-01, FR-DOR-11 และ NFR-SEC-02
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        row = connection.execute(
            """
            SELECT dormitory_id, name, location, type, contact_info,
                   approval_status, amenities, rules
            FROM owner_dormitories
            WHERE dormitory_id = ? AND owner_id = ?
            """,
            (dormitory_id, owner_id),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404)
    return _serialize_dormitory(row)


def get_owned_dormitory_room(
    owner_id: str,
    dormitory_id: str,
    room_id: str,
) -> dict[str, object]:
    # รองรับ CON-AUTH-01, FR-DOR-12 และ NFR-SEC-02
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        row = connection.execute(
            """
            SELECT room.room_id, room.dormitory_id, room.monthly_rent
            FROM owner_dormitory_rooms AS room
            JOIN owner_dormitories AS dormitory
              ON dormitory.dormitory_id = room.dormitory_id
            WHERE dormitory.owner_id = ?
              AND dormitory.dormitory_id = ?
              AND room.room_id = ?
            """,
            (owner_id, dormitory_id, room_id),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404)
    return dict(row)


@router.get("/owners/dormitories")
def list_owner_dormitories(
    owner_id: str = Depends(get_current_owner),
) -> list[dict[str, object]]:
    # รองรับ CON-ACC-01, CON-AUTH-01 และ FR-DOR-09
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        rows = connection.execute(
            """
            SELECT dormitory_id, name, location, type, contact_info,
                   approval_status, amenities, rules
            FROM owner_dormitories
            WHERE owner_id = ?
            ORDER BY dormitory_id
            """,
            (owner_id,),
        ).fetchall()
    return [_serialize_dormitory(row) for row in rows]


@router.get("/owners/dormitories/{dormitory_id}")
def get_owner_dormitory(
    dormitory_id: str,
    owner_id: str = Depends(get_current_owner),
) -> dict[str, object]:
    # รองรับ CON-ACC-01, CON-AUTH-01 และ FR-DOR-11
    return get_owned_dormitory(owner_id, dormitory_id)
