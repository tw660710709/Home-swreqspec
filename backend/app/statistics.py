from contextlib import closing
from datetime import date
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
import csv
import io

from .database import _connect, get_database_path, initialize_database


router = APIRouter()

DATA_SOURCE = "synthetic_mock"
DATA_SOURCE_NOTE = "ข้อมูลจำลองสำหรับ Prototype; ผู้เข้าชมและการนัดหมายยังไม่มีแหล่งข้อมูลจริง"

# Explicit mock records: each key is one real synthetic activity date.
# Missing dates are intentionally empty; do not generate values for every date.
MOCK_DAILY_STATS = {
    "dorm-approved-verified": {
        date(2026, 1, 1): (10, 2),
        date(2026, 1, 2): (18, 3),
        date(2026, 1, 3): (0, 0),
        date(2026, 1, 4): (14, 1),
        date(2026, 1, 5): (22, 4),
        date(2026, 1, 6): (16, 2),
        date(2026, 1, 7): (28, 11),
    },
    "dorm-approved-unverified": {
        date(2026, 1, 3): (8, 1),
        date(2026, 1, 7): (12, 2),
    },
}


def _require_owner(
    dormitory_id: str,
    owner_id: Optional[str],
) -> str:
    if not owner_id:
        raise HTTPException(
            status_code=401,
            detail={"message": "ยังไม่สามารถยืนยันตัวตนและสิทธิ์เจ้าของหอพักได้"},
        )

    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        row = connection.execute(
            """
            SELECT owner_id
            FROM owner_dormitories
            WHERE dormitory_id = ?
            """,
            (dormitory_id,),
        ).fetchone()

    if row is not None:
        actual_owner_id = row["owner_id"]
    elif dormitory_id in {
        "dorm-approved-verified",
        "dorm-approved-unverified",
    }:
        actual_owner_id = "owner-1"
    else:
        raise HTTPException(status_code=404, detail={"message": "ไม่พบหอพัก"})

    if owner_id != actual_owner_id:
        raise HTTPException(
            status_code=403,
            detail={"message": "ไม่สามารถดูสถิติหอพักที่ไม่ใช่ของเจ้าของตนเองได้"},
        )
    return owner_id


def _validate_range(start_date: date, end_date: date) -> None:
    if end_date < start_date:
        raise HTTPException(
            status_code=422,
            detail={"message": "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น"},
        )


def _room_status(dormitory_id: str) -> dict[str, object]:
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        rows = connection.execute(
            """
            SELECT availability_status
            FROM room_types
            WHERE dormitory_id = ?
            """,
            (dormitory_id,),
        ).fetchall()

    vacant = sum(row["availability_status"] == "ห้องว่าง" for row in rows)
    occupied = sum(row["availability_status"] == "ห้องเต็ม" for row in rows)
    return {
        "dormitory_id": dormitory_id,
        "total_rooms": len(rows),
        "vacant_rooms": vacant,
        "occupied_rooms": occupied,
        "status_labels": {"ห้องว่าง": vacant, "ห้องเต็ม": occupied},
    }


def _date_range_summary(
    dormitory_id: str,
    start_date: date,
    end_date: date,
) -> dict[str, object]:
    daily_stats = MOCK_DAILY_STATS.get(dormitory_id, {})
    matching_days = [
        (day, metrics)
        for day, metrics in daily_stats.items()
        if start_date <= day <= end_date
    ]
    if not matching_days:
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "detail_page_views": None,
            "appointments_count": None,
            "empty_data": True,
        }

    detail_page_views = 0
    appointments = 0
    for _day, (views, appointment_count) in matching_days:
        detail_page_views += views
        appointments += appointment_count

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "detail_page_views": detail_page_views,
        "appointments_count": appointments,
        "empty_data": False,
    }


def _build_statistics(
    dormitory_id: str,
    owner_id: str,
    start_date: date,
    end_date: date,
) -> dict[str, object]:
    room_status = _room_status(dormitory_id)
    date_range = _date_range_summary(dormitory_id, start_date, end_date)
    empty_data = bool(date_range["empty_data"])
    summary = {
        "dormitory_id": dormitory_id,
        "owner_id": owner_id,
        **room_status,
        "detail_page_views": date_range["detail_page_views"],
        "appointments_count": date_range["appointments_count"],
        "collected_at": date.today().isoformat(),
    }
    return {
        "empty_data": empty_data,
        "data_source": DATA_SOURCE,
        "data_source_note": DATA_SOURCE_NOTE,
        "summary": summary,
        "date_range": date_range,
    }


@router.get("/dormitories/{dormitory_id}/statistics")
def get_dormitory_statistics(
    dormitory_id: str,
    start_date: date = Query(..., alias="start_date"),
    end_date: date = Query(..., alias="end_date"),
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> dict[str, object]:
    owner_id = _require_owner(dormitory_id, x_owner_id)
    _validate_range(start_date, end_date)
    return _build_statistics(dormitory_id, owner_id, start_date, end_date)


@router.get("/dormitories/{dormitory_id}/room-status")
def get_room_status(
    dormitory_id: str,
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> dict[str, object]:
    _require_owner(dormitory_id, x_owner_id)
    return _room_status(dormitory_id)


@router.get("/dormitories/{dormitory_id}/statistics/date-range")
def get_date_range_statistics(
    dormitory_id: str,
    start_date: date = Query(..., alias="start_date"),
    end_date: date = Query(..., alias="end_date"),
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> dict[str, object]:
    owner_id = _require_owner(dormitory_id, x_owner_id)
    _validate_range(start_date, end_date)
    return _date_range_summary(dormitory_id, start_date, end_date)


@router.get("/dormitories/{dormitory_id}/statistics/report")
def download_dormitory_statistics_report(
    dormitory_id: str,
    start_date: date = Query(..., alias="start_date"),
    end_date: date = Query(..., alias="end_date"),
    x_owner_id: Optional[str] = Header(default=None, alias="X-Owner-Id"),
) -> StreamingResponse:
    owner_id = _require_owner(dormitory_id, x_owner_id)
    _validate_range(start_date, end_date)
    result = _build_statistics(dormitory_id, owner_id, start_date, end_date)
    summary = result["summary"]
    date_range = result["date_range"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["dormitory_id", "start_date", "end_date", "metric", "value", "data_source"])
    if bool(date_range["empty_data"]):
        writer.writerow([
            dormitory_id,
            start_date.isoformat(),
            end_date.isoformat(),
            "ยังไม่มีข้อมูลสถิติในรอบเวลานี้",
            "",
            DATA_SOURCE,
        ])
        output.seek(0)
        filename = f"dormitory-statistics-{dormitory_id}-{start_date.isoformat()}-{end_date.isoformat()}.csv"
        return StreamingResponse(
            iter([output.getvalue().encode("utf-8-sig")]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    for metric, value in (
        ("จำนวนห้องทั้งหมด", summary["total_rooms"]),
        ("ห้องว่าง", summary["vacant_rooms"]),
        ("ห้องเต็ม", summary["occupied_rooms"]),
        ("ผู้เข้าชม", date_range["detail_page_views"]),
        ("การนัดหมาย", date_range["appointments_count"]),
    ):
        writer.writerow([
            dormitory_id,
            start_date.isoformat(),
            end_date.isoformat(),
            metric,
            "" if value is None else value,
            DATA_SOURCE,
        ])

    output.seek(0)
    filename = f"dormitory-statistics-{dormitory_id}-{start_date.isoformat()}-{end_date.isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
