import unittest
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from backend.app.fixtures import (
    DORMITORY_FIXTURES,
    DORMITORY_IMAGE_FIXTURES,
    FACILITY_FIXTURES,
    ROOM_TYPE_FIXTURES,
)
from backend.app import details
from backend.app.main import app


class DormitoryDetailTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_AC_DOR_02_detail_verified_dormitory(self) -> None:
        response = await self.client.get("/dormitories/dorm-approved-verified")

        self.assertEqual(response.status_code, 200)
        detail = response.json()
        self.assertEqual(detail["name"], "หอพักตัวอย่าง A")
        self.assertTrue(detail["verified_badge"])
        self.assertEqual(
            detail["rooms"][0],
            {
                "id": "room-a-available",
                "name": "ห้องตัวอย่าง A1",
                "monthly_rent": "5000",
                "water_fee": "100",
                "electricity_fee": "200",
                "deposit": "5000",
            },
        )
        self.assertEqual(detail["amenities"], ["อินเทอร์เน็ตไร้สาย", "ที่จอดรถ"])
        self.assertEqual(detail["rules"], "กฎระเบียบตัวอย่าง")
        self.assertEqual(detail["security_info"], "ข้อมูลความปลอดภัยตัวอย่าง")
        self.assertEqual(detail["contact_info"], "ช่องทางติดต่อตัวอย่าง")
        self.assertEqual(detail["images"][0]["caption"], "รูปห้องตัวอย่าง A1")
        self.assertEqual(
            detail["nearby_places"][0]["name"],
            "สถานที่ใกล้เคียงตัวอย่าง A",
        )

    async def test_AC_DOR_02_detail_matches_source_fixtures(self) -> None:
        dormitory_id = "dorm-approved-verified"
        response = await self.client.get(f"/dormitories/{dormitory_id}")

        self.assertEqual(response.status_code, 200)
        detail = response.json()
        dormitory = next(
            item for item in DORMITORY_FIXTURES if item.id == dormitory_id
        )
        rooms = [
            room
            for room in ROOM_TYPE_FIXTURES
            if room.dormitory_id == dormitory_id
        ]
        images = [
            image
            for image in DORMITORY_IMAGE_FIXTURES
            if image.dormitory_id == dormitory_id
        ]
        nearby_places = [
            place for place in FACILITY_FIXTURES if place.dormitory_id == dormitory_id
        ]

        self.assertEqual(detail["name"], dormitory.name)
        self.assertEqual(detail["location"], dormitory.location)
        self.assertEqual(detail["type"], dormitory.type)
        self.assertEqual(
            detail["rooms"],
            [
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
        )
        self.assertEqual(detail["amenities"], dormitory.amenities)
        self.assertEqual(detail["rules"], dormitory.rules)
        self.assertEqual(detail["security_info"], dormitory.security_info)
        self.assertEqual(detail["contact_info"], dormitory.contact_info)
        self.assertEqual(
            detail["images"],
            [{"url": image.url, "caption": image.caption} for image in images],
        )
        self.assertEqual(
            detail["nearby_places"],
            [
                {"name": place.name, "distance_text": place.distance_text}
                for place in nearby_places
            ],
        )
        self.assertEqual(detail["verified_badge"], dormitory.has_verified_badge)

    async def test_detail_does_not_expose_unapproved_dormitories(self) -> None:
        response = await self.client.get("/dormitories/dorm-unapproved")

        self.assertEqual(response.status_code, 404)

    async def test_approved_unverified_dormitory_has_no_verified_badge(self) -> None:
        response = await self.client.get("/dormitories/dorm-approved-unverified")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["verified_badge"])

    async def test_AC_DOR_05_detail_data_source_failure_is_server_error(self) -> None:
        with patch.object(
            details,
            "load_dormitory_detail_data",
            side_effect=RuntimeError("แหล่งข้อมูลรายละเอียดล้มเหลว"),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app, raise_app_exceptions=False),
                base_url="http://test",
            ) as client:
                response = await client.get(
                    "/dormitories/dorm-approved-verified"
                )

        self.assertEqual(response.status_code, 500)


if __name__ == "__main__":
    unittest.main()
