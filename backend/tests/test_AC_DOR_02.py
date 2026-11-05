import unittest

from httpx import ASGITransport, AsyncClient

from backend.app.main import app


class ApprovedDormitoryDetailTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_TC_DOR_02_1_approved_verified_detail(self) -> None:
        # Given มีหอพักที่อนุมัติและ Verified พร้อมข้อมูลรายละเอียดครบ
        # When ผู้ใช้เปิดรายละเอียดหอพัก
        response = await self.client.get("/dormitories/dorm-approved-verified")

        # Then API ส่งข้อมูลรายละเอียดทุกส่วนและ Verified Badge
        self.assertEqual(response.status_code, 200)
        detail = response.json()
        self.assertEqual(detail["rooms"][0]["monthly_rent"], "5000")
        self.assertEqual(detail["rooms"][0]["water_fee"], "100")
        self.assertEqual(detail["rooms"][0]["electricity_fee"], "200")
        self.assertEqual(detail["rooms"][0]["deposit"], "5000")
        self.assertEqual(detail["amenities"], ["อินเทอร์เน็ตไร้สาย", "ที่จอดรถ"])
        self.assertEqual(detail["rules"], "กฎระเบียบตัวอย่าง")
        self.assertEqual(detail["images"][0]["caption"], "รูปห้องตัวอย่าง A1")
        self.assertEqual(
            detail["nearby_places"][0]["name"],
            "สถานที่ใกล้เคียงตัวอย่าง A",
        )
        self.assertEqual(detail["security_info"], "ข้อมูลความปลอดภัยตัวอย่าง")
        self.assertEqual(detail["contact_info"], "ช่องทางติดต่อตัวอย่าง")
        self.assertTrue(detail["verified_badge"])

    async def test_TC_DOR_02_2_approved_unverified_detail(self) -> None:
        # Given มีหอพักที่อนุมัติแต่ไม่มีสถานะ Verified
        # When ผู้ใช้เปิดรายละเอียดหอพัก
        response = await self.client.get("/dormitories/dorm-approved-unverified")

        # Then แสดงข้อมูลรายละเอียดและไม่มี Verified Badge
        self.assertEqual(response.status_code, 200)
        detail = response.json()
        self.assertEqual(detail["rooms"][0]["monthly_rent"], "6000")
        self.assertEqual(detail["amenities"], ["พื้นที่ส่วนกลาง"])
        self.assertEqual(detail["rules"], "กฎระเบียบตัวอย่าง")
        self.assertEqual(detail["images"][0]["caption"], "รูปห้องตัวอย่าง B1")
        self.assertEqual(
            detail["nearby_places"][0]["name"],
            "สถานที่ใกล้เคียงตัวอย่าง B",
        )
        self.assertFalse(detail["verified_badge"])

    async def test_AC_DOR_02_unverified_detail_contains_all_required_fields(
        self,
    ) -> None:
        response = await self.client.get("/dormitories/dorm-approved-unverified")

        self.assertEqual(response.status_code, 200)
        detail = response.json()
        self.assertEqual(
            detail["rooms"],
            [
                {
                    "id": "room-b-available",
                    "name": "ห้องตัวอย่าง B1",
                    "monthly_rent": "6000",
                    "water_fee": "100",
                    "electricity_fee": "200",
                    "deposit": "6000",
                }
            ],
        )
        self.assertEqual(detail["amenities"], ["พื้นที่ส่วนกลาง"])
        self.assertEqual(detail["rules"], "กฎระเบียบตัวอย่าง")
        self.assertEqual(detail["security_info"], "ข้อมูลความปลอดภัยตัวอย่าง")
        self.assertEqual(detail["contact_info"], "ช่องทางติดต่อตัวอย่าง")
        self.assertEqual(
            detail["images"],
            [
                {
                    "url": "/fixtures/dormitory-b-room-1.jpg",
                    "caption": "รูปห้องตัวอย่าง B1",
                }
            ],
        )
        self.assertEqual(
            detail["nearby_places"],
            [
                {
                    "name": "สถานที่ใกล้เคียงตัวอย่าง B",
                    "distance_text": "ระยะทางตัวอย่าง B",
                }
            ],
        )
        self.assertFalse(detail["verified_badge"])

    async def test_TC_DOR_02_3_unapproved_dormitory_detail(self) -> None:
        # Given มีหอพักที่ไม่ Approved แม้สถานะ Verified จะถูกระบุเป็นจริง
        # When ผู้ใช้เปิดรายละเอียดหอพัก
        response = await self.client.get("/dormitories/dorm-unapproved")

        # Then ไม่มีข้อมูลรายละเอียดของหอพักที่ไม่ Approved
        self.assertEqual(response.status_code, 404)
        self.assertNotIn("หอพักตัวอย่าง C", response.text)


if __name__ == "__main__":
    unittest.main()
