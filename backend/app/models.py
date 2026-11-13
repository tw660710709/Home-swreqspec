from dataclasses import dataclass, field
from decimal import Decimal
from typing import Literal, Optional


DormitoryType = Literal["หอพักชาย", "หอพักหญิง", "หอพักรวม"]
AvailabilityStatus = Literal["ห้องว่าง", "ห้องเต็ม"]


@dataclass
class Dormitory:
    # รองรับ FR-DOR-01, FR-DOR-03, FR-DOR-05, CON-BUS-01, CON-BUS-02
    id: str
    name: str
    location: str
    type: DormitoryType
    approval_status: str
    verified_status: bool
    security_info: str
    contact_info: str
    rules: str
    amenities: list[str] = field(default_factory=list)

    @property
    def is_publicly_listable(self) -> bool:
        # รองรับ CON-BUS-01
        return self.approval_status == "Approved"

    @property
    def has_verified_badge(self) -> bool:
        # รองรับ CON-BUS-02 และ FR-DOR-05
        return self.is_publicly_listable and self.verified_status


@dataclass
class RoomType:
    # รองรับ FR-DOR-01, FR-DOR-02, FR-DOR-03, DOM-RULE-01
    id: str
    dormitory_id: str
    name: str
    monthly_rent: Decimal
    water_fee: Decimal
    electricity_fee: Decimal
    deposit: Decimal
    availability_status: AvailabilityStatus


@dataclass
class DormitoryImage:
    # รองรับ FR-DOR-04 และ NFR-ACC-01
    id: str
    dormitory_id: str
    url: str
    caption: str


@dataclass
class Facility:
    # รองรับ FR-DOR-03 และ FR-DOR-04
    id: str
    dormitory_id: str
    name: str
    distance_text: str


@dataclass
class SearchResult:
    # รองรับ FR-DOR-01, FR-DOR-02, ASM-03 และหอพักที่ยังไม่มีข้อมูลห้อง
    dormitory_id: str
    min_rent: Optional[Decimal]
    max_rent: Optional[Decimal]
    availability_status: Optional[AvailabilityStatus]


@dataclass
class OwnerDormitory:
    # รองรับ CON-AUTH-01, CON-DATA-01 และ FR-DOR-12
    dormitory_id: str
    owner_id: str
    name: str
    location: str
    type: str
    contact_info: str
    approval_status: str
    amenities: Optional[list[str]] = None
    rules: Optional[str] = None


@dataclass
class OwnerDormitoryRoom:
    # รองรับ CON-DATA-01, FR-DOR-12, ASM-16 และ ASM-17
    room_id: str
    dormitory_id: str
    monthly_rent: Decimal


@dataclass
class OwnerDormitoryImage:
    # รองรับ CON-FILE-01 และ FR-DOR-12; เก็บ metadata ก่อนเลือก storage จริงใน T-11
    image_id: str
    file_type: str
    file_size_bytes: int
    dormitory_id: Optional[str] = None
    room_id: Optional[str] = None
