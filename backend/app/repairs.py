import logging
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from .config import (
    ALLOWED_REPAIR_IMAGE_EXTENSIONS,
    ALLOWED_REPAIR_IMAGE_MIME_TYPES,
    MAX_REPAIR_IMAGE_SIZE_BYTES,
    MAX_REPAIR_IMAGES_PER_REQUEST,
    REPAIR_DEFAULT_STATUS,
    REPAIR_DESC_MAX_LENGTH,
    REPAIR_DESC_MIN_LENGTH,
    REPAIR_ISSUE_TYPES,
)
from .database import _connect, get_database_path, initialize_database


logger = logging.getLogger(__name__)
router = APIRouter()


def get_repair_images_dir() -> Path:
    # รองรับ NFR-SEC-01 (จัดเก็บไฟล์นอก static public folder)
    return get_database_path().resolve().parent / "repair_images"


def get_current_resident(
    x_resident_id: Optional[str] = Header(default=None, alias="X-Resident-Id"),
) -> dict[str, str]:
    # รองรับ CON-SYS-01, ASM-01 และ ASM-05
    if x_resident_id is None or not x_resident_id.strip():
        raise HTTPException(
            status_code=401,
            detail="กรุณาเข้าสู่ระบบในฐานะผู้พักอาศัยก่อนแจ้งซ่อม",
        )
    resident_id = x_resident_id.strip()
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        row = connection.execute(
            """
            SELECT resident_id, room_id, dormitory_id, room_number
            FROM resident_rooms
            WHERE resident_id = ?
            """,
            (resident_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=403,
            detail="ไม่มีสิทธิ์เป็นผู้พักอาศัยของห้องพักในระบบ",
        )
    return {
        "resident_id": row["resident_id"],
        "room_id": row["room_id"],
        "dormitory_id": row["dormitory_id"],
        "room_number": row["room_number"],
    }


def _validate_repair_inputs(issue_type: str, description: str) -> tuple[str, str]:
    # รองรับ FR-REP-01, FR-REP-04 และ ASM-06
    clean_issue_type = (issue_type or "").strip()
    clean_description = (description or "").strip()
    errors: dict[str, str] = {}

    if not clean_issue_type:
        errors["issue_type"] = "กรุณาเลือกประเภทปัญหา"
    elif clean_issue_type not in REPAIR_ISSUE_TYPES:
        errors["issue_type"] = "ประเภทปัญหาไม่ถูกต้อง"

    if len(clean_description) < REPAIR_DESC_MIN_LENGTH:
        errors["description"] = "กรุณากรอกรายละเอียดปัญหา"
    elif len(clean_description) > REPAIR_DESC_MAX_LENGTH:
        errors["description"] = (
            f"รายละเอียดปัญหาต้องไม่เกิน {REPAIR_DESC_MAX_LENGTH} ตัวอักษร"
        )

    if errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "ข้อมูลการแจ้งซ่อมไม่ครบถ้วนหรือไม่ถูกต้อง", "errors": errors},
        )
    return clean_issue_type, clean_description


async def _validate_and_read_images(
    images: list[UploadFile],
) -> list[dict[str, object]]:
    # รองรับ FR-REP-02, FR-REP-05 และ ASM-03
    valid_uploads = [img for img in images if img and img.filename and img.filename.strip()]
    if len(valid_uploads) > MAX_REPAIR_IMAGES_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"แนบรูปภาพได้สูงสุดไม่เกิน {MAX_REPAIR_IMAGES_PER_REQUEST} รูปต่อรายการ",
        )

    prepared: list[dict[str, object]] = []
    for upload in valid_uploads:
        original_name = Path(upload.filename).name
        ext = Path(original_name).suffix.lower()
        content_type = (upload.content_type or "").lower()
        if (
            ext not in ALLOWED_REPAIR_IMAGE_EXTENSIONS
            or content_type not in ALLOWED_REPAIR_IMAGE_MIME_TYPES
        ):
            raise HTTPException(
                status_code=400,
                detail="รองรับเฉพาะไฟล์รูปภาพนามสกุล .jpg, .jpeg หรือ .png เท่านั้น",
            )

        data = await upload.read()
        size = len(data)
        if size == 0 or size > MAX_REPAIR_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail="ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB ต่อไฟล์",
            )

        image_id = str(uuid4())
        stored_name = f"{image_id}{ext}"
        prepared.append(
            {
                "id": image_id,
                "file_name": stored_name,
                "original_filename": original_name,
                "mime_type": content_type,
                "file_size": size,
                "content": data,
            }
        )
    return prepared


def _insert_repair_records(
    connection: sqlite3.Connection,
    repair_id: str,
    resident: dict[str, str],
    issue_type: str,
    description: str,
    status: str,
    created_at: str,
    prepared_images: list[dict[str, object]],
) -> None:
    # รองรับ FR-REP-06 และ ASM-08
    connection.execute(
        """
        INSERT INTO repair_requests (
            id, resident_id, room_id, issue_type, description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            repair_id,
            resident["resident_id"],
            resident["room_id"],
            issue_type,
            description,
            status,
            created_at,
        ),
    )
    for img in prepared_images:
        connection.execute(
            """
            INSERT INTO repair_images (
                id, repair_request_id, file_name, original_filename,
                mime_type, file_size, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                img["id"],
                repair_id,
                img["file_name"],
                img["original_filename"],
                img["mime_type"],
                img["file_size"],
                created_at,
            ),
        )


def _serialize_repair_request(
    connection: sqlite3.Connection,
    row: sqlite3.Row,
) -> dict[str, object]:
    image_rows = connection.execute(
        """
        SELECT id, original_filename, mime_type, file_size, created_at
        FROM repair_images
        WHERE repair_request_id = ?
        ORDER BY rowid
        """,
        (row["id"],),
    ).fetchall()
    return {
        "id": row["id"],
        "resident_id": row["resident_id"],
        "room_id": row["room_id"],
        "issue_type": row["issue_type"],
        "description": row["description"],
        "status": row["status"],
        "created_at": row["created_at"],
        "images": [
            {
                "id": img["id"],
                "original_filename": img["original_filename"],
                "mime_type": img["mime_type"],
                "file_size": img["file_size"],
                "url": f"/api/repairs/{row['id']}/images/{img['id']}",
            }
            for img in image_rows
        ],
    }


@router.post("/api/repairs", status_code=201)
async def create_repair_request(
    issue_type: str = Form(default=""),
    description: str = Form(default=""),
    images: list[UploadFile] = File(default=[]),
    resident: dict[str, str] = Depends(get_current_resident),
) -> dict[str, object]:
    # รองรับ FR-REP-01 ถึง FR-REP-06, CON-SYS-01, NFR-SEC-01, ASM-01 ถึง ASM-08
    clean_issue_type, clean_description = _validate_repair_inputs(issue_type, description)
    prepared_images = await _validate_and_read_images(images)

    repair_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    status = REPAIR_DEFAULT_STATUS
    written_paths: list[Path] = []
    images_dir = get_repair_images_dir()

    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        try:
            if prepared_images:
                images_dir.mkdir(parents=True, exist_ok=True)
                for img in prepared_images:
                    target_path = images_dir / str(img["file_name"])
                    target_path.write_bytes(bytes(img["content"]))
                    written_paths.append(target_path)

            connection.execute("BEGIN IMMEDIATE")
            _insert_repair_records(
                connection=connection,
                repair_id=repair_id,
                resident=resident,
                issue_type=clean_issue_type,
                description=clean_description,
                status=status,
                created_at=created_at,
                prepared_images=prepared_images,
            )
            connection.commit()

            saved_row = connection.execute(
                "SELECT * FROM repair_requests WHERE id = ?",
                (repair_id,),
            ).fetchone()
            return _serialize_repair_request(connection, saved_row)
        except Exception as error:
            connection.rollback()
            for path in written_paths:
                if path.exists():
                    path.unlink(missing_ok=True)
            if isinstance(error, HTTPException):
                raise
            logger.exception("Failed to persist repair request")
            raise HTTPException(
                status_code=500,
                detail="ไม่สามารถบันทึกข้อมูลการแจ้งซ่อมได้ กรุณาลองใหม่อีกครั้ง",
            ) from error


@router.get("/api/repairs")
def list_room_repair_requests(
    resident: dict[str, str] = Depends(get_current_resident),
) -> list[dict[str, object]]:
    # รองรับ FR-REP-06, CON-SYS-01 และ ASM-07
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        rows = connection.execute(
            """
            SELECT * FROM repair_requests
            WHERE room_id = ?
            ORDER BY created_at DESC, rowid DESC
            """,
            (resident["room_id"],),
        ).fetchall()
        return [_serialize_repair_request(connection, row) for row in rows]


@router.get("/api/repairs/{repair_id}/images/{image_id}")
def get_repair_image(
    repair_id: str,
    image_id: str,
    request: Request,
    x_resident_id: Optional[str] = Header(default=None, alias="X-Resident-Id"),
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> FileResponse:
    # รองรับ FR-REP-02, NFR-SEC-01 และ AC-REP-02
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        row = connection.execute(
            """
            SELECT ri.id, ri.file_name, ri.mime_type,
                   rr.resident_id, rr.room_id, res.dormitory_id
            FROM repair_images AS ri
            JOIN repair_requests AS rr ON rr.id = ri.repair_request_id
            LEFT JOIN resident_rooms AS res ON res.resident_id = rr.resident_id
            WHERE ri.id = ? AND ri.repair_request_id = ?
            """,
            (image_id, repair_id),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="ไม่พบรูปภาพประกอบการแจ้งซ่อม")

        principal = getattr(request.state, "principal", None)
        is_admin = isinstance(principal, dict) and principal.get("role") == "Admin"
        is_reporting_resident = (
            bool(x_resident_id) and x_resident_id.strip() == row["resident_id"]
        )
        is_dorm_owner = False
        if x_owner_id and x_owner_id.strip() and row["dormitory_id"]:
            owner_row = connection.execute(
                """
                SELECT 1 FROM owner_dormitories
                WHERE dormitory_id = ? AND owner_id = ?
                """,
                (row["dormitory_id"], x_owner_id.strip()),
            ).fetchone()
            is_dorm_owner = owner_row is not None

        if not (is_admin or is_reporting_resident or is_dorm_owner):
            if not (is_admin or x_resident_id or x_owner_id):
                raise HTTPException(status_code=401, detail="กรุณายืนยันตัวตนก่อนเข้าดูรูปภาพ")
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์เข้าถึงรูปภาพรายการแจ้งซ่อมนี้")

    image_path = get_repair_images_dir() / row["file_name"]
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์รูปภาพบนเซิร์ฟเวอร์")
    return FileResponse(image_path, media_type=row["mime_type"])