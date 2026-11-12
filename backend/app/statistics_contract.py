from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass(frozen=True)
class DormitoryStatisticsSummary:
    """Contract สำหรับข้อมูลสรุปสถิติหอพักใน dashboard"""

    dormitory_id: str
    owner_id: str
    total_rooms: int = 0
    vacant_rooms: int = 0
    occupied_rooms: int = 0
    detail_page_views: int = 0
    appointments_count: int = 0
    collected_at: Optional[date] = None

    def as_dict(self) -> dict[str, object]:
        return {
            "dormitory_id": self.dormitory_id,
            "owner_id": self.owner_id,
            "total_rooms": self.total_rooms,
            "vacant_rooms": self.vacant_rooms,
            "occupied_rooms": self.occupied_rooms,
            "detail_page_views": self.detail_page_views,
            "appointments_count": self.appointments_count,
            "collected_at": self.collected_at.isoformat() if self.collected_at else None,
        }


@dataclass(frozen=True)
class RoomStatusSnapshot:
    dormitory_id: str
    total_rooms: int = 0
    vacant_rooms: int = 0
    occupied_rooms: int = 0
    status_labels: dict[str, int] = field(default_factory=dict)

    def as_dict(self) -> dict[str, object]:
        return {
            "dormitory_id": self.dormitory_id,
            "total_rooms": self.total_rooms,
            "vacant_rooms": self.vacant_rooms,
            "occupied_rooms": self.occupied_rooms,
            "status_labels": dict(self.status_labels),
        }


@dataclass(frozen=True)
class DateRangeSummary:
    start_date: date
    end_date: date
    detail_page_views: int = 0
    appointments_count: int = 0

    def as_dict(self) -> dict[str, object]:
        return {
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "detail_page_views": self.detail_page_views,
            "appointments_count": self.appointments_count,
        }


def can_access_dormitory_statistics(current_owner_id: str, dormitory_owner_id: str) -> bool:
    """ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของหอพักเดียวกับข้อมูลที่ต้องการดูหรือไม่."""
    return bool(current_owner_id) and current_owner_id == dormitory_owner_id


def ensure_dormitory_access(current_owner_id: str, dormitory_owner_id: str) -> None:
    if not can_access_dormitory_statistics(current_owner_id, dormitory_owner_id):
        raise PermissionError("เจ้าของหอพักไม่สามารถเข้าดูข้อมูลสถิติของหอพักที่ไม่ใช่ของตนเองได้")


def validate_statistics_date_range(start_date: date, end_date: date) -> tuple[bool, str | None]:
    """Validate วันที่เริ่มต้นและสิ้นสุดของช่วงเวลา: รวมทั้งสองวันที่ในการคำนวณ"""
    if end_date < start_date:
        return False, "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น"
    return True, None
