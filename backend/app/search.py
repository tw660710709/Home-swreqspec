from decimal import Decimal
from typing import Optional, Sequence

from .models import Dormitory, RoomType, SearchResult


def search_dormitories(
    dormitories: Sequence[Dormitory],
    room_types: Sequence[RoomType],
    query: Optional[str] = None,
    dormitory_type: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
) -> list[SearchResult]:
    # รองรับ FR-DOR-01, FR-DOR-02 และ CON-BUS-01
    normalized_query = query.casefold() if query else None
    rooms_by_dormitory: dict[str, list[RoomType]] = {}
    for room in room_types:
        rooms_by_dormitory.setdefault(room.dormitory_id, []).append(room)

    results: list[SearchResult] = []
    for dormitory in dormitories:
        if not dormitory.is_publicly_listable:
            continue

        if dormitory_type is not None and dormitory.type != dormitory_type:
            continue

        if normalized_query is not None:
            searchable_text = f"{dormitory.name} {dormitory.location}".casefold()
            if normalized_query not in searchable_text:
                continue

        rooms = rooms_by_dormitory.get(dormitory.id, [])
        if min_price is not None or max_price is not None:
            if not any(
                (min_price is None or room.monthly_rent >= min_price)
                and (max_price is None or room.monthly_rent <= max_price)
                for room in rooms
            ):
                continue

        rents = [room.monthly_rent for room in rooms]
        if not rooms:
            availability_status = None
        elif any(room.availability_status == "ห้องว่าง" for room in rooms):
            availability_status = "ห้องว่าง"
        else:
            availability_status = "ห้องเต็ม"

        results.append(
            SearchResult(
                dormitory_id=dormitory.id,
                min_rent=min(rents) if rents else None,
                max_rent=max(rents) if rents else None,
                availability_status=availability_status,
            )
        )

    return results
