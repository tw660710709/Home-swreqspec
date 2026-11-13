from typing import NoReturn

from fastapi import APIRouter, HTTPException


router = APIRouter()


def _require_authenticated_owner() -> NoReturn:
    raise HTTPException(
        status_code=401,
        detail={"message": "ยังไม่สามารถยืนยันตัวตนและสิทธิ์เจ้าของหอพักได้"},
    )


@router.get("/dormitories/{dormitory_id}/statistics")
def get_dormitory_statistics(dormitory_id: str) -> None:
    _require_authenticated_owner()


@router.get("/dormitories/{dormitory_id}/room-status")
def get_room_status(dormitory_id: str) -> None:
    _require_authenticated_owner()


@router.get("/dormitories/{dormitory_id}/statistics/date-range")
def get_date_range_statistics(dormitory_id: str) -> None:
    _require_authenticated_owner()


@router.get("/dormitories/{dormitory_id}/statistics/report")
def download_dormitory_statistics_report(dormitory_id: str) -> None:
    _require_authenticated_owner()
