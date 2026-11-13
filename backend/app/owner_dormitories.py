import json
import sqlite3
from contextlib import closing
from decimal import Decimal
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from .config import MAX_IMAGE_SIZE_BYTES, MAX_IMAGES_PER_TARGET
from .database import _connect, get_database_path, initialize_database


router = APIRouter()
# รองรับ DOM-RULE-01 และ FR-DOR-15; ใช้ค่ารออนุมัติจากสถานะที่ระบบเดิมใช้
PENDING_APPROVAL_STATUS = "Pending"


class OwnerDormitoryInput(BaseModel):
    # รองรับ CON-DATA-01, FR-DOR-10, FR-DOR-12, FR-DOR-13 และ FR-DOR-17
    name: str = Field(min_length=1)
    location: str = Field(min_length=1)
    type: str = Field(min_length=1)
    contact_info: str = Field(min_length=1)
    amenities: Optional[list[str]] = None
    rules: Optional[str] = None


class OwnerDormitoryRoomInput(BaseModel):
    # รองรับ CON-DATA-01, FR-DOR-12 และ ASM-16
    monthly_rent: Decimal


def get_current_owner(
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> str:
    # รองรับ CON-ACC-01; ใช้เป็นจุดเดียวสำหรับเปลี่ยนไปใช้ auth ของ 007
    if x_owner_id is None or not x_owner_id.strip():
        raise HTTPException(status_code=401)
    return x_owner_id


def _serialize_dormitory(row: sqlite3.Row) -> dict[str, object]:
    # รองรับ FR-DOR-09, FR-DOR-11 และ FR-DOR-15
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


def _owner_dormitory_values(dormitory: OwnerDormitoryInput) -> tuple[object, ...]:
    # รองรับ CON-DATA-01, FR-DOR-10 และ FR-DOR-12
    return (
        dormitory.name,
        dormitory.location,
        dormitory.type,
        dormitory.contact_info,
        json.dumps(dormitory.amenities, ensure_ascii=False)
        if dormitory.amenities is not None
        else None,
        dormitory.rules,
    )


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
    return _serialize_owner_dormitory_room(row)


def _serialize_owner_dormitory_room(row: sqlite3.Row) -> dict[str, object]:
    # รองรับ CON-AUTH-01, FR-DOR-12 และ ASM-17
    return {
        "room_id": row["room_id"],
        "dormitory_id": row["dormitory_id"],
        "monthly_rent": row["monthly_rent"],
    }


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


@router.post("/owners/dormitories")
def create_owner_dormitory(
    dormitory: OwnerDormitoryInput,
    owner_id: str = Depends(get_current_owner),
) -> dict[str, object]:
    # รองรับ CON-ACC-01, CON-DATA-01, CON-BUS-01, FR-DOR-10 และ FR-DOR-15
    initialize_database()
    dormitory_id = str(uuid4())
    values = _owner_dormitory_values(dormitory)
    with closing(_connect(get_database_path().resolve())) as connection:
        connection.execute(
            """
            INSERT INTO owner_dormitories (
                dormitory_id, owner_id, name, location, type, contact_info,
                approval_status, amenities, rules
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                dormitory_id,
                owner_id,
                *values[:4],
                PENDING_APPROVAL_STATUS,
                *values[4:],
            ),
        )
        connection.commit()
    return get_owned_dormitory(owner_id, dormitory_id)


@router.put("/owners/dormitories/{dormitory_id}")
def update_owner_dormitory(
    dormitory_id: str,
    dormitory: OwnerDormitoryInput,
    owner_id: str = Depends(get_current_owner),
) -> dict[str, object]:
    # รองรับ CON-ACC-01, CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ FR-DOR-15
    initialize_database()
    values = _owner_dormitory_values(dormitory)
    with closing(_connect(get_database_path().resolve())) as connection:
        cursor = connection.execute(
            """
            UPDATE owner_dormitories
            SET name = ?, location = ?, type = ?, contact_info = ?,
                amenities = ?, rules = ?, approval_status = ?
            WHERE dormitory_id = ? AND owner_id = ?
            """,
            (
                *values,
                PENDING_APPROVAL_STATUS,
                dormitory_id,
                owner_id,
            ),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404)
        connection.commit()
    return get_owned_dormitory(owner_id, dormitory_id)


@router.get("/owners/dormitories/{dormitory_id}/rooms")
def list_owner_dormitory_rooms(
    dormitory_id: str,
    owner_id: str = Depends(get_current_owner),
) -> list[dict[str, object]]:
    # รองรับ CON-AUTH-01, FR-DOR-12 และ ASM-17
    get_owned_dormitory(owner_id, dormitory_id)
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        rows = connection.execute(
            """
            SELECT room_id, dormitory_id, monthly_rent
            FROM owner_dormitory_rooms
            WHERE dormitory_id = ?
            ORDER BY room_id
            """,
            (dormitory_id,),
        ).fetchall()
    return [_serialize_owner_dormitory_room(row) for row in rows]


@router.post("/owners/dormitories/{dormitory_id}/rooms")
def create_owner_dormitory_room(
    dormitory_id: str,
    room: OwnerDormitoryRoomInput,
    owner_id: str = Depends(get_current_owner),
) -> dict[str, object]:
    # รองรับ CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-17
    get_owned_dormitory(owner_id, dormitory_id)
    room_id = str(uuid4())
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        connection.execute(
            """
            INSERT INTO owner_dormitory_rooms (room_id, dormitory_id, monthly_rent)
            VALUES (?, ?, ?)
            """,
            (room_id, dormitory_id, str(room.monthly_rent)),
        )
        connection.commit()
    return get_owned_dormitory_room(owner_id, dormitory_id, room_id)


@router.put("/owners/dormitories/{dormitory_id}/rooms/{room_id}")
def update_owner_dormitory_room(
    dormitory_id: str,
    room_id: str,
    room: OwnerDormitoryRoomInput,
    owner_id: str = Depends(get_current_owner),
) -> dict[str, object]:
    # รองรับ CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-17
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        cursor = connection.execute(
            """
            UPDATE owner_dormitory_rooms
            SET monthly_rent = ?
            WHERE room_id = ? AND dormitory_id = ?
              AND EXISTS (
                  SELECT 1
                  FROM owner_dormitories
                  WHERE owner_dormitories.dormitory_id =
                        owner_dormitory_rooms.dormitory_id
                    AND owner_id = ?
              )
            """,
            (str(room.monthly_rent), room_id, dormitory_id, owner_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404)
        connection.commit()
    return get_owned_dormitory_room(owner_id, dormitory_id, room_id)


def _image_file_type(filename: Optional[str], content: bytes) -> Optional[str]:
    # รองรับ CON-FILE-01, FR-DOR-14 และ FR-DOR-18
    extension = Path(filename or "").suffix.lower()
    if extension in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"):
        return extension[1:].upper()
    if extension == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "PNG"
    return None


def _store_owner_image(
    dormitory_id: str,
    room_id: Optional[str],
    file_type: str,
    content: bytes,
) -> Optional[str]:
    # รองรับ CON-AUTH-01, CON-FILE-01, FR-DOR-14, NFR-DATA-02 และ AC-DOR-12
    # local filesystem เป็นการเลือกของทีม
    initialize_database()
    image_id = str(uuid4())
    storage_directory = (
        get_database_path().resolve().parent / "owner_dormitory_images"
    )
    image_path = storage_directory / f"{image_id}.{file_type.lower()}"
    temporary_path = storage_directory / f".{image_id}.tmp"
    with closing(_connect(get_database_path().resolve())) as connection:
        try:
            connection.execute("BEGIN IMMEDIATE")
            if room_id is None:
                image_count = connection.execute(
                    """
                    SELECT COUNT(*) FROM owner_dormitory_images
                    WHERE dormitory_id = ?
                    """,
                    (dormitory_id,),
                ).fetchone()[0]
            else:
                image_count = connection.execute(
                    """
                    SELECT COUNT(*) FROM owner_dormitory_images
                    WHERE room_id = ?
                    """,
                    (room_id,),
                ).fetchone()[0]
            if image_count >= MAX_IMAGES_PER_TARGET:
                connection.rollback()
                return None

            storage_directory.mkdir(parents=True, exist_ok=True)
            with temporary_path.open("xb") as image_file:
                image_file.write(content)
            connection.execute(
                """
                INSERT INTO owner_dormitory_images (
                    image_id, dormitory_id, room_id, file_type, file_size_bytes,
                    approval_status
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    image_id,
                    dormitory_id if room_id is None else None,
                    room_id,
                    file_type,
                    len(content),
                    PENDING_APPROVAL_STATUS,
                ),
            )
            temporary_path.replace(image_path)
            connection.commit()
        except Exception:
            connection.rollback()
            if temporary_path.exists():
                temporary_path.unlink()
            if image_path.exists():
                image_path.unlink()
            raise
    return image_id


async def _upload_owner_images(
    dormitory_id: str,
    room_id: Optional[str],
    files: list[UploadFile],
) -> dict[str, list[dict[str, object]]]:
    # รองรับ CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
    accepted: list[dict[str, object]] = []
    rejected: list[dict[str, object]] = []
    for uploaded_file in files:
        filename = uploaded_file.filename or ""
        try:
            content = await uploaded_file.read(MAX_IMAGE_SIZE_BYTES + 1)
        finally:
            await uploaded_file.close()

        if len(content) > MAX_IMAGE_SIZE_BYTES:
            rejected.append(
                {
                    "filename": filename,
                    "reason": "ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
                }
            )
            continue

        file_type = _image_file_type(filename, content)
        if file_type is None:
            rejected.append(
                {
                    "filename": filename,
                    "reason": "ไฟล์ต้องเป็น JPG, JPEG หรือ PNG และไม่เกิน 5 MB",
                }
            )
            continue

        image_id = _store_owner_image(
            dormitory_id,
            room_id,
            file_type,
            content,
        )
        if image_id is None:
            rejected.append(
                {
                    "filename": filename,
                    "reason": "อัปโหลดได้ไม่เกิน 10 รูป",
                }
            )
            continue
        accepted.append(
            {
                "image_id": image_id,
                "filename": filename,
                "file_type": file_type,
                "file_size_bytes": len(content),
            }
        )

    return {"accepted": accepted, "rejected": rejected}


@router.post("/owners/dormitories/{dormitory_id}/images")
async def upload_owner_dormitory_images(
    dormitory_id: str,
    files: list[UploadFile] = File(...),
    owner_id: str = Depends(get_current_owner),
) -> dict[str, list[dict[str, object]]]:
    # รองรับ CON-AUTH-01, CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
    get_owned_dormitory(owner_id, dormitory_id)
    return await _upload_owner_images(dormitory_id, None, files)


@router.post("/owners/dormitories/{dormitory_id}/rooms/{room_id}/images")
async def upload_owner_room_images(
    dormitory_id: str,
    room_id: str,
    files: list[UploadFile] = File(...),
    owner_id: str = Depends(get_current_owner),
) -> dict[str, list[dict[str, object]]]:
    # รองรับ CON-AUTH-01, FR-DOR-12, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
    get_owned_dormitory_room(owner_id, dormitory_id, room_id)
    return await _upload_owner_images(dormitory_id, room_id, files)
