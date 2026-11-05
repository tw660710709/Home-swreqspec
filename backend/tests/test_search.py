import unittest
from decimal import Decimal

from backend.app.fixtures import DORMITORY_FIXTURES, ROOM_TYPE_FIXTURES
from backend.app.models import Dormitory
from backend.app.search import search_dormitories


class SearchDormitoriesTests(unittest.TestCase):
    def test_AC_DOR_01_search_female_available_dormitories(self) -> None:
        results = search_dormitories(
            DORMITORY_FIXTURES,
            ROOM_TYPE_FIXTURES,
            dormitory_type="หอพักหญิง",
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].dormitory_id, "dorm-approved-verified")
        self.assertEqual(results[0].availability_status, "ห้องว่าง")

    def test_search_only_includes_approved_dormitories(self) -> None:
        results = search_dormitories(DORMITORY_FIXTURES, ROOM_TYPE_FIXTURES)

        self.assertNotIn("dorm-unapproved", {result.dormitory_id for result in results})

    def test_search_matches_name_or_location_case_insensitively(self) -> None:
        results = search_dormitories(
            DORMITORY_FIXTURES,
            ROOM_TYPE_FIXTURES,
            query="ทำเลตัวอย่าง b",
        )

        self.assertEqual([result.dormitory_id for result in results], ["dorm-approved-unverified"])

    def test_price_filter_matches_a_room_and_shows_all_room_price_range(self) -> None:
        results = search_dormitories(
            DORMITORY_FIXTURES,
            ROOM_TYPE_FIXTURES,
            min_price=Decimal("6500"),
            max_price=Decimal("7500"),
        )

        self.assertEqual([result.dormitory_id for result in results], ["dorm-approved-verified"])
        self.assertEqual(results[0].min_rent, Decimal("5000"))
        self.assertEqual(results[0].max_rent, Decimal("7000"))

    def test_dormitory_without_rooms_has_nullable_price_and_availability(self) -> None:
        dormitory = Dormitory(
            id="dorm-without-rooms",
            name="หอพักไม่มีข้อมูลห้อง",
            location="ทำเลตัวอย่าง",
            type="หอพักรวม",
            approval_status="Approved",
            verified_status=False,
            security_info="ข้อมูลความปลอดภัยตัวอย่าง",
            contact_info="ช่องทางติดต่อตัวอย่าง",
            rules="กฎระเบียบตัวอย่าง",
        )

        results = search_dormitories([dormitory], [])

        self.assertEqual(len(results), 1)
        self.assertIsNone(results[0].min_rent)
        self.assertIsNone(results[0].max_rent)
        self.assertIsNone(results[0].availability_status)


if __name__ == "__main__":
    unittest.main()
