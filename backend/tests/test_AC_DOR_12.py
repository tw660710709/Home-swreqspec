import unittest
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from backend.app import details
from backend.app.main import app
from backend.app.models import Dormitory, DormitoryImage


class PublicDormitoryApprovalTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ NFR-DATA-02, DOM-RULE-01 และ AC-DOR-12
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )
        approved = Dormitory(
            id="dorm-approved",
            name="หอพักที่อนุมัติล่าสุด",
            location="ทำเลที่อนุมัติ",
            type="หอพักรวม",
            approval_status="Approved",
            verified_status=False,
            security_info="ข้อมูลความปลอดภัย",
            contact_info="ช่องทางติดต่อ",
            rules="กฎระเบียบ",
            amenities=["อินเทอร์เน็ต"],
        )
        pending = Dormitory(
            id="dorm-pending",
            name="หอพักที่รออนุมัติ",
            location="ทำเลที่รออนุมัติ",
            type="หอพักหญิง",
            approval_status="Pending",
            verified_status=False,
            security_info="ข้อมูลความปลอดภัยที่รออนุมัติ",
            contact_info="ช่องทางติดต่อที่รออนุมัติ",
            rules="กฎระเบียบที่รออนุมัติ",
            amenities=["สิ่งอำนวยความสะดวกที่รออนุมัติ"],
        )
        self.catalog = (
            [approved, pending],
            [],
            [
                DormitoryImage(
                    id="image-approved",
                    dormitory_id=approved.id,
                    url="/approved.jpg",
                    caption="รูปที่อนุมัติ",
                ),
                DormitoryImage(
                    id="image-pending",
                    dormitory_id=pending.id,
                    url="/pending.jpg",
                    caption="รูปที่รออนุมัติ",
                ),
            ],
            [],
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_AC_DOR_12_public_view_shows_approved_data_only(self) -> None:
        # Given มีข้อมูลและรูปภาพทั้งที่อนุมัติแล้วและรออนุมัติ
        with patch.object(
            details,
            "load_dormitory_detail_data",
            return_value=self.catalog,
        ):
            # When ผู้ใช้งานทั่วไปเปิดดูหอพักที่อนุมัติแล้ว
            response = await self.client.get("/dormitories/dorm-approved")

        # Then แสดงข้อมูลล่าสุดที่อนุมัติแล้วพร้อมรูปของหอพักนั้นเท่านั้น
        self.assertEqual(response.status_code, 200)
        detail = response.json()
        self.assertEqual(detail["name"], "หอพักที่อนุมัติล่าสุด")
        self.assertEqual(detail["location"], "ทำเลที่อนุมัติ")
        self.assertEqual(
            detail["images"],
            [{"url": "/approved.jpg", "caption": "รูปที่อนุมัติ"}],
        )
        self.assertNotIn("หอพักที่รออนุมัติ", response.text)
        self.assertNotIn("/pending.jpg", response.text)

    async def test_AC_DOR_12_public_view_hides_pending_data(self) -> None:
        # Given หอพักและรูปภาพที่เชื่อมกับหอพักมีสถานะรออนุมัติ
        with patch.object(
            details,
            "load_dormitory_detail_data",
            return_value=self.catalog,
        ):
            # When ผู้ใช้งานทั่วไปเปิดดูหอพักที่รออนุมัติ
            response = await self.client.get("/dormitories/dorm-pending")

        # Then ไม่แสดงข้อมูลหรือรูปภาพที่รออนุมัติ
        self.assertEqual(response.status_code, 404)
        self.assertNotIn("หอพักที่รออนุมัติ", response.text)
        self.assertNotIn("/pending.jpg", response.text)


if __name__ == "__main__":
    unittest.main()
