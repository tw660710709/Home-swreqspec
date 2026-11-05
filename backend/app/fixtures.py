from decimal import Decimal

from .models import Dormitory, DormitoryImage, Facility, RoomType, SearchResult


# ข้อมูลสังเคราะห์สำหรับตรวจ FR-DOR-01 ถึง FR-DOR-05, FR-DOR-07,
# CON-BUS-01 และ CON-BUS-02
DORMITORY_FIXTURES = [
    Dormitory(
        id="dorm-approved-verified",
        name="หอพักตัวอย่าง A",
        location="ทำเลตัวอย่าง A",
        type="หอพักหญิง",
        approval_status="Approved",
        verified_status=True,
        security_info="ข้อมูลความปลอดภัยตัวอย่าง",
        contact_info="ช่องทางติดต่อตัวอย่าง",
        rules="กฎระเบียบตัวอย่าง",
        amenities=["อินเทอร์เน็ตไร้สาย", "ที่จอดรถ"],
    ),
    Dormitory(
        id="dorm-approved-unverified",
        name="หอพักตัวอย่าง B",
        location="ทำเลตัวอย่าง B",
        type="หอพักรวม",
        approval_status="Approved",
        verified_status=False,
        security_info="ข้อมูลความปลอดภัยตัวอย่าง",
        contact_info="ช่องทางติดต่อตัวอย่าง",
        rules="กฎระเบียบตัวอย่าง",
        amenities=["พื้นที่ส่วนกลาง"],
    ),
    Dormitory(
        id="dorm-unapproved",
        name="หอพักตัวอย่าง C",
        location="ทำเลตัวอย่าง C",
        type="หอพักชาย",
        approval_status="Pending",
        verified_status=False,
        security_info="ข้อมูลความปลอดภัยตัวอย่าง",
        contact_info="ช่องทางติดต่อตัวอย่าง",
        rules="กฎระเบียบตัวอย่าง",
        amenities=["บริการซักรีด"],
    ),
]

ROOM_TYPE_FIXTURES = [
    RoomType(
        id="room-a-available",
        dormitory_id="dorm-approved-verified",
        name="ห้องตัวอย่าง A1",
        monthly_rent=Decimal("5000"),
        water_fee=Decimal("100"),
        electricity_fee=Decimal("200"),
        deposit=Decimal("5000"),
        availability_status="ห้องว่าง",
    ),
    RoomType(
        id="room-a-full",
        dormitory_id="dorm-approved-verified",
        name="ห้องตัวอย่าง A2",
        monthly_rent=Decimal("7000"),
        water_fee=Decimal("100"),
        electricity_fee=Decimal("200"),
        deposit=Decimal("7000"),
        availability_status="ห้องเต็ม",
    ),
    RoomType(
        id="room-b-available",
        dormitory_id="dorm-approved-unverified",
        name="ห้องตัวอย่าง B1",
        monthly_rent=Decimal("6000"),
        water_fee=Decimal("100"),
        electricity_fee=Decimal("200"),
        deposit=Decimal("6000"),
        availability_status="ห้องว่าง",
    ),
    RoomType(
        id="room-c-full",
        dormitory_id="dorm-unapproved",
        name="ห้องตัวอย่าง C1",
        monthly_rent=Decimal("4000"),
        water_fee=Decimal("100"),
        electricity_fee=Decimal("200"),
        deposit=Decimal("4000"),
        availability_status="ห้องเต็ม",
    ),
]

DORMITORY_IMAGE_FIXTURES = [
    DormitoryImage(
        id="image-a-1",
        dormitory_id="dorm-approved-verified",
        url="/fixtures/dormitory-a-room-1.jpg",
        caption="รูปห้องตัวอย่าง A1",
    ),
    DormitoryImage(
        id="image-b-1",
        dormitory_id="dorm-approved-unverified",
        url="/fixtures/dormitory-b-room-1.jpg",
        caption="รูปห้องตัวอย่าง B1",
    ),
]

FACILITY_FIXTURES = [
    Facility(
        id="facility-a-1",
        dormitory_id="dorm-approved-verified",
        name="สถานที่ใกล้เคียงตัวอย่าง A",
        distance_text="ระยะทางตัวอย่าง A",
    ),
    Facility(
        id="facility-b-1",
        dormitory_id="dorm-approved-unverified",
        name="สถานที่ใกล้เคียงตัวอย่าง B",
        distance_text="ระยะทางตัวอย่าง B",
    ),
]

SEARCH_RESULT_FIXTURES = [
    SearchResult(
        dormitory_id="dorm-approved-verified",
        min_rent=Decimal("5000"),
        max_rent=Decimal("7000"),
        availability_status="ห้องว่าง",
    ),
    SearchResult(
        dormitory_id="dorm-approved-unverified",
        min_rent=Decimal("6000"),
        max_rent=Decimal("6000"),
        availability_status="ห้องว่าง",
    ),
]
