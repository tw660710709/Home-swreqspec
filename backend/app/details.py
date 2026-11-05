from typing import Sequence

from fastapi import APIRouter, HTTPException

from .database import SeedData, load_dormitory_catalog
from .fixtures import (
    DORMITORY_FIXTURES,
    DORMITORY_IMAGE_FIXTURES,
    FACILITY_FIXTURES,
    ROOM_TYPE_FIXTURES,
)
from .models import Dormitory, DormitoryImage, Facility, RoomType


router = APIRouter()


def _seed_data() -> SeedData:
    return (
        DORMITORY_FIXTURES,
        ROOM_TYPE_FIXTURES,
        DORMITORY_IMAGE_FIXTURES,
        FACILITY_FIXTURES,
    )


def load_dormitory_detail_data(
    dormitory_id: str,
) -> tuple[
    Sequence[Dormitory],
    Sequence[RoomType],
    Sequence[DormitoryImage],
    Sequence[Facility],
]:
    # รองรับ FR-DOR-02, FR-DOR-03, FR-DOR-04, FR-DOR-05 และ FR-DOR-08
    return load_dormitory_catalog(_seed_data())


def build_dormitory_detail(
    dormitory_id: str,
    dormitories: Sequence[Dormitory],
    room_types: Sequence[RoomType],
    images: Sequence[DormitoryImage],
    nearby_facilities: Sequence[Facility],
) -> dict:
    # รองรับ FR-DOR-03, FR-DOR-04, FR-DOR-05, CON-BUS-01, CON-BUS-02, DOM-RULE-01
    dormitory = next(
        (
            item
            for item in dormitories
            if item.id == dormitory_id and item.is_publicly_listable
        ),
        None,
    )
    if dormitory is None:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลหอพัก")

    rooms = [room for room in room_types if room.dormitory_id == dormitory_id]
    dormitory_images = [
        image for image in images if image.dormitory_id == dormitory_id
    ]
    facilities = [
        facility
        for facility in nearby_facilities
        if facility.dormitory_id == dormitory_id
    ]

    return {
        "id": dormitory.id,
        "name": dormitory.name,
        "location": dormitory.location,
        "type": dormitory.type,
        "rooms": [
            {
                "id": room.id,
                "name": room.name,
                "monthly_rent": str(room.monthly_rent),
                "water_fee": str(room.water_fee),
                "electricity_fee": str(room.electricity_fee),
                "deposit": str(room.deposit),
            }
            for room in rooms
        ],
        "amenities": dormitory.amenities,
        "rules": dormitory.rules,
        "security_info": dormitory.security_info,
        "contact_info": dormitory.contact_info,
        "images": [
            {"url": image.url, "caption": image.caption}
            for image in dormitory_images
        ],
        "nearby_places": [
            {"name": facility.name, "distance_text": facility.distance_text}
            for facility in facilities
        ],
        "verified_badge": dormitory.has_verified_badge,
    }


@router.get("/dormitories/{dormitory_id}")
def get_dormitory_detail(dormitory_id: str) -> dict:
    # รองรับ FR-DOR-03, FR-DOR-04, FR-DOR-05, CON-BUS-01, CON-BUS-02, DOM-RULE-01
    dormitories, room_types, images, nearby_facilities = load_dormitory_detail_data(
        dormitory_id
    )
    return build_dormitory_detail(
        dormitory_id,
        dormitories,
        room_types,
        images,
        nearby_facilities,
    )
