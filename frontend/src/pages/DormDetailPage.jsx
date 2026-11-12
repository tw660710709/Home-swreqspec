import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDormitoryDetail } from "../api/dormApi.js";

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function DormitoryDetail({ detail }) {
  const mainImage = detail.images?.[0];

  return (
    <article>
      {/* ---------- หัวข้อ ---------- */}
      <h1 className="text-5xl font-bold">{detail.name}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-2xl">{detail.location}</p>
        <span className="rounded-full bg-primary/15 px-4 py-1.5">
          ประเภท: <span className="text-primary">{detail.type}</span>
        </span>
        {detail.verified_badge && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
            Verified
          </span>
        )}
      </div>

      {/* ---------- รูป + ช่องทางติดต่อ ---------- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* รูปภาพ */}
        <div>
          <div className="flex h-96 items-center justify-center overflow-hidden rounded-2xl border border-dark/10 bg-sand">
            {mainImage ? (
              <img
                src={mainImage.url}
                alt={mainImage.caption}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-dark/60">รูปภาพห้องพัก</span>
            )}
          </div>
          {mainImage?.caption && (
            <p className="mt-2 text-sm text-dark/70">{mainImage.caption}</p>
          )}

          {detail.images?.length > 1 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {detail.images.slice(1).map((img) => (
                <li key={img.url}>
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="h-32 w-full rounded-lg object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ช่องทางติดต่อ (มีกรอบ) */}
        <aside className="h-fit rounded-2xl border border-dark/30 bg-sand/60 p-6">
          <h2 className="text-2xl font-bold">ช่องทางติดต่อ</h2>
          <p className="mt-3">{detail.contact_info}</p>
        </aside>
      </div>

      {/* ---------- สิ่งอำนวยความสะดวก (ไม่มีกรอบ) ---------- */}
      <Section title="สิ่งอำนวยความสะดวก">
        <ul className="space-y-1">
          {detail.amenities.map((a) => (
            <li key={a}>- {a}</li>
          ))}
        </ul>
      </Section>

      <Section title="กฎระเบียบ">
        <p>{detail.rules}</p>
      </Section>

      <Section title="ข้อมูลความปลอดภัย">
        <p>{detail.security_info}</p>
      </Section>

      {/* ---------- ราคาค่าเช่าและค่าใช้จ่าย (ใต้สิ่งอำนวย) ---------- */}
      <Section title="ราคาค่าเช่าและค่าใช้จ่าย">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {detail.rooms.map((room) => (
            <li
              key={room.id}
              className="space-y-1 rounded-2xl border-2 border-sand bg-white p-5"
            >
              <h3 className="font-bold">{room.name}</h3>
              <p>ค่าเช่า: {Number(room.monthly_rent).toLocaleString("th-TH")} บาท</p>
              <p>ค่าน้ำ: {Number(room.water_fee).toLocaleString("th-TH")} บาท</p>
              <p>ค่าไฟ: {Number(room.electricity_fee).toLocaleString("th-TH")} บาท</p>
              <p>ค่ามัดจำ: {Number(room.deposit).toLocaleString("th-TH")} บาท</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- สถานที่ใกล้เคียง (ล่างสุด) ---------- */}
      <Section title="สถานที่ใกล้เคียง">
        <ul className="space-y-1">
          {detail.nearby_places.map((p) => (
            <li key={p.name}>
              - {p.name} — {p.distance_text}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}

export default function DormDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDetail(await getDormitoryDetail(id));
    } catch (e) {
      setDetail(null);
      setError(e.message || "ไม่สามารถโหลดข้อมูลหอพักได้");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-2 hover:text-primary">
          ← กลับหน้าแรก
        </Link>
        <Link
          to={`/dorms/${id}/statistics?ownerId=owner-1`}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
        >
          ดูสถิติหอพัก
        </Link>
      </div>

      {loading && (
        <p role="status" className="mt-4">
          กำลังโหลดรายละเอียดหอพัก...
        </p>
      )}

      {error && (
        <div role="alert" className="mt-4">
          <p>ไม่สามารถโหลดข้อมูลได้</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-white"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {detail && (
        <div className="mt-6">
          <DormitoryDetail detail={detail} />
        </div>
      )}
    </div>
  );
}