import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOwnerDormitory } from "../api/client.js";

const fields = [
  ["name", "ชื่อหอพัก"],
  ["location", "ที่อยู่/ทำเล"],
  ["type", "ประเภทหอพัก"],
  ["contact_info", "ช่องทางติดต่อ"],
  ["amenities", "สิ่งอำนวยความสะดวก"],
  ["rules", "กฎระเบียบ"],
];

// รองรับ CON-ACC-01, CON-AUTH-01, FR-DOR-11 และ AC-DOR-07
export default function OwnerDormitoryFormPage() {
  const { dormitoryId } = useParams();
  const [dormitory, setDormitory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDormitory() {
      try {
        const data = await getOwnerDormitory(dormitoryId);
        if (active) setDormitory(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลหอพักได้");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDormitory();
    return () => {
      active = false;
    };
  }, [dormitoryId]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold">แก้ไขข้อมูลหอพัก</h1>
      {loading && <p role="status">กำลังโหลดข้อมูลหอพัก...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && dormitory && (
        <>
          <p className="mb-4 text-sm text-dark/70">
            รหัสหอพัก: {dormitory.dormitory_id}
          </p>
          <form className="space-y-4">
            {fields.map(([name, label]) => {
              const value = dormitory[name];
              return (
                <div key={name}>
                  <label htmlFor={name} className="mb-1 block font-medium">
                    {label}
                  </label>
                  <input
                    id={name}
                    name={name}
                    value={
                      Array.isArray(value)
                        ? value.join(", ")
                        : value ?? ""
                    }
                    readOnly
                    className="w-full rounded-lg border border-dark/20 bg-sand/20 px-3 py-2"
                  />
                </div>
              );
            })}
          </form>
        </>
      )}
      <Link
        to="/owner/dormitories"
        className="mt-6 inline-block font-medium text-primary hover:underline"
      >
        กลับไปรายการหอพัก
      </Link>
    </section>
  );
}
