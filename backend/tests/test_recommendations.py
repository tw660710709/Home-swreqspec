import unittest
from decimal import Decimal

from backend.app.models import Dormitory, RoomType
from backend.app.recommendations import recommend_dormitories


class DormitoryRecommendationsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.dormitories = [
            Dormitory(
                id=f"dorm-{index}",
                name=f"หอพักตัวอย่าง {index}",
                location=(
                    "ทำเลเป้าหมาย"
                    if index in (1, 2, 6)
                    else f"ทำเลตัวอย่าง {index}"
                ),
                type="หอพักหญิง",
                approval_status="Approved",
                verified_status=False,
                security_info="ข้อมูลความปลอดภัยตัวอย่าง",
                contact_info="ช่องทางติดต่อตัวอย่าง",
                rules="กฎระเบียบตัวอย่าง",
            )
            for index in range(1, 7)
        ]
        self.dormitories.append(
            Dormitory(
                id="dorm-pending",
                name="หอพักรออนุมัติ",
                location="ทำเลเป้าหมาย",
                type="หอพักหญิง",
                approval_status="Pending",
                verified_status=False,
                security_info="ข้อมูลความปลอดภัยตัวอย่าง",
                contact_info="ช่องทางติดต่อตัวอย่าง",
                rules="กฎระเบียบตัวอย่าง",
            )
        )
        self.room_types = [
            RoomType(
                id=f"room-{index}",
                dormitory_id=f"dorm-{index}",
                name=f"ห้องตัวอย่าง {index}",
                monthly_rent=Decimal(str(5000 + index * 1000)),
                water_fee=Decimal("100"),
                electricity_fee=Decimal("200"),
                deposit=Decimal("5000"),
                availability_status="ห้องว่าง",
            )
            for index in range(1, 7)
        ]
        self.room_types.append(
            RoomType(
                id="room-pending",
                dormitory_id="dorm-pending",
                name="ห้องรออนุมัติ",
                monthly_rent=Decimal("5000"),
                water_fee=Decimal("100"),
                electricity_fee=Decimal("200"),
                deposit=Decimal("5000"),
                availability_status="ห้องว่าง",
            )
        )

    def test_AC_DOR_03_recommendations_are_relevant_approved_and_limited(self) -> None:
        recommendations = recommend_dormitories(
            self.dormitories,
            self.room_types,
            query="ทำเลเป้าหมาย",
            min_price=Decimal("10000"),
            max_price=Decimal("11000"),
        )

        self.assertEqual(
            [result.dormitory_id for result in recommendations],
            ["dorm-6", "dorm-2", "dorm-1", "dorm-5", "dorm-4"],
        )
        self.assertLessEqual(len(recommendations), 5)
        self.assertNotIn(
            "dorm-pending",
            {result.dormitory_id for result in recommendations},
        )

    def test_recommendations_use_price_distance_when_no_location_matches(self) -> None:
        recommendations = recommend_dormitories(
            self.dormitories,
            self.room_types,
            query="ทำเลที่ไม่มี",
            min_price=Decimal("10000"),
            max_price=Decimal("11000"),
        )

        self.assertEqual(
            [result.dormitory_id for result in recommendations],
            ["dorm-5", "dorm-6", "dorm-4", "dorm-3", "dorm-2"],
        )

    def test_AC_DOR_03_exact_location_precedes_price_distance(self) -> None:
        self.dormitories[0].location = "ทำเลเหนือ"
        self.dormitories[1].location = "เขตทำเลเหนือฝั่งตะวันออก"
        self.room_types[0].monthly_rent = Decimal("20000")
        self.room_types[1].monthly_rent = Decimal("6000")

        recommendations = recommend_dormitories(
            self.dormitories,
            self.room_types,
            query="ทำเลเหนือ",
            min_price=Decimal("6000"),
            max_price=Decimal("6000"),
        )

        self.assertEqual(
            [result.dormitory_id for result in recommendations[:2]],
            ["dorm-1", "dorm-2"],
        )

    def test_recommendations_without_search_criteria_are_empty(self) -> None:
        recommendations = recommend_dormitories(self.dormitories, self.room_types)

        self.assertEqual(recommendations, [])


if __name__ == "__main__":
    unittest.main()
