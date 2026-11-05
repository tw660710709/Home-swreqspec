import unittest
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from backend.app import details
from backend.app.fixtures import (
    DORMITORY_FIXTURES,
    DORMITORY_IMAGE_FIXTURES,
    FACILITY_FIXTURES,
    ROOM_TYPE_FIXTURES,
)
from backend.app.main import app


class DormitoryDetailErrorAcceptanceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app, raise_app_exceptions=False),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_TC_DOR_05_1_detail_load_error_shows_retry(self) -> None:
        # Given การเชื่อมต่อฐานข้อมูลล้มเหลวระหว่างเปิดดูรายละเอียดหอพัก
        # When ผู้ใช้เข้าหน้ารายละเอียด
        with patch.object(
            details,
            "load_dormitory_detail_data",
            side_effect=RuntimeError("แหล่งข้อมูลรายละเอียดล้มเหลว"),
        ):
            response = await self.client.get(
                "/dormitories/dorm-approved-verified"
            )

        # Then API แจ้งข้อผิดพลาดจากการโหลดรายละเอียด
        self.assertEqual(response.status_code, 500)

    async def test_TC_DOR_05_2_retry_after_detail_load_error(self) -> None:
        # Given การเชื่อมต่อฐานข้อมูลล้มเหลวครั้งแรกและกลับมาใช้ได้เมื่อร้องขออีกครั้ง
        with patch.object(
            details,
            "load_dormitory_detail_data",
            side_effect=[
                RuntimeError("แหล่งข้อมูลรายละเอียดล้มเหลว"),
                (
                    DORMITORY_FIXTURES,
                    ROOM_TYPE_FIXTURES,
                    DORMITORY_IMAGE_FIXTURES,
                    FACILITY_FIXTURES,
                ),
            ],
        ):
            # When ผู้ใช้เข้าหน้ารายละเอียดและร้องขออีกครั้ง
            first_response = await self.client.get(
                "/dormitories/dorm-approved-verified"
            )
            retry_response = await self.client.get(
                "/dormitories/dorm-approved-verified"
            )

        # Then การโหลดครั้งแรกผิดพลาดและการร้องขออีกครั้งได้รับข้อมูลจากแหล่งข้อมูลที่กลับมาใช้ได้
        self.assertEqual(first_response.status_code, 500)
        self.assertEqual(retry_response.status_code, 200)

    async def test_TC_DOR_05_3_detail_load_succeeds(self) -> None:
        # Given การเชื่อมต่อฐานข้อมูลไม่ล้มเหลวระหว่างเปิดดูรายละเอียดหอพัก
        # When ผู้ใช้เข้าหน้ารายละเอียด
        response = await self.client.get(
            "/dormitories/dorm-approved-verified"
        )

        # Then API ส่งข้อมูลรายละเอียดตาม FR-DOR-03 และ FR-DOR-04
        self.assertEqual(response.status_code, 200)
        detail = response.json()
        self.assertEqual(
            [room["monthly_rent"] for room in detail["rooms"]],
            ["5000", "7000"],
        )
        self.assertEqual(
            [room["water_fee"] for room in detail["rooms"]],
            ["100", "100"],
        )
        self.assertEqual(
            [room["electricity_fee"] for room in detail["rooms"]],
            ["200", "200"],
        )
        self.assertEqual(
            [room["deposit"] for room in detail["rooms"]],
            ["5000", "7000"],
        )
        self.assertEqual(detail["amenities"], ["อินเทอร์เน็ตไร้สาย", "ที่จอดรถ"])
        self.assertEqual(detail["rules"], "กฎระเบียบตัวอย่าง")
        self.assertEqual(detail["security_info"], "ข้อมูลความปลอดภัยตัวอย่าง")
        self.assertEqual(detail["contact_info"], "ช่องทางติดต่อตัวอย่าง")
        self.assertEqual(detail["images"][0]["caption"], "รูปห้องตัวอย่าง A1")
        self.assertEqual(
            detail["nearby_places"][0],
            {
                "name": "สถานที่ใกล้เคียงตัวอย่าง A",
                "distance_text": "ระยะทางตัวอย่าง A",
            },
        )


if __name__ == "__main__":
    unittest.main()
