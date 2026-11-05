import unittest
from decimal import Decimal
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models import Dormitory, RoomType
from backend.app import search_api


class DormitoryRecommendationApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_TC_DOR_03_1_empty_search_shows_recommendations(self) -> None:
        # Given ไม่มีผลการค้นหาตรงเงื่อนไขและมีหอพัก Approved สำหรับแนะนำ
        # When ผู้ใช้ค้นหาด้วยเงื่อนไขที่ไม่พบผล
        search_response = await self.client.get(
            "/dormitories",
            params={"q": "ทำเลที่ไม่มี", "min_price": "6000", "max_price": "7000"},
        )
        recommendation_response = await self.client.get(
            "/dormitories/recommendations",
            params={"q": "ทำเลที่ไม่มี", "min_price": "6000", "max_price": "7000"},
        )

        # Then ไม่มีผลค้นหาและมีรายการแนะนำไม่เกิน 5 รายการที่ Approved
        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(search_response.json(), [])
        self.assertEqual(recommendation_response.status_code, 200)
        recommendations = recommendation_response.json()
        self.assertGreater(len(recommendations), 0)
        self.assertLessEqual(len(recommendations), 5)
        self.assertTrue(
            all(
                item["id"] in {
                    "dorm-approved-verified",
                    "dorm-approved-unverified",
                }
                for item in recommendations
            )
        )

    async def test_TC_DOR_03_2_recommendations_are_limited_to_five(self) -> None:
        dormitories = [
            Dormitory(
                id=f"approved-{index}",
                name=f"หอพักแนะนำ {index}",
                location="ทำเลเป้าหมาย",
                type="หอพักหญิง",
                approval_status="Approved",
                verified_status=False,
                security_info="ข้อมูลความปลอดภัยตัวอย่าง",
                contact_info="ช่องทางติดต่อตัวอย่าง",
                rules="กฎระเบียบตัวอย่าง",
            )
            for index in range(6)
        ]
        room_types = [
            RoomType(
                id=f"room-{index}",
                dormitory_id=f"approved-{index}",
                name=f"ห้องตัวอย่าง {index}",
                monthly_rent=Decimal("6000"),
                water_fee=Decimal("100"),
                electricity_fee=Decimal("200"),
                deposit=Decimal("6000"),
                availability_status="ห้องว่าง",
            )
            for index in range(6)
        ]

        # Given ไม่มีผลตรงเงื่อนไขและมี Approved recommendations มากกว่า 5
        # When ผู้ใช้ค้นหา
        with (
            patch.object(search_api, "DORMITORY_FIXTURES", dormitories),
            patch.object(search_api, "ROOM_TYPE_FIXTURES", room_types),
        ):
            search_response = await self.client.get(
                "/dormitories",
                params={"q": "ไม่พบ", "min_price": "6000", "max_price": "6000"},
            )
            recommendation_response = await self.client.get(
                "/dormitories/recommendations",
                params={"q": "ทำเลเป้าหมาย", "min_price": "6000", "max_price": "6000"},
            )

        # Then มีข้อความ no-results และ recommendations ไม่เกิน 5 รายการ
        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(search_response.json(), [])
        self.assertEqual(recommendation_response.status_code, 200)
        recommendations = recommendation_response.json()
        self.assertEqual(len(recommendations), 5)
        self.assertTrue(all(item["type"] == "หอพักหญิง" for item in recommendations))

    async def test_TC_DOR_03_3_matching_results_exist(self) -> None:
        # Given มีหอพัก Approved ที่ตรงกับเงื่อนไขค้นหา
        # When ผู้ใช้ค้นหาด้วยชื่อหอพักที่ตรงกัน
        response = await self.client.get(
            "/dormitories",
            params={"q": "หอพักตัวอย่าง A"},
        )

        # Then แสดงรายการที่ตรงกับเงื่อนไขตาม FR-DOR-01
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.json()],
            ["dorm-approved-verified"],
        )
        # ส่วนที่ spec ไม่ได้บอกเกี่ยวกับ no-results/recommendations ไม่ตรวจ


if __name__ == "__main__":
    unittest.main()
