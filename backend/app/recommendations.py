from decimal import Decimal
from typing import Optional, Sequence

from .models import Dormitory, RoomType, SearchResult
from .search import search_dormitories


def _price_distance(
    result: SearchResult,
    min_price: Optional[Decimal],
    max_price: Optional[Decimal],
) -> Optional[Decimal]:
    if result.min_rent is None or result.max_rent is None:
        return None

    if min_price is not None and result.max_rent < min_price:
        return min_price - result.max_rent
    if max_price is not None and result.min_rent > max_price:
        return result.min_rent - max_price
    return Decimal("0")


def recommend_dormitories(
    dormitories: Sequence[Dormitory],
    room_types: Sequence[RoomType],
    query: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
) -> list[SearchResult]:
    # รองรับ FR-DOR-07, CON-BUS-01 และ ASM-05
    normalized_query = query.strip().casefold() if query else ""
    has_price_criteria = min_price is not None or max_price is not None
    if not normalized_query and not has_price_criteria:
        return []

    dormitories_by_id = {dormitory.id: dormitory for dormitory in dormitories}
    public_results = search_dormitories(dormitories, room_types)
    ranked_results: list[tuple[int, Decimal, SearchResult]] = []

    for result in public_results:
        dormitory = dormitories_by_id[result.dormitory_id]
        location_matches = (
            bool(normalized_query)
            and normalized_query == dormitory.location.casefold()
        )
        distance = _price_distance(result, min_price, max_price)

        if not location_matches and (not has_price_criteria or distance is None):
            continue

        ranked_results.append(
            (
                0 if location_matches else 1,
                distance if distance is not None else Decimal("0"),
                result,
            )
        )

    ranked_results.sort(key=lambda item: (item[0], item[1]))
    return [result for _, _, result in ranked_results[:5]]
