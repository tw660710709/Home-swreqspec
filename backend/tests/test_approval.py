import sqlite3
import unittest
from contextlib import closing

from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from starlette.requests import Request

from backend.app.approval import get_current_admin
from backend.app.database import _connect, get_database_path, initialize_database
from backend.app.main import app


class DormitoryApprovalTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        initialize_database()
        self.previous_admin_dependency = app.dependency_overrides.get(
            get_current_admin
        )
        app.dependency_overrides[get_current_admin] = lambda: "admin-1"
        self.client = AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        )

    async def asyncTearDown(self) -> None:
        await self.client.aclose()
        if self.previous_admin_dependency is None:
            app.dependency_overrides.pop(get_current_admin, None)
        else:
            app.dependency_overrides[get_current_admin] = (
                self.previous_admin_dependency
            )

    async def create_dormitory(self, owner_id: str = "owner-1") -> str:
        response = await self.client.post(
            "/owners/dormitories",
            headers={"X-Owner-Id": owner_id},
            json={
                "name": "หอพักรอตรวจสอบ",
                "location": "ทำเลทดสอบ",
                "type": "หอพักรวม",
                "contact_info": "ช่องทางติดต่อ",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["dormitory_id"]

    async def test_AC_ADM_01_admin_lists_pending_and_views_details(self) -> None:
        dormitory_id = await self.create_dormitory()

        pending = await self.client.get("/admin/dormitories/pending")
        details = await self.client.get(f"/admin/dormitories/{dormitory_id}")

        self.assertEqual(pending.status_code, 200)
        listed = next(
            item for item in pending.json()
            if item["dormitory_id"] == dormitory_id
        )
        self.assertEqual(listed["status"], "Pending Review")
        self.assertEqual(details.status_code, 200)
        self.assertEqual(details.json()["name"], "หอพักรอตรวจสอบ")
        self.assertEqual(
            details.json()["required_fields"],
            ["name", "location", "type", "contact_info"],
        )
        self.assertEqual(details.json()["documents"], [])

    async def test_AC_ADM_01_admin_can_view_uploaded_form_attachment(self) -> None:
        dormitory_id = await self.create_dormitory()
        uploaded = await self.client.post(
            f"/owners/dormitories/{dormitory_id}/images",
            headers={"X-Owner-Id": "owner-1"},
            files={"files": ("registration.png", b"\x89PNG\r\n\x1a\n", "image/png")},
        )
        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        image_id = uploaded.json()["accepted"][0]["image_id"]

        details = await self.client.get(f"/admin/dormitories/{dormitory_id}")
        file_response = await self.client.get(
            f"/admin/dormitories/{dormitory_id}/documents/{image_id}"
        )

        self.assertEqual(details.status_code, 200)
        self.assertEqual(details.json()["documents"][0]["document_id"], image_id)
        self.assertEqual(file_response.status_code, 200)
        self.assertEqual(file_response.content, b"\x89PNG\r\n\x1a\n")

    async def test_AC_ADM_07_admin_routes_fail_closed_without_authentication(self) -> None:
        app.dependency_overrides.pop(get_current_admin, None)
        response = await self.client.get("/admin/dormitories/pending")
        self.assertEqual(response.status_code, 503)

        owner_request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/",
                "headers": [],
                "query_string": b"",
                "scheme": "http",
                "server": ("test", 80),
                "client": ("test", 1),
                "root_path": "",
                "state": {
                    "principal": {"id": "owner-1", "role": "Dormitory Owner"}
                },
            }
        )
        with self.assertRaises(HTTPException) as raised:
            get_current_admin(owner_request)
        self.assertEqual(raised.exception.status_code, 403)

    async def test_AC_ADM_02_approve_complete_required_form_fields(self) -> None:
        dormitory_id = await self.create_dormitory()

        response = await self.client.post(
            f"/admin/dormitories/{dormitory_id}/approve",
            json={},
        )
        history = await self.client.get(
            f"/admin/dormitories/{dormitory_id}/history"
        )
        notifications = await self.client.get(
            "/owner/notifications",
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["status"], "Approved")
        self.assertEqual(len(history.json()), 1)
        self.assertEqual(history.json()[0]["action"], "Approved")
        self.assertIsNone(history.json()[0]["reason"])
        self.assertEqual(notifications.json()[0]["action"], "Approved")

    async def test_AC_ADM_06_approval_rejects_missing_required_field(self) -> None:
        dormitory_id = await self.create_dormitory()
        initialize_database()
        with closing(_connect(get_database_path().resolve())) as connection:
            connection.execute(
                "UPDATE owner_dormitories SET contact_info = '' WHERE dormitory_id = ?",
                (dormitory_id,),
            )
            connection.commit()

        response = await self.client.post(
            f"/admin/dormitories/{dormitory_id}/approve",
            json={},
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("Required", response.json()["detail"])
        with closing(_connect(get_database_path().resolve())) as connection:
            status = connection.execute(
                "SELECT approval_status FROM owner_dormitories WHERE dormitory_id = ?",
                (dormitory_id,),
            ).fetchone()["approval_status"]
            history_count = connection.execute(
                "SELECT COUNT(*) FROM approval_history WHERE dormitory_id = ?",
                (dormitory_id,),
            ).fetchone()[0]
        self.assertEqual(status, "Pending")
        self.assertEqual(history_count, 0)

    async def test_AC_ADM_03_revision_reason_boundaries_and_notification(self) -> None:
        for reason in ("R", "R" * 500):
            dormitory_id = await self.create_dormitory()
            response = await self.client.post(
                f"/admin/dormitories/{dormitory_id}/revision",
                json={"reason": reason},
            )
            self.assertEqual(response.status_code, 200, response.text)

            history = await self.client.get(
                f"/admin/dormitories/{dormitory_id}/history"
            )
            notifications = await self.client.get(
                "/owner/notifications",
                headers={"X-Owner-Id": "owner-1"},
            )
            self.assertEqual(history.json()[0]["reason"], reason)
            self.assertEqual(notifications.json()[0]["action"], "Need Revision")
            self.assertEqual(notifications.json()[0]["reason"], reason)

    async def test_AC_ADM_03_revision_rejects_empty_or_overlength_reason(self) -> None:
        for reason in ("", "   ", "R" * 501):
            dormitory_id = await self.create_dormitory()
            response = await self.client.post(
                f"/admin/dormitories/{dormitory_id}/revision",
                json={"reason": reason},
            )
            self.assertEqual(response.status_code, 422)
            with closing(_connect(get_database_path().resolve())) as connection:
                status = connection.execute(
                    "SELECT approval_status FROM owner_dormitories WHERE dormitory_id = ?",
                    (dormitory_id,),
                ).fetchone()["approval_status"]
                history_count = connection.execute(
                    "SELECT COUNT(*) FROM approval_history WHERE dormitory_id = ?",
                    (dormitory_id,),
                ).fetchone()[0]
            self.assertEqual(status, "Pending")
            self.assertEqual(history_count, 0)

    async def test_AC_ADM_04_reject_reason_boundaries_and_notification(self) -> None:
        for reason in ("R", "R" * 500):
            dormitory_id = await self.create_dormitory()
            response = await self.client.post(
                f"/admin/dormitories/{dormitory_id}/reject",
                json={"reason": reason},
            )
            self.assertEqual(response.status_code, 200, response.text)

            history = await self.client.get(
                f"/admin/dormitories/{dormitory_id}/history"
            )
            notifications = await self.client.get(
                "/owner/notifications",
                headers={"X-Owner-Id": "owner-1"},
            )
            self.assertEqual(history.json()[0]["reason"], reason)
            self.assertEqual(notifications.json()[0]["action"], "Rejected")
            self.assertEqual(notifications.json()[0]["reason"], reason)

    async def test_AC_ADM_04_reject_rejects_empty_or_overlength_reason(self) -> None:
        for reason in ("", "   ", "R" * 501):
            dormitory_id = await self.create_dormitory()
            response = await self.client.post(
                f"/admin/dormitories/{dormitory_id}/reject",
                json={"reason": reason},
            )
            self.assertEqual(response.status_code, 422)
            with closing(_connect(get_database_path().resolve())) as connection:
                status = connection.execute(
                    "SELECT approval_status FROM owner_dormitories WHERE dormitory_id = ?",
                    (dormitory_id,),
                ).fetchone()["approval_status"]
            self.assertEqual(status, "Pending")

    async def test_AC_ADM_05_history_is_append_only_and_auditable(self) -> None:
        dormitory_id = await self.create_dormitory()
        await self.client.post(
            f"/admin/dormitories/{dormitory_id}/revision",
            json={"reason": "กรุณาแก้ไขข้อมูล"},
        )
        history = await self.client.get(
            f"/admin/dormitories/{dormitory_id}/history"
        )

        self.assertEqual(history.status_code, 200)
        entry = history.json()[0]
        self.assertEqual(entry["admin_id"], "admin-1")
        self.assertEqual(entry["dormitory_id"], dormitory_id)
        self.assertEqual(entry["action"], "Need Revision")
        self.assertTrue(entry["history_id"])
        self.assertTrue(entry["created_at"])
        self.assertEqual(entry["reason"], "กรุณาแก้ไขข้อมูล")

        with closing(_connect(get_database_path().resolve())) as connection:
            with self.assertRaises(sqlite3.IntegrityError):
                connection.execute(
                    "UPDATE approval_history SET reason = 'เขียนทับ' WHERE history_id = ?",
                    (entry["history_id"],),
                )
            with self.assertRaises(sqlite3.IntegrityError):
                connection.execute(
                    "DELETE FROM approval_history WHERE history_id = ?",
                    (entry["history_id"],),
                )
            count = connection.execute(
                "SELECT COUNT(*) FROM approval_history WHERE dormitory_id = ?",
                (dormitory_id,),
            ).fetchone()[0]
        self.assertEqual(count, 1)

    async def test_AC_ADM_05_multiple_revision_rounds_keep_all_history(self) -> None:
        dormitory_id = await self.create_dormitory()
        for round_number in (1, 2):
            revision = await self.client.post(
                f"/admin/dormitories/{dormitory_id}/revision",
                json={"reason": f"แก้ไขรอบ {round_number}"},
            )
            self.assertEqual(revision.status_code, 200, revision.text)
            updated = await self.client.put(
                f"/owners/dormitories/{dormitory_id}",
                headers={"X-Owner-Id": "owner-1"},
                json={
                    "name": f"หอพักแก้ไขรอบ {round_number}",
                    "location": "ทำเลทดสอบ",
                    "type": "หอพักรวม",
                    "contact_info": "ช่องทางติดต่อ",
                },
            )
            self.assertEqual(updated.status_code, 200, updated.text)
            self.assertEqual(updated.json()["approval_status"], "Need Revision")
            resubmitted = await self.client.post(
                f"/owner/dormitories/{dormitory_id}/resubmit-review",
                headers={"X-Owner-Id": "owner-1"},
            )
            self.assertEqual(resubmitted.status_code, 200, resubmitted.text)
            self.assertEqual(resubmitted.json()["status"], "Pending Review")

        approved = await self.client.post(
            f"/admin/dormitories/{dormitory_id}/approve",
            json={},
        )
        history = await self.client.get(
            f"/admin/dormitories/{dormitory_id}/history"
        )
        self.assertEqual(approved.status_code, 200, approved.text)
        self.assertEqual(
            [entry["action"] for entry in history.json()],
            ["Need Revision", "Need Revision", "Approved"],
        )
        self.assertEqual(
            [entry["reason"] for entry in history.json()],
            ["แก้ไขรอบ 1", "แก้ไขรอบ 2", None],
        )

    async def test_CON_ADM_05_only_approved_dormitories_are_public(self) -> None:
        dormitory_id = await self.create_dormitory()
        hidden = await self.client.get(f"/dormitories/{dormitory_id}")
        self.assertEqual(hidden.status_code, 404)

        approved = await self.client.post(
            f"/admin/dormitories/{dormitory_id}/approve",
            json={},
        )
        visible = await self.client.get(f"/dormitories/{dormitory_id}")
        self.assertEqual(approved.status_code, 200, approved.text)
        self.assertEqual(visible.status_code, 200)

    async def test_AC_ADM_08_database_failure_rolls_back_status_history_and_notification(
        self,
    ) -> None:
        dormitory_id = await self.create_dormitory()
        initialize_database()
        with closing(_connect(get_database_path().resolve())) as connection:
            connection.execute(
                """
                CREATE TRIGGER fail_notification_insert
                BEFORE INSERT ON owner_notifications
                BEGIN
                    SELECT RAISE(ABORT, 'notification insert failed');
                END
                """
            )
            connection.commit()

        response = await self.client.post(
            f"/admin/dormitories/{dormitory_id}/revision",
            json={"reason": "กรุณาแก้ไขข้อมูล"},
        )
        notifications = await self.client.get(
            "/owner/notifications",
            headers={"X-Owner-Id": "owner-1"},
        )

        self.assertEqual(response.status_code, 500)
        self.assertIn("ไม่สามารถบันทึกผล", response.json()["detail"])
        with closing(_connect(get_database_path().resolve())) as connection:
            status = connection.execute(
                "SELECT approval_status FROM owner_dormitories WHERE dormitory_id = ?",
                (dormitory_id,),
            ).fetchone()["approval_status"]
            history_count = connection.execute(
                "SELECT COUNT(*) FROM approval_history WHERE dormitory_id = ?",
                (dormitory_id,),
            ).fetchone()[0]
        self.assertEqual(status, "Pending")
        self.assertEqual(history_count, 0)
        self.assertEqual(notifications.json(), [])

    async def test_FR_ADM_09_owner_notifications_are_scoped_to_owner(self) -> None:
        dormitory_id = await self.create_dormitory(owner_id="owner-1")
        await self.client.post(
            f"/admin/dormitories/{dormitory_id}/revision",
            json={"reason": "กรุณาแก้ไขข้อมูล"},
        )

        owner_notifications = await self.client.get(
            "/owner/notifications",
            headers={"X-Owner-Id": "owner-1"},
        )
        other_notifications = await self.client.get(
            "/owner/notifications",
            headers={"X-Owner-Id": "owner-2"},
        )

        self.assertEqual(len(owner_notifications.json()), 1)
        self.assertEqual(other_notifications.json(), [])

    async def test_CON_ADM_06_resubmission_requires_need_revision_and_owner(self) -> None:
        dormitory_id = await self.create_dormitory()

        wrong_owner = await self.client.post(
            f"/owner/dormitories/{dormitory_id}/resubmit-review",
            headers={"X-Owner-Id": "owner-2"},
        )
        wrong_status = await self.client.post(
            f"/owner/dormitories/{dormitory_id}/resubmit-review",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(wrong_owner.status_code, 409)
        self.assertEqual(wrong_status.status_code, 409)

        revision = await self.client.post(
            f"/admin/dormitories/{dormitory_id}/revision",
            json={"reason": "กรุณาแก้ไขข้อมูล"},
        )
        resubmitted = await self.client.post(
            f"/owner/dormitories/{dormitory_id}/resubmit-review",
            headers={"X-Owner-Id": "owner-1"},
        )
        self.assertEqual(revision.status_code, 200, revision.text)
        self.assertEqual(resubmitted.status_code, 200, resubmitted.text)
