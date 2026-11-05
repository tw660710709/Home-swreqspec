from decimal import Decimal
from typing import Optional, Sequence

from fastapi import APIRouter

from .database import SeedData, load_dormitory_catalog
from .fixtures import (
    DORMITORY_FIXTURES,
    DORMITORY_IMAGE_FIXTURES,
    FACILITY_FIXTURES,
    ROOM_TYPE_FIXTURES,
)
from .models import Dormitory, SearchResult
from .recommendations import recommend_dormitories
from .search import search_dormitories


router = APIRouter()


def _seed_data() -> SeedData:
    dormitory_ids = {dormitory.id for dormitory in DORMITORY_FIXTURES}
    return (
        DORMITORY_FIXTURES,
        ROOM_TYPE_FIXTURES,
        [
            image
            for image in DORMITORY_IMAGE_FIXTURES
            if image.dormitory_id in dormitory_ids
        ],
        [
            facility
            for facility in FACILITY_FIXTURES
            if facility.dormitory_id in dormitory_ids
        ],
    )


def _serialize_search_results(
    results: list[SearchResult],
    dormitories: Sequence[Dormitory],
) -> list[dict]:
    # รองรับ FR-DOR-01, FR-DOR-02 และ CON-BUS-01
    dormitories_by_id = {dormitory.id: dormitory for dormitory in dormitories}
    return [
        {
            "id": dormitories_by_id[result.dormitory_id].id,
            "name": dormitories_by_id[result.dormitory_id].name,
            "location": dormitories_by_id[result.dormitory_id].location,
            "type": dormitories_by_id[result.dormitory_id].type,
            "min_rent": (
                str(result.min_rent) if result.min_rent is not None else None
            ),
            "max_rent": (
                str(result.max_rent) if result.max_rent is not None else None
            ),
            "availability_status": result.availability_status,
        }
        for result in results
    ]


@router.get("/dormitories/recommendations")
def get_dormitory_recommendations(
    q: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
) -> list[dict]:
    # รองรับ FR-DOR-07, CON-BUS-01 และ ASM-05
    dormitories, room_types, _, _ = load_dormitory_catalog(_seed_data())
    recommendations = recommend_dormitories(
        dormitories,
        room_types,
        query=q,
        min_price=min_price,
        max_price=max_price,
    )
    return _serialize_search_results(recommendations, dormitories)


@router.get("/dormitories")
def get_dormitories(
    q: Optional[str] = None,
    dormitory_type: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
) -> list[dict]:
    # รองรับ FR-DOR-01, FR-DOR-02 และ CON-BUS-01
    dormitories, room_types, _, _ = load_dormitory_catalog(_seed_data())
    results = search_dormitories(
        dormitories,
        room_types,
        query=q,
        dormitory_type=dormitory_type,
        min_price=min_price,
        max_price=max_price,
    )
    return _serialize_search_results(results, dormitories)
