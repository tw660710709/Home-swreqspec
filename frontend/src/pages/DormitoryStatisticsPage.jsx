import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  downloadDormitoryStatisticsReport,
  getDormitoryStatistics,
} from "../api/dormApi.js";

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

function SummaryCard({ label, value, tone = "primary" }) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-sand text-dark",
    success: "bg-emerald-100 text-emerald-700",
    accent: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
        {label}
      </div>
      <div className="mt-4 text-3xl font-bold">{value}</div>
    </div>
  );
}

export default function DormitoryStatisticsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("ownerId") || "owner-1";
  const initialRange = useMemo(defaultDateRange, []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const loadStatistics = async (nextStartDate = startDate, nextEndDate = endDate) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const result = await getDormitoryStatistics({
        dormitoryId: id,
        ownerId,
        startDate: nextStartDate,
        endDate: nextEndDate,
      });
      setStats(result);
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดสถิติหอพักได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ownerId]);

  const totalRooms = stats
    ? (stats.summary.total_rooms ?? stats.summary.vacant_rooms + stats.summary.occupied_rooms)
    : 0;

  const chartValues = stats
    ? [
        stats.summary.vacant_rooms,
        stats.summary.occupied_rooms,
        stats.summary.detail_page_views,
        stats.summary.appointments_count,
      ]
    : [0, 0, 0, 0];
  const maxChartValue = Math.max(...chartValues, 1);
  const labels = ["ห้องว่าง", "ห้องเต็ม", "ผู้เข้าชม", "การนัดหมาย"];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (endDate < startDate) {
      setError("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
      return;
    }
    loadStatistics(startDate, endDate);
  };

  const handleDownload = async () => {
    if (endDate < startDate) {
      setError("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น");
      return;
    }
    setError("");
    setDownloading(true);
    try {
      const report = await downloadDormitoryStatisticsReport({
        dormitoryId: id,
        ownerId,
        startDate,
        endDate,
      });
      const url = URL.createObjectURL(report);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dormitory-statistics-${id}-${startDate}-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "ไม่สามารถดาวน์โหลดรายงานสถิติได้");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">View Dormitory Statistics</p>
          <h1 className="mt-1 text-3xl font-bold">สถิติหอพัก</h1>
        </div>
        <Link
          to={`/dorms/${id}`}
          className="inline-flex rounded-lg border border-dark px-4 py-2 text-sm font-medium hover:bg-sand/40"
        >
          กลับไปรายละเอียดหอพัก
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">
            <span className="mb-1 block">วันที่เริ่มต้น</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            <span className="mb-1 block">วันที่สิ้นสุด</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary-dark"
            >
              ยืนยันช่วงเวลา
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl bg-white p-6 shadow-sm">กำลังโหลดสถิติหอพัก...</div>
      ) : stats ? (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg border border-primary px-4 py-2 font-medium text-primary hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60"
            >
              {downloading ? "กำลังสร้างรายงาน..." : "ดาวน์โหลดรายงาน CSV"}
            </button>
          </div>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <SummaryCard label="จำนวนห้องทั้งหมด" value={totalRooms} tone="neutral" />
            <SummaryCard label="ห้องว่าง" value={stats.summary.vacant_rooms} tone="success" />
            <SummaryCard label="ห้องเต็ม" value={stats.summary.occupied_rooms} tone="accent" />
          </div>
          {stats.empty_data ? (
            <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
              <p>ยังไม่มีข้อมูลสถิติในรอบเวลานี้</p>
              <p className="mt-2 text-sm text-dark/70">เลือกช่วงเวลาใหม่เพื่อดูข้อมูลสถิติ</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard label="ผู้เข้าชม" value={stats.summary.detail_page_views} tone="primary" />
                <SummaryCard label="การนัดหมาย" value={stats.summary.appointments_count} tone="neutral" />
              </div>

              <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">กราฟสรุป</h2>
                <div className="grid h-52 grid-cols-4 items-end gap-4">
                  {chartValues.map((value, index) => (
                    <div key={labels[index]} className="flex h-full flex-col items-center justify-end gap-3">
                      <div className="w-full rounded-t-xl bg-primary/80" style={{ height: `${(value / maxChartValue) * 100}%` }} />
                      <span className="text-center text-xs font-medium text-dark/70">{labels[index]}</span>
                      <strong className="text-xs">{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
