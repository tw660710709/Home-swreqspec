from decimal import Decimal

from backend.app.models import Dormitory, RoomType
from backend.app.search import search_dormitories


def _dormitory(dormitory_id: str, dormitory_type: str) -> Dormitory:
    return Dormitory(
        id=dormitory_id,
        name=dormitory_id,
        location="ทำเลตัวอย่าง",
        type=dormitory_type,
        approval_status="Approved",
        verified_status=False,
        security_info="ข้อมูลความปลอดภัยตัวอย่าง",
        contact_info="ช่องทางติดต่อตัวอย่าง",
        rules="กฎระเบียบตัวอย่าง",
    )


def _room(room_id: str, dormitory_id: str, status: str) -> RoomType:
    return RoomType(
        id=room_id,
        dormitory_id=dormitory_id,
        name=room_id,
        monthly_rent=Decimal("5000"),
        water_fee=Decimal("100"),
        electricity_fee=Decimal("200"),
        deposit=Decimal("5000"),
        availability_status=status,
    )


def test_TC_DOR_01_1_female_available_search() -> None:
    female_dormitory = _dormitory("female-available", "หอพักหญิง")
    other_type_dormitory = _dormitory("male-available", "หอพักชาย")
    dormitories = [female_dormitory, other_type_dormitory]
    rooms = [
        _room("female-room", female_dormitory.id, "ห้องว่าง"),
        _room("male-room", other_type_dormitory.id, "ห้องว่าง"),
    ]

    # Given มีหอพัก Approved ประเภทหญิงที่มีห้องว่างและประเภทอื่นในระบบ
    # When ผู้ใช้เลือกกรองเฉพาะหอพักหญิงและค้นหา
    results = search_dormitories(
        dormitories,
        rooms,
        dormitory_type="หอพักหญิง",
    )

    # Then แสดงเฉพาะรายการหอพักหญิงพร้อมสถานะห้องว่างตามข้อมูล
    assert [result.dormitory_id for result in results] == ["female-available"]
    assert results[0].availability_status == "ห้องว่าง"


def test_TC_DOR_01_2_female_availability_statuses() -> None:
    available_dormitory = _dormitory("female-available", "หอพักหญิง")
    full_dormitory = _dormitory("female-full", "หอพักหญิง")
    dormitories = [available_dormitory, full_dormitory]
    rooms = [
        _room("available-room", available_dormitory.id, "ห้องว่าง"),
        _room("full-room", full_dormitory.id, "ห้องเต็ม"),
    ]

    # Given มีหอพักหญิงที่มีทั้งสถานะห้องว่างและห้องเต็มในระบบ
    # When ผู้ใช้เลือกกรองเฉพาะหอพักหญิงและค้นหา
    results = search_dormitories(
        dormitories,
        rooms,
        dormitory_type="หอพักหญิง",
    )

    # Then แสดงเฉพาะหอพักหญิงและสถานะของแต่ละรายการตามข้อมูล
    assert {result.dormitory_id for result in results} == {
        "female-available",
        "female-full",
    }
    assert {
        result.dormitory_id: result.availability_status for result in results
    } == {
        "female-available": "ห้องว่าง",
        "female-full": "ห้องเต็ม",
    }


def test_TC_DOR_01_3_excludes_other_dormitory_types() -> None:
    other_type_dormitory = _dormitory("male-available", "หอพักชาย")
    dormitories = [other_type_dormitory]
    rooms = [_room("male-room", other_type_dormitory.id, "ห้องว่าง")]

    # Given มีหอพัก Approved ประเภทอื่นที่มีห้องว่างและไม่มีหอพักหญิงตรงเงื่อนไข
    # When ผู้ใช้เลือกกรองเฉพาะหอพักหญิงและค้นหา
    results = search_dormitories(
        dormitories,
        rooms,
        dormitory_type="หอพักหญิง",
    )

    # Then ไม่มีรายการหอพักประเภทอื่นปะปนในผลลัพธ์
    assert results == []
