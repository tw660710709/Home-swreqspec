import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getOwnerNotifications,
  resubmitDormitoryForReview,
} from "../api/client.js";

export default function OwnerNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittingId, setSubmittingId] = useState("");

  // รองรับ FR-ADM-09, AC-ADM-03, AC-ADM-04
  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      setNotifications(await getOwnerNotifications());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  // รองรับ FR-ADM-07, CON-ADM-06 และ ASM-08
  async function resubmit(dormitoryId) {
    setSubmittingId(dormitoryId);
    setError("");
    setSuccess("");
    try {
      await resubmitDormitoryForReview(dormitoryId);
      setSuccess("ส่งตรวจสอบหอพักใหม่สำเร็จ");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmittingId("");
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold">การแจ้งเตือน</h1>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4">{success}</p>}
      {loading && <p role="status">กำลังโหลดการแจ้งเตือน...</p>}
      {!loading && notifications.length === 0 && !error && (
        <p>ไม่มีการแจ้งเตือน</p>
      )}
      <ol className="space-y-4">
        {notifications.map((notification) => (
          <li
            key={notification.notification_id}
            className="rounded-xl border border-dark/20 bg-white p-4"
          >
            <h2 className="text-lg font-semibold">{notification.action}</h2>
            <p>{notification.message}</p>
            {notification.reason && <p>เหตุผล: {notification.reason}</p>}
            <p className="mt-2 text-sm text-dark/70">{notification.created_at}</p>
            {notification.action === "Need Revision" && (
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  to={`/owner/dormitories/${encodeURIComponent(notification.dormitory_id)}/edit`}
                  className="font-medium text-primary underline"
                >
                  แก้ไขข้อมูลหอพัก
                </Link>
                <button
                  type="button"
                  disabled={submittingId === notification.dormitory_id}
                  onClick={() => resubmit(notification.dormitory_id)}
                  className="rounded-lg border border-dark px-3 py-1 disabled:opacity-50"
                >
                  {submittingId === notification.dormitory_id
                    ? "กำลังส่ง..."
                    : "ส่งตรวจสอบใหม่"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
