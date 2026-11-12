import unittest
from datetime import date

from backend.app.statistics_contract import (
    DormitoryStatisticsSummary,
    DateRangeSummary,
    can_access_dormitory_statistics,
    ensure_dormitory_access,
    validate_statistics_date_range,
)


class DormitoryStatisticsContractTests(unittest.TestCase):
    def test_owner_can_access_matching_dormitory(self) -> None:
        self.assertTrue(can_access_dormitory_statistics("owner-1", "owner-1"))

    def test_other_owner_cannot_access(self) -> None:
        self.assertFalse(can_access_dormitory_statistics("owner-1", "owner-2"))

    def test_ensure_access_raises_when_not_authorized(self) -> None:
        with self.assertRaises(PermissionError):
            ensure_dormitory_access("owner-1", "owner-2")

    def test_date_range_validation_rejects_inverted_dates(self) -> None:
        is_valid, message = validate_statistics_date_range(
            date(2026, 1, 15),
            date(2026, 1, 10),
        )
        self.assertFalse(is_valid)
        self.assertIn("วันที่สิ้นสุด", message)

    def test_summary_and_range_contracts_serialize(self) -> None:
        summary = DormitoryStatisticsSummary(
            dormitory_id="dorm-001",
            owner_id="owner-1",
            total_rooms=10,
            vacant_rooms=4,
            occupied_rooms=6,
            detail_page_views=15,
            appointments_count=3,
            collected_at=date(2026, 1, 20),
        )
        self.assertEqual(summary.as_dict()["total_rooms"], 10)
        self.assertEqual(summary.as_dict()["vacant_rooms"], 4)

        date_range = DateRangeSummary(
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
            detail_page_views=10,
            appointments_count=5,
        )
        self.assertEqual(date_range.as_dict()["start_date"], "2026-01-01")


if __name__ == "__main__":
    unittest.main()
