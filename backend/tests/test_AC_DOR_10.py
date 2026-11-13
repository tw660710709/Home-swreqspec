import sqlite3
import unittest
from pathlib import Path

from httpx import ASGITransport, AsyncClient, Response

from backend.app.config import MAX_IMAGE_SIZE_BYTES
from backend.app.database import get_database_path, initialize_database
from backend.app.main import app


JPEG_HEADER = b"\xff\xd8\xff"
PNG_HEADER = b"\x89PNG\r\n\x1a\n"
GIF_HEADER = b"GIF89a"


class OwnerDormitoryImageUploadTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ CON-AUTH-01, CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
    async def asyncSetUp(self) -> None:
        initialize_database()
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def _create_dormitory(self, owner_id: str = "owner-1") -> str:
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": owner_id},
            json={
                "name": "หอพักทดสอบรูป",
                "location": "ทำเลทดสอบ",
                "type": "หอพักรวม",
                "contact_info": "ติดต่อทดสอบ",
            },
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["dormitory_id"]

    async def _create_room(self, dormitory_id: str) -> str:
        response = await self.client.post(
            f"/owners/dormitories/{dormitory_id}/rooms",
            headers={"X-Owner-Id": "owner-1"},
            json={"monthly_rent": "5000"},
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["room_id"]

    async def _upload(
        self,
        url: str,
        *files: tuple[str, bytes, str],
        owner_id: str = "owner-1",
    ) -> Response:
        return await self.client.post(
            url,
            headers={"X-Owner-Id": owner_id},
            files=[
                ("files", (filename, content, content_type))
                for filename, content, content_type in files
            ],
        )

    def _stored_image_rows(self) -> list[sqlite3.Row]:
        connection = sqlite3.connect(get_database_path())
        try:
            connection.row_factory = sqlite3.Row
            return connection.execute(
                """
                SELECT image_id, dormitory_id, room_id, file_type, file_size_bytes
                FROM owner_dormitory_images
                ORDER BY image_id
                """
            ).fetchall()
        finally:
            connection.close()

    def _storage_path(self, image_id: str, file_type: str) -> Path:
        return (
            get_database_path().resolve().parent
            / "owner_dormitory_images"
            / f"{image_id}.{file_type.lower()}"
        )

    async def test_AC_DOR_10_rejects_only_invalid_or_over_limit_images(self) -> None:
        # Given เจ้าของมีหอพักและเลือกรูปที่ถูกต้องปนไฟล์ผิดชนิดและรูปเกินจำนวน
        dormitory_id = await self._create_dormitory()
        valid_formats = [
            ("jpg", JPEG_HEADER, "image/jpeg"),
            ("jpeg", JPEG_HEADER, "image/jpeg"),
            ("png", PNG_HEADER, "image/png"),
        ]
        valid_files = [
            (
                f"valid-{index}.{extension}",
                signature + b"image-data",
                content_type,
            )
            for index in range(10)
            for extension, signature, content_type in [
                valid_formats[index % len(valid_formats)]
            ]
        ]

        # When อัปโหลดไฟล์ผิดชนิดพร้อมรูปที่ถูกต้องเกินขีดจำกัด 10 รูป
        response = await self._upload(
            f"/owners/dormitories/{dormitory_id}/images",
            ("unsupported.gif", GIF_HEADER + b"image-data", "image/gif"),
            *valid_files,
            ("over-limit.jpg", JPEG_HEADER + b"image-data", "image/jpeg"),
        )

        # Then ปฏิเสธเฉพาะไฟล์ผิดชนิด/เกินจำนวน และจัดเก็บรูปถูกต้องครบ 10 รูป
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(len(result["accepted"]), 10)
        self.assertEqual(
            {item["filename"] for item in result["rejected"]},
            {"unsupported.gif", "over-limit.jpg"},
        )
        self.assertTrue(
            any("JPG, JPEG หรือ PNG" in item["reason"] for item in result["rejected"])
        )
        self.assertTrue(
            any("ไม่เกิน 10 รูป" in item["reason"] for item in result["rejected"])
        )
        image_rows = self._stored_image_rows()
        self.assertEqual(len(image_rows), 10)
        accepted_filename_by_id = {
            item["image_id"]: item["filename"] for item in result["accepted"]
        }
        content_by_filename = {
            filename: content for filename, content, _ in valid_files
        }
        for image in image_rows:
            self.assertEqual(image["dormitory_id"], dormitory_id)
            self.assertIsNone(image["room_id"])
            stored_path = self._storage_path(image["image_id"], image["file_type"])
            self.assertTrue(stored_path.is_file())
            self.assertEqual(
                stored_path.read_bytes(),
                content_by_filename[accepted_filename_by_id[image["image_id"]]],
            )

        room_id = await self._create_room(dormitory_id)
        room_response = await self._upload(
            f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images",
            ("room.jpg", JPEG_HEADER + b"image-data", "image/jpeg"),
        )
        self.assertEqual(len(room_response.json()["accepted"]), 1)
        self.assertEqual(len(room_response.json()["rejected"]), 0)

    async def test_AC_DOR_10_accepts_file_at_5_mb_boundary(self) -> None:
        # Given เจ้าของเลือกไฟล์ JPG ขนาดเท่ากับ 5 MB
        dormitory_id = await self._create_dormitory()
        content = JPEG_HEADER + b"x" * (MAX_IMAGE_SIZE_BYTES - len(JPEG_HEADER))

        # When ระบบตรวจไฟล์รูปภาพ
        response = await self._upload(
            f"/owners/dormitories/{dormitory_id}/images",
            ("boundary.jpg", content, "image/jpeg"),
        )

        # Then ระบบรับไฟล์ขนาดไม่เกิน 5 MB และจัดเก็บครบถ้วน
        self.assertEqual(response.status_code, 200)
        accepted = response.json()["accepted"]
        self.assertEqual(len(accepted), 1)
        self.assertEqual(accepted[0]["file_size_bytes"], MAX_IMAGE_SIZE_BYTES)
        image_path = self._storage_path(accepted[0]["image_id"], "JPG")
        self.assertEqual(image_path.stat().st_size, MAX_IMAGE_SIZE_BYTES)

    async def test_AC_DOR_10_rejects_only_oversized_file(self) -> None:
        # Given เจ้าของเลือกไฟล์ที่เกิน 5 MB ร่วมกับไฟล์ที่ถูกต้อง
        dormitory_id = await self._create_dormitory()
        oversized = JPEG_HEADER + b"x" * (
            MAX_IMAGE_SIZE_BYTES + 1 - len(JPEG_HEADER)
        )

        # When ระบบตรวจไฟล์รูปภาพทั้งสองไฟล์
        response = await self._upload(
            f"/owners/dormitories/{dormitory_id}/images",
            ("valid.jpg", JPEG_HEADER + b"valid", "image/jpeg"),
            ("oversized.jpg", oversized, "image/jpeg"),
        )

        # Then ปฏิเสธเฉพาะไฟล์เกินขนาดและยังจัดเก็บไฟล์ถูกต้อง
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual([item["filename"] for item in result["accepted"]], ["valid.jpg"])
        self.assertEqual(
            [item["filename"] for item in result["rejected"]],
            ["oversized.jpg"],
        )
        self.assertIn("ไม่เกิน 5 MB", result["rejected"][0]["reason"])
        self.assertEqual(len(self._stored_image_rows()), 1)

    async def test_AC_DOR_10_accepts_tenth_image_per_dormitory_or_room(self) -> None:
        # Given หอพักและห้องพักแต่ละรายการมีรูปที่รับไว้แล้ว 9 รูป
        dormitory_id = await self._create_dormitory()
        room_id = await self._create_room(dormitory_id)
        image = ("existing.jpg", JPEG_HEADER + b"image-data", "image/jpeg")
        dormitory_url = f"/owners/dormitories/{dormitory_id}/images"
        room_url = f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images"
        dormitory_seed = await self._upload(dormitory_url, *([image] * 9))
        room_seed = await self._upload(room_url, *([image] * 9))
        self.assertEqual(len(dormitory_seed.json()["accepted"]), 9)
        self.assertEqual(len(room_seed.json()["accepted"]), 9)

        # When อัปโหลดรูปที่ 10 และรูปที่ 11 แยกในแต่ละขอบเขต
        tenth_dormitory = await self._upload(dormitory_url, image)
        tenth_room = await self._upload(room_url, image)
        eleventh_dormitory = await self._upload(dormitory_url, image)
        eleventh_room = await self._upload(room_url, image)

        # Then รับรูปที่ 10 ของทั้งสองขอบเขตและปฏิเสธเฉพาะรูปที่ 11
        self.assertEqual(len(tenth_dormitory.json()["accepted"]), 1)
        self.assertEqual(len(tenth_room.json()["accepted"]), 1)
        for response in (eleventh_dormitory, eleventh_room):
            self.assertEqual(len(response.json()["accepted"]), 0)
            self.assertEqual(len(response.json()["rejected"]), 1)
            self.assertIn("ไม่เกิน 10 รูป", response.json()["rejected"][0]["reason"])
        rows = self._stored_image_rows()
        self.assertEqual(sum(row["dormitory_id"] == dormitory_id for row in rows), 10)
        self.assertEqual(sum(row["room_id"] == room_id for row in rows), 10)

    async def test_AC_DOR_10_upload_checks_owner_and_room_relationship(self) -> None:
        # Given มีเจ้าของสองรายและห้องที่เชื่อมกับหอพักของ owner-1
        dormitory_id = await self._create_dormitory()
        another_dormitory_id = await self._create_dormitory()
        await self._create_dormitory("owner-2")
        room_id = await self._create_room(dormitory_id)
        image = ("image.jpg", JPEG_HEADER + b"image-data", "image/jpeg")

        # When ไม่มีตัวตน เจ้าของอื่นส่งคำขอ หรือระบุห้องไม่อยู่ใต้หอพักนั้น
        missing_owner = await self.client.post(
            f"/owners/dormitories/{dormitory_id}/images",
            files=[("files", image)],
        )
        foreign_owner = await self._upload(
            f"/owners/dormitories/{dormitory_id}/images",
            image,
            owner_id="owner-2",
        )
        mismatched_room = await self._upload(
            f"/owners/dormitories/{another_dormitory_id}/rooms/{room_id}/images",
            image,
        )

        # Then ปฏิเสธทุกคำขอที่ไม่มีสิทธิ์และไม่จัดเก็บไฟล์
        self.assertEqual(missing_owner.status_code, 401)
        self.assertEqual(foreign_owner.status_code, 404)
        self.assertEqual(mismatched_room.status_code, 404)
        self.assertEqual(self._stored_image_rows(), [])

