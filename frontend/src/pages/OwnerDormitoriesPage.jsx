import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOwnerDormitories } from "../api/client.js";

// รองรับ CON-ACC-01, CON-AUTH-01, FR-DOR-09 และ AC-DOR-07
export default function OwnerDormitoriesPage() {
  const [dormitories, setDormitories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDormitories() {
      try {
        const data = await getOwnerDormitories();
        if (active) setDormitories(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายการหอพักได้");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDormitories();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">จัดการข้อมูลหอพัก</h1>
        <Link
          to="/owner/dormitories/new"
          className="rounded-lg bg-primary px-5 py-2 font-medium text-white hover:bg-primary-dark"
        >
          เพิ่มหอพักใหม่
        </Link>
      </div>

      {loading && <p role="status">กำลังโหลดรายการหอพัก...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <ul aria-label="รายการหอพักของฉัน" className="space-y-4">
          {dormitories.map((dormitory) => (
            <li
              key={dormitory.dormitory_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sand bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="text-xl font-semibold">{dormitory.name}</h2>
                <p className="text-dark/70">{dormitory.location}</p>
              </div>
              <Link
                to={`/owner/dormitories/${encodeURIComponent(dormitory.dormitory_id)}/edit`}
                className="rounded-lg border border-dark px-4 py-2 font-medium hover:bg-sand/40"
              >
                แก้ไข
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
