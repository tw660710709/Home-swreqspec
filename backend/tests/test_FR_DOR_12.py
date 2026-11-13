import sqlite3
import unittest
from pathlib import Path

from httpx import ASGITransport, AsyncClient, Response

from backend.app.database import get_database_path, initialize_database
from backend.app.main import app


JPEG_CONTENT = b"\xff\xd8\xffsaved-image"


class OwnerSavedImageManagementTests(unittest.IsolatedAsyncioTestCase):
    # รองรับ CON-AUTH-01, CON-FILE-01 และ FR-DOR-12
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
                "name": "หอพักจัดการรูป",
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

    async def _upload(self, path: str, *contents: bytes) -> list[dict[str, object]]:
        response = await self.client.post(
            path,
            headers={"X-Owner-Id": "owner-1"},
            files=[
                ("files", (f"image-{index}.jpg", content, "image/jpeg"))
                for index, content in enumerate(contents)
            ],
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["accepted"]

    def _storage_path(self, image_id: str) -> Path:
        return (
            get_database_path().resolve().parent
            / "owner_dormitory_images"
            / f"{image_id}.jpg"
        )

    def _stored_image_ids(self) -> set[str]:
        connection = sqlite3.connect(get_database_path())
        try:
            return {
                row[0]
                for row in connection.execute(
                    "SELECT image_id FROM owner_dormitory_images"
                )
            }
        finally:
            connection.close()

    async def test_FR_DOR_12_owner_lists_and_views_saved_dormitory_and_room_images(
        self,
    ) -> None:
        dormitory_id = await self._create_dormitory()
        room_id = await self._create_room(dormitory_id)
        dormitory_image = (
            await self._upload(
                f"/owners/dormitories/{dormitory_id}/images",
                JPEG_CONTENT,
            )
        )[0]
        room_image = (
            await self._upload(
                f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images",
                JPEG_CONTENT,
            )
        )[0]

        dormitory_list = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/images",
            headers={"X-Owner-Id": "owner-1"},
        )
        room_list = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images",
            headers={"X-Owner-Id": "owner-1"},
        )
        dormitory_file = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/images/{dormitory_image['image_id']}",
            headers={"X-Owner-Id": "owner-1"},
        )
        room_file = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images/{room_image['image_id']}",
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(dormitory_list.status_code, 200)
        self.assertEqual(dormitory_list.json()[0]["image_id"], dormitory_image["image_id"])
        self.assertEqual(dormitory_list.json()[0]["approval_status"], "Pending")
        self.assertEqual(room_list.status_code, 200)
        self.assertEqual(room_list.json()[0]["image_id"], room_image["image_id"])
        self.assertEqual(dormitory_file.content, JPEG_CONTENT)
        self.assertEqual(room_file.content, JPEG_CONTENT)

    async def test_FR_DOR_12_owner_deletes_saved_images_and_can_replace_under_limit(
        self,
    ) -> None:
        dormitory_id = await self._create_dormitory()
        room_id = await self._create_room(dormitory_id)
        dormitory_path = f"/owners/dormitories/{dormitory_id}/images"
        room_path = f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images"
        dormitory_images = await self._upload(dormitory_path, *([JPEG_CONTENT] * 10))
        room_images = await self._upload(room_path, *([JPEG_CONTENT] * 10))

        for path, image in (
            (dormitory_path, dormitory_images[0]),
            (room_path, room_images[0]),
        ):
            deleted = await self.client.delete(
                f"{path}/{image['image_id']}",
                headers={"X-Owner-Id": "owner-1"},
            )
            self.assertEqual(deleted.status_code, 204)
            self.assertFalse(self._storage_path(image["image_id"]).exists())

        dormitory_replacement = await self._upload(dormitory_path, JPEG_CONTENT)
        room_replacement = await self._upload(room_path, JPEG_CONTENT)
        self.assertEqual(len(dormitory_replacement), 1)
        self.assertEqual(len(room_replacement), 1)

        dormitory_list = await self.client.get(
            dormitory_path,
            headers={"X-Owner-Id": "owner-1"},
        )
        room_list = await self.client.get(
            room_path,
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(len(dormitory_list.json()), 10)
        self.assertEqual(len(room_list.json()), 10)

    async def test_FR_DOR_12_image_read_and_delete_check_owner_and_room_link(
        self,
    ) -> None:
        dormitory_id = await self._create_dormitory()
        foreign_dormitory_id = await self._create_dormitory("owner-2")
        room_id = await self._create_room(dormitory_id)
        image = (
            await self._upload(
                f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images",
                JPEG_CONTENT,
            )
        )[0]
        image_path = f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images/{image['image_id']}"

        missing_owner = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images"
        )
        foreign_list = await self.client.get(
            f"/owners/dormitories/{dormitory_id}/rooms/{room_id}/images",
            headers={"X-Owner-Id": "owner-2"},
        )
        mismatched_room = await self.client.delete(
            f"/owners/dormitories/{foreign_dormitory_id}/rooms/{room_id}/images/{image['image_id']}",
            headers={"X-Owner-Id": "owner-1"},
        )
        foreign_file = await self.client.get(
            image_path,
            headers={"X-Owner-Id": "owner-2"},
        )
        foreign_delete = await self.client.delete(
            image_path,
            headers={"X-Owner-Id": "owner-2"},
        )

        self.assertEqual(missing_owner.status_code, 401)
        self.assertEqual(foreign_list.status_code, 404)
        self.assertEqual(mismatched_room.status_code, 404)
        self.assertEqual(foreign_file.status_code, 404)
        self.assertEqual(foreign_delete.status_code, 404)
        self.assertIn(image["image_id"], self._stored_image_ids())

        deleted = await self.client.delete(
            image_path,
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(deleted.status_code, 204)
