import { useEffect, useState } from "react";
import {
  approveDormitory,
  getDormitoryApprovalHistory,
  getDormitoryForReview,
  getPendingDormitories,
  rejectDormitory,
  requestDormitoryRevision,
} from "../api/client.js";

export default function AdminDormitoryReviewPage() {
  const [dormitories, setDormitories] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [dormitory, setDormitory] = useState(null);
  const [history, setHistory] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // รองรับ FR-ADM-01, AC-ADM-01
  useEffect(() => {
    let active = true;
    getPendingDormitories()
      .then((items) => {
        if (active) {
          setDormitories(items);
          setLoading(false);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // รองรับ FR-ADM-02, FR-ADM-08, AC-ADM-01, AC-ADM-05
  async function selectDormitory(dormitoryId) {
    setSelectedId(dormitoryId);
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const [details, entries] = await Promise.all([
        getDormitoryForReview(dormitoryId),
        getDormitoryApprovalHistory(dormitoryId),
      ]);
      setDormitory(details);
      setHistory(entries);
    } catch (requestError) {
      setError(requestError.message);
      setDormitory(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  // รองรับ FR-ADM-04 ถึง FR-ADM-06, FR-ADM-08, FR-ADM-09,
  // CON-ADM-03 และ AC-ADM-02 ถึง AC-ADM-05
  async function submitDecision(action) {
    if (!selectedId) return;
    if (
      action !== "Approved" &&
      (!reason.trim() || reason.length < 1 || reason.length > 500)
    ) {
      setError("เหตุผลต้องมีความยาว 1–500 ตัวอักษร");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (action === "Approved") await approveDormitory(selectedId, reason);
      if (action === "Need Revision") {
        await requestDormitoryRevision(selectedId, reason);
      }
      if (action === "Rejected") await rejectDormitory(selectedId, reason);
      setReason("");
      setDormitories(await getPendingDormitories());
      await selectDormitory(selectedId);
      setSuccess("บันทึกผลการตรวจสอบสำเร็จ");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold">ตรวจสอบและอนุมัติหอพัก</h1>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4">{success}</p>}
      {loading && <p role="status">กำลังโหลดข้อมูลการตรวจสอบ...</p>}
      <div className="grid gap-6 md:grid-cols-[minmax(16rem,1fr)_2fr]">
        <section aria-label="รายการหอพักรอตรวจสอบ">
          <h2 className="mb-3 text-xl font-semibold">รอตรวจสอบ</h2>
          {dormitories.length === 0 && !loading && (
            <p>ไม่มีหอพักที่รอตรวจสอบ</p>
          )}
          <ul className="space-y-2">
            {dormitories.map((item) => (
              <li key={item.dormitory_id}>
                <button
                  type="button"
                  aria-pressed={selectedId === item.dormitory_id}
                  onClick={() => selectDormitory(item.dormitory_id)}
                  className="w-full rounded-lg border border-dark/20 bg-white p-3 text-left hover:bg-sand/40"
                >
                  <span className="block font-medium">{item.name}</span>
                  <span className="text-sm">{item.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {dormitory && (
          <section aria-label="รายละเอียดการตรวจสอบ" className="space-y-5">
            <div>
              <h2 className="mb-3 text-xl font-semibold">{dormitory.name}</h2>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div><dt className="font-medium">ที่อยู่/ทำเล</dt><dd>{dormitory.location}</dd></div>
                <div><dt className="font-medium">ประเภทหอพัก</dt><dd>{dormitory.type}</dd></div>
                <div><dt className="font-medium">ช่องทางติดต่อ</dt><dd>{dormitory.contact_info}</dd></div>
                <div><dt className="font-medium">สถานะ</dt><dd>{dormitory.status}</dd></div>
                <div><dt className="font-medium">สิ่งอำนวยความสะดวก</dt><dd>{dormitory.amenities.join(", ")}</dd></div>
                <div><dt className="font-medium">กฎระเบียบ</dt><dd>{dormitory.rules || "—"}</dd></div>
              </dl>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">ข้อมูล Required ในแบบฟอร์ม</h3>
              {dormitory.missing_required_fields.length === 0 ? (
                <p>ข้อมูลที่กำหนดเป็น Required ครบถ้วน</p>
              ) : (
                <p role="alert">
                  ข้อมูลที่ยังไม่ครบ: {dormitory.missing_required_fields.join(", ")}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">เอกสารประกอบ</h3>
              {dormitory.documents.length === 0 ? (
                <p>ไม่มีเอกสารประกอบที่อัปโหลด</p>
              ) : (
                <ul className="list-inside list-disc">
                  {dormitory.documents.map((document) => (
                    <li key={document.document_id}>
                      <a
                        className="text-primary underline"
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {document.document_type} ({document.status})
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {dormitory.status === "Pending Review" && (
              <div className="space-y-3">
                <label htmlFor="review-reason" className="block font-medium">
                  เหตุผลสำหรับขอแก้ไขหรือปฏิเสธ (1–500 ตัวอักษร)
                </label>
                <textarea
                  id="review-reason"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
                />
                <p className="text-sm">{reason.length}/500</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={saving || !dormitory.required_fields_complete}
                    onClick={() => submitDecision("Approved")}
                    className="rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    อนุมัติ
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => submitDecision("Need Revision")}
                    className="rounded-lg border border-dark px-4 py-2 font-medium disabled:opacity-50"
                  >
                    ขอให้แก้ไข
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => submitDecision("Rejected")}
                    className="rounded-lg border border-dark px-4 py-2 font-medium disabled:opacity-50"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-lg font-semibold">ประวัติการตรวจสอบ</h3>
              {history.length === 0 ? (
                <p>ยังไม่มีประวัติการตรวจสอบ</p>
              ) : (
                <ol className="space-y-2">
                  {history.map((entry) => (
                    <li key={entry.history_id} className="rounded-lg border border-dark/20 p-3">
                      <p className="font-medium">{entry.action}</p>
                      <p>{entry.created_at}</p>
                      {entry.reason && <p>เหตุผล: {entry.reason}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
