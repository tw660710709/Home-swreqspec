import json
import logging
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, StringConstraints, field_validator

from .database import _connect, get_database_path, initialize_database
from .owner_dormitories import OwnerDormitoryInput, get_current_owner


logger = logging.getLogger(__name__)
router = APIRouter()

PENDING_STATUSES = ("Pending Review", "Pending")
REASON_ACTIONS = {"Need Revision", "Rejected"}
ReasonText = Annotated[str, StringConstraints(min_length=1, max_length=500)]


class ApprovalInput(BaseModel):
    reason: Optional[str] = None


class ReasonInput(BaseModel):
    reason: ReasonText

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("เหตุผลต้องไม่เป็นข้อความว่าง")
        return value


def get_current_admin(request: Request) -> str:
    # รองรับ FR-ADM-10, CON-ADM-01 และ NFR-SEC-01
    principal = getattr(request.state, "principal", None)
    if principal is None:
        raise HTTPException(
            status_code=503,
            detail="ระบบยืนยันตัวตนและสิทธิ์ Admin ยังไม่พร้อมใช้งาน",
        )
    if not isinstance(principal, dict):
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ Admin")
    admin_id = principal.get("id")
    if principal.get("role") != "Admin" or not isinstance(admin_id, str) or not admin_id:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ Admin")
    return admin_id


def _required_form_fields() -> tuple[str, ...]:
    # รองรับ FR-ADM-03 และ CON-ADM-02 โดยใช้ required fields จากแบบฟอร์ม UC-03
    return tuple(
        name
        for name, field in OwnerDormitoryInput.model_fields.items()
        if field.is_required()
    )


def _serialize_dormitory(row: sqlite3.Row) -> dict[str, object]:
    required_fields = _required_form_fields()
    missing_fields = [
        name
        for name in required_fields
        if row[name] is None or not str(row[name]).strip()
    ]
    return {
        "dormitory_id": row["dormitory_id"],
        "owner_id": row["owner_id"],
        "name": row["name"],
        "location": row["location"],
        "type": row["type"],
        "contact_info": row["contact_info"],
        "amenities": json.loads(row["amenities"]) if row["amenities"] else [],
        "rules": row["rules"],
        "status": (
            "Pending Review"
            if row["approval_status"] in PENDING_STATUSES
            else row["approval_status"]
        ),
        "required_fields": list(required_fields),
        "missing_required_fields": missing_fields,
        "required_fields_complete": not missing_fields,
    }


def _required_fields_complete(row: sqlite3.Row) -> bool:
    return all(
        row[name] is not None and bool(str(row[name]).strip())
        for name in _required_form_fields()
    )


def _get_dormitory(connection: sqlite3.Connection, dormitory_id: str) -> sqlite3.Row:
    row = connection.execute(
        """
        SELECT dormitory_id, owner_id, name, location, type, contact_info,
               approval_status, amenities, rules
        FROM owner_dormitories
        WHERE dormitory_id = ?
        """,
        (dormitory_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลหอพัก")
    return row


def _serialize_document(row: sqlite3.Row, dormitory_id: str) -> dict[str, object]:
    return {
        "document_id": row["image_id"],
        "document_type": row["file_type"],
        "file_size_bytes": row["file_size_bytes"],
        "status": row["approval_status"],
        "file_url": (
            f"/admin/dormitories/{dormitory_id}/documents/{row['image_id']}"
        ),
    }


def _list_dormitory_documents(
    connection: sqlite3.Connection,
    dormitory_id: str,
) -> list[dict[str, object]]:
    rows = connection.execute(
        """
        SELECT image_id, file_type, file_size_bytes, approval_status
        FROM owner_dormitory_images
        WHERE dormitory_id = ? AND room_id IS NULL
        ORDER BY rowid
        """,
        (dormitory_id,),
    ).fetchall()
    return [_serialize_document(row, dormitory_id) for row in rows]


@router.get("/admin/dormitories/pending")
def list_pending_dormitories(
    admin_id: str = Depends(get_current_admin),
) -> list[dict[str, object]]:
    # รองรับ FR-ADM-01 และ AC-ADM-01
    del admin_id
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        rows = connection.execute(
            """
            SELECT dormitory_id, owner_id, name, location, type, contact_info,
                   approval_status, amenities, rules
            FROM owner_dormitories
            WHERE approval_status IN (?, ?)
            ORDER BY dormitory_id
            """,
            PENDING_STATUSES,
        ).fetchall()
    return [_serialize_dormitory(row) for row in rows]


@router.get("/admin/dormitories/{dormitory_id}")
def get_dormitory_for_review(
    dormitory_id: str,
    admin_id: str = Depends(get_current_admin),
) -> dict[str, object]:
    # รองรับ FR-ADM-02, FR-ADM-03 และ AC-ADM-01
    del admin_id
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        dormitory = _serialize_dormitory(_get_dormitory(connection, dormitory_id))
        dormitory["documents"] = _list_dormitory_documents(
            connection,
            dormitory_id,
        )
    return dormitory


@router.get("/admin/dormitories/{dormitory_id}/documents/{image_id}")
def get_dormitory_document(
    dormitory_id: str,
    image_id: str,
    admin_id: str = Depends(get_current_admin),
) -> FileResponse:
    # รองรับ FR-ADM-02 และ NFR-SEC-01
    del admin_id
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        image = connection.execute(
            """
            SELECT image_id, file_type
            FROM owner_dormitory_images
            WHERE image_id = ? AND dormitory_id = ? AND room_id IS NULL
            """,
            (image_id, dormitory_id),
        ).fetchone()
    if image is None:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    media_types = {"JPG": "image/jpeg", "JPEG": "image/jpeg", "PNG": "image/png"}
    media_type = media_types.get(image["file_type"])
    if media_type is None:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    image_path = (
        get_database_path().resolve().parent
        / "owner_dormitory_images"
        / f"{image_id}.{image['file_type'].lower()}"
    )
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    return FileResponse(image_path, media_type=media_type)


def _record_result(
    dormitory_id: str,
    admin_id: str,
    action: str,
    reason: Optional[str],
) -> dict[str, object]:
    # รองรับ FR-ADM-04 ถึง FR-ADM-09, CON-ADM-03, CON-ADM-04,
    # CON-ADM-07, NFR-DATA-01 และ AC-ADM-02 ถึง AC-ADM-05, AC-ADM-08
    if action in REASON_ACTIONS and (
        reason is None
        or not reason.strip()
        or not 1 <= len(reason) <= 500
    ):
        raise HTTPException(
            status_code=422,
            detail="เหตุผลต้องมีความยาว 1–500 ตัวอักษร",
        )

    initialize_database()
    history_id = str(uuid4())
    notification_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    status_text = {
        "Approved": "ได้รับการอนุมัติ",
        "Need Revision": "ต้องแก้ไขข้อมูลหรือเอกสาร",
        "Rejected": "ถูกปฏิเสธ",
    }[action]
    message = f"ผลการตรวจสอบหอพัก: {status_text}"
    if reason:
        message = f"{message} เหตุผล: {reason}"

    with closing(_connect(get_database_path().resolve())) as connection:
        try:
            connection.execute("BEGIN IMMEDIATE")
            dormitory = _get_dormitory(connection, dormitory_id)
            if dormitory["approval_status"] not in PENDING_STATUSES:
                raise HTTPException(
                    status_code=409,
                    detail="หอพักไม่ได้อยู่ในสถานะรอตรวจสอบ",
                )
            if action == "Approved" and not _required_fields_complete(dormitory):
                raise HTTPException(
                    status_code=422,
                    detail="ข้อมูลที่กำหนดเป็น Required ในแบบฟอร์มลงทะเบียนไม่ครบ",
                )

            cursor = connection.execute(
                """
                UPDATE owner_dormitories
                SET approval_status = ?
                WHERE dormitory_id = ? AND approval_status IN (?, ?)
                """,
                (action, dormitory_id, *PENDING_STATUSES),
            )
            if cursor.rowcount != 1:
                raise HTTPException(
                    status_code=409,
                    detail="หอพักไม่ได้อยู่ในสถานะรอตรวจสอบ",
                )
            connection.execute(
                """
                INSERT INTO approval_history (
                    history_id, dormitory_id, admin_id, action, reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (history_id, dormitory_id, admin_id, action, reason, created_at),
            )
            connection.execute(
                """
                INSERT INTO owner_notifications (
                    notification_id, owner_id, dormitory_id, action, message,
                    reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    notification_id,
                    dormitory["owner_id"],
                    dormitory_id,
                    action,
                    message,
                    reason,
                    created_at,
                ),
            )
            connection.commit()
        except HTTPException:
            connection.rollback()
            raise
        except sqlite3.Error as error:
            connection.rollback()
            logger.exception("Could not save dormitory review result")
            raise HTTPException(
                status_code=500,
                detail="ไม่สามารถบันทึกผลการตรวจสอบได้",
            ) from error

    return {
        "dormitory_id": dormitory_id,
        "status": action,
        "history_id": history_id,
        "notification_id": notification_id,
    }


@router.post("/admin/dormitories/{dormitory_id}/approve")
def approve_dormitory(
    dormitory_id: str,
    payload: ApprovalInput = ApprovalInput(),
    admin_id: str = Depends(get_current_admin),
) -> dict[str, object]:
    # รองรับ FR-ADM-03, FR-ADM-04 และ AC-ADM-02, AC-ADM-06, AC-ADM-08
    return _record_result(dormitory_id, admin_id, "Approved", payload.reason)


@router.post("/admin/dormitories/{dormitory_id}/revision")
def request_dormitory_revision(
    dormitory_id: str,
    payload: ReasonInput,
    admin_id: str = Depends(get_current_admin),
) -> dict[str, object]:
    # รองรับ FR-ADM-05, CON-ADM-03 และ AC-ADM-03
    return _record_result(dormitory_id, admin_id, "Need Revision", payload.reason)


@router.post("/admin/dormitories/{dormitory_id}/reject")
def reject_dormitory(
    dormitory_id: str,
    payload: ReasonInput,
    admin_id: str = Depends(get_current_admin),
) -> dict[str, object]:
    # รองรับ FR-ADM-06, CON-ADM-03 และ AC-ADM-04
    return _record_result(dormitory_id, admin_id, "Rejected", payload.reason)


@router.get("/admin/dormitories/{dormitory_id}/history")
def get_dormitory_approval_history(
    dormitory_id: str,
    admin_id: str = Depends(get_current_admin),
) -> list[dict[str, object]]:
    # รองรับ FR-ADM-08, NFR-AUD-01 และ AC-ADM-05
    del admin_id
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        _get_dormitory(connection, dormitory_id)
        rows = connection.execute(
            """
            SELECT history_id, dormitory_id, admin_id, action, reason, created_at
            FROM approval_history
            WHERE dormitory_id = ?
            ORDER BY created_at, rowid
            """,
            (dormitory_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@router.get("/owner/notifications")
def list_owner_notifications(
    owner_id: str = Depends(get_current_owner),
) -> list[dict[str, object]]:
    # รองรับ FR-ADM-09 และ AC-ADM-03, AC-ADM-04
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        rows = connection.execute(
            """
            SELECT notification_id, dormitory_id, action, message, reason,
                   is_read, created_at
            FROM owner_notifications
            WHERE owner_id = ?
            ORDER BY created_at DESC, rowid DESC
            """,
            (owner_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("/owner/dormitories/{dormitory_id}/resubmit-review")
def resubmit_dormitory_for_review(
    dormitory_id: str,
    owner_id: str = Depends(get_current_owner),
) -> dict[str, object]:
    # รองรับ FR-ADM-07, CON-ADM-06, ASM-04, ASM-08
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        try:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE owner_dormitories
                SET approval_status = 'Pending Review'
                WHERE dormitory_id = ? AND owner_id = ?
                  AND approval_status = 'Need Revision'
                """,
                (dormitory_id, owner_id),
            )
            if cursor.rowcount != 1:
                connection.rollback()
                raise HTTPException(
                    status_code=409,
                    detail="หอพักไม่ได้อยู่ในสถานะ Need Revision",
                )
            connection.commit()
        except HTTPException:
            raise
        except sqlite3.Error as error:
            connection.rollback()
            logger.exception("Could not resubmit dormitory for review")
            raise HTTPException(
                status_code=500,
                detail="ไม่สามารถส่งตรวจสอบหอพักใหม่ได้",
            ) from error
    return {"dormitory_id": dormitory_id, "status": "Pending Review"}
