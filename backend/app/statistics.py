from __future__ import annotations

import csv
from io import StringIO
from datetime import date

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from .database import load_dormitory_catalog
from .statistics_contract import (
    DateRangeSummary,
    DormitoryStatisticsSummary,
    can_access_dormitory_statistics,
    ensure_dormitory_access,
    validate_statistics_date_range,
)

router = APIRouter()

DORMITORY_OWNERS = {
    "dorm-001": "owner-1",
    "dorm-002": "owner-2",
}


def _parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"message": f"วันที่ไม่ถูกต้อง: {value}. กรุณาใช้รูปแบบ YYYY-MM-DD"},
        ) from exc


def _get_dormitory_owner(dormitory_id: str) -> str:
    owner_id = DORMITORY_OWNERS.get(dormitory_id)
    if owner_id is None:
        raise HTTPException(status_code=404, detail={"message": "ไม่พบหอพักที่ต้องการ"})
    return owner_id


def _coerce_room_status(dormitory_id: str) -> dict[str, int]:
    _, room_types, _, _ = load_dormitory_catalog()
    dormitory_rooms = [
        room for room in room_types if room.dormitory_id == dormitory_id
    ]
    return {
        "total_rooms": len(dormitory_rooms),
        "vacant_rooms": sum(
            room.availability_status == "ห้องว่าง" for room in dormitory_rooms
        ),
        "occupied_rooms": sum(
            room.availability_status == "ห้องเต็ม" for room in dormitory_rooms
        ),
    }


def _get_range_metrics() -> dict[str, int]:
    return {
        "detail_page_views": 0,
        "appointments_count": 0,
    }


def _has_range_data() -> bool:
    return False


@router.get("/dormitories/{dormitory_id}/statistics")
def get_dormitory_statistics(
    dormitory_id: str,
    start_date: str = Query(..., description="วันที่เริ่มต้นแบบ YYYY-MM-DD"),
    end_date: str = Query(..., description="วันที่สิ้นสุดแบบ YYYY-MM-DD"),
    owner_id: str = Query(..., description="เจ้าของหอพักที่ต้องการดู"),
) -> dict:
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    valid, error_message = validate_statistics_date_range(start, end)
    if not valid:
        raise HTTPException(status_code=400, detail={"message": error_message})

    dormitory_owner_id = _get_dormitory_owner(dormitory_id)
    if not can_access_dormitory_statistics(owner_id, dormitory_owner_id):
        raise HTTPException(
            status_code=403,
            detail={"message": "เจ้าของหอพักไม่สามารถเข้าดูข้อมูลสถิติของหอพักที่ไม่ใช่ของตนเองได้"},
        )

    room_status = _coerce_room_status(dormitory_id)
    range_metrics = _get_range_metrics()
    summary = DormitoryStatisticsSummary(
        dormitory_id=dormitory_id,
        owner_id=owner_id,
        total_rooms=room_status["total_rooms"],
        vacant_rooms=room_status["vacant_rooms"],
        occupied_rooms=room_status["occupied_rooms"],
        detail_page_views=range_metrics["detail_page_views"],
        appointments_count=range_metrics["appointments_count"],
        collected_at=end,
    )
    range_summary = DateRangeSummary(
        start_date=start,
        end_date=end,
        detail_page_views=range_metrics["detail_page_views"],
        appointments_count=range_metrics["appointments_count"],
    )
    empty_data = not _has_range_data()
    return {
        "dormitory_id": dormitory_id,
        "owner_id": owner_id,
        "empty_data": empty_data,
        "summary": summary.as_dict(),
        "date_range": range_summary.as_dict(),
    }


@router.get("/dormitories/{dormitory_id}/room-status")
def get_room_status(
    dormitory_id: str,
    owner_id: str = Query(..., description="เจ้าของหอพักที่ต้องการดู"),
) -> dict:
    dormitory_owner_id = _get_dormitory_owner(dormitory_id)
    ensure_dormitory_access(owner_id, dormitory_owner_id)
    room_status = _coerce_room_status(dormitory_id)
    return {
        "dormitory_id": dormitory_id,
        "owner_id": owner_id,
        "room_status": {
            "total_rooms": room_status["total_rooms"],
            "vacant_rooms": room_status["vacant_rooms"],
            "occupied_rooms": room_status["occupied_rooms"],
        },
    }


@router.get("/dormitories/{dormitory_id}/statistics/date-range")
def get_date_range_statistics(
    dormitory_id: str,
    start_date: str = Query(..., description="วันที่เริ่มต้นแบบ YYYY-MM-DD"),
    end_date: str = Query(..., description="วันที่สิ้นสุดแบบ YYYY-MM-DD"),
    owner_id: str = Query(..., description="เจ้าของหอพักที่ต้องการดู"),
) -> dict:
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    valid, error_message = validate_statistics_date_range(start, end)
    if not valid:
        raise HTTPException(status_code=400, detail={"message": error_message})

    dormitory_owner_id = _get_dormitory_owner(dormitory_id)
    ensure_dormitory_access(owner_id, dormitory_owner_id)
    range_metrics = _get_range_metrics()
    return {
        "dormitory_id": dormitory_id,
        "owner_id": owner_id,
        "date_range": {
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "detail_page_views": range_metrics["detail_page_views"],
            "appointments_count": range_metrics["appointments_count"],
        },
    }


@router.get("/dormitories/{dormitory_id}/statistics/report")
def download_dormitory_statistics_report(
    dormitory_id: str,
    start_date: str = Query(..., description="วันที่เริ่มต้นแบบ YYYY-MM-DD"),
    end_date: str = Query(..., description="วันที่สิ้นสุดแบบ YYYY-MM-DD"),
    owner_id: str = Query(..., description="เจ้าของหอพักที่ต้องการดู"),
) -> Response:
    start = _parse_date(start_date)
    end = _parse_date(end_date)
    valid, error_message = validate_statistics_date_range(start, end)
    if not valid:
        raise HTTPException(status_code=400, detail={"message": error_message})

    dormitory_owner_id = _get_dormitory_owner(dormitory_id)
    ensure_dormitory_access(owner_id, dormitory_owner_id)
    room_status = _coerce_room_status(dormitory_id)
    range_metrics = _get_range_metrics()

    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(
        [
            "dormitory_id",
            "start_date",
            "end_date",
            "vacant_rooms",
            "occupied_rooms",
            "detail_page_views",
            "appointments_count",
        ]
    )
    writer.writerow(
        [
            dormitory_id,
            start.isoformat(),
            end.isoformat(),
            room_status["vacant_rooms"],
            room_status["occupied_rooms"],
            range_metrics["detail_page_views"],
            range_metrics["appointments_count"],
        ]
    )

    filename = f"dormitory-statistics-{dormitory_id}-{start.isoformat()}-{end.isoformat()}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
