import json
from contextlib import closing
from pathlib import Path
from typing import Sequence

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from .database import (
    SeedData,
    _connect,
    get_database_path,
    initialize_database,
    load_dormitory_catalog,
)
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
    # รองรับ FR-DOR-02, FR-DOR-03, FR-DOR-04, FR-DOR-05, FR-DOR-08,
    # NFR-DATA-02 และ AC-DOR-12
    catalog = load_dormitory_catalog(_seed_data())
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        owner_dormitory = connection.execute(
            """
            SELECT dormitory_id, name, location, type, contact_info,
                   approval_status, amenities, rules
            FROM owner_dormitories
            WHERE dormitory_id = ?
            """,
            (dormitory_id,),
        ).fetchone()
        if owner_dormitory is None:
            return catalog

        owner_images = connection.execute(
            """
            SELECT image.image_id, image.file_type, image.approval_status
            FROM owner_dormitory_images AS image
            LEFT JOIN owner_dormitory_rooms AS room
              ON room.room_id = image.room_id
            WHERE image.dormitory_id = ? OR room.dormitory_id = ?
            ORDER BY image.rowid
            """,
            (dormitory_id, dormitory_id),
        ).fetchall()

    dormitory = Dormitory(
        id=owner_dormitory["dormitory_id"],
        name=owner_dormitory["name"],
        location=owner_dormitory["location"],
        type=owner_dormitory["type"],
        approval_status=owner_dormitory["approval_status"],
        verified_status=False,
        security_info="",
        contact_info=owner_dormitory["contact_info"],
        rules=owner_dormitory["rules"] or "",
        amenities=(
            json.loads(owner_dormitory["amenities"])
            if owner_dormitory["amenities"]
            else []
        ),
    )
    images = [
        DormitoryImage(
            id=image["image_id"],
            dormitory_id=dormitory_id,
            url=f"/dormitory-images/{image['image_id']}",
            caption="",
            approval_status=image["approval_status"],
        )
        for image in owner_images
    ]
    return (
        [item for item in catalog[0] if item.id != dormitory_id] + [dormitory],
        [room for room in catalog[1] if room.dormitory_id != dormitory_id],
        [image for image in catalog[2] if image.dormitory_id != dormitory_id]
        + images,
        [facility for facility in catalog[3] if facility.dormitory_id != dormitory_id],
    )


def build_dormitory_detail(
    dormitory_id: str,
    dormitories: Sequence[Dormitory],
    room_types: Sequence[RoomType],
    images: Sequence[DormitoryImage],
    nearby_facilities: Sequence[Facility],
) -> dict:
    # รองรับ FR-DOR-03, FR-DOR-04, FR-DOR-05, CON-BUS-01, CON-BUS-02,
    # DOM-RULE-01, NFR-DATA-02 และ AC-DOR-12
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
        image
        for image in images
        if image.dormitory_id == dormitory_id
        and image.approval_status == "Approved"
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


@router.get("/dormitory-images/{image_id}")
def get_approved_dormitory_image(image_id: str) -> FileResponse:
    # รองรับ NFR-DATA-02 และ AC-DOR-12
    initialize_database()
    with closing(_connect(get_database_path().resolve())) as connection:
        image = connection.execute(
            """
            SELECT owner_image.file_type
            FROM owner_dormitory_images AS owner_image
            JOIN owner_dormitories AS dormitory
              ON dormitory.dormitory_id = COALESCE(
                  owner_image.dormitory_id,
                  (
                      SELECT room.dormitory_id
                      FROM owner_dormitory_rooms AS room
                      WHERE room.room_id = owner_image.room_id
                  )
              )
            WHERE owner_image.image_id = ?
              AND owner_image.approval_status = 'Approved'
              AND dormitory.approval_status = 'Approved'
            """,
            (image_id,),
        ).fetchone()

    if image is None:
        raise HTTPException(status_code=404, detail="ไม่พบรูปภาพ")
    media_types = {"JPG": "image/jpeg", "JPEG": "image/jpeg", "PNG": "image/png"}
    media_type = media_types.get(image["file_type"])
    if media_type is None:
        raise HTTPException(status_code=404, detail="ไม่พบรูปภาพ")

    image_path = (
        get_database_path().resolve().parent
        / "owner_dormitory_images"
        / f"{image_id}.{image['file_type'].lower()}"
    )
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="ไม่พบรูปภาพ")
    return FileResponse(image_path, media_type=media_type)


@router.get("/dormitories/{dormitory_id}")
def get_dormitory_detail(dormitory_id: str) -> dict:
    # รองรับ FR-DOR-03, FR-DOR-04, FR-DOR-05, CON-BUS-01, CON-BUS-02,
    # DOM-RULE-01, NFR-DATA-02 และ AC-DOR-12
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
