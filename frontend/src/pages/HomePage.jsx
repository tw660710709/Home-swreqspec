import { useNavigate } from "react-router-dom";
import useDorms from "../hooks/useDorms.js";
import { formatPriceRange } from "../utils/format.js";

/* ---------- Hero ---------- */
function HeroSection() {
  return (
    <div className="px-6 pt-16 pb-24 text-center bg-[image:var(--hero-gradient)]">
      <h1 className="text-5xl font-bold">ค้นหาหอพักที่ใช่สำหรับคุณ</h1>
      <p className="mt-3 text-2xl">
        สะดวก รวดเร็ว และ<span className="text-primary">ตอบโจทย์ทุกไลฟ์สไตล์</span>
      </p>
    </div>
  );
}

/* ---------- Search Filter ---------- */
const inputClass =
  "w-full rounded-lg border border-dark/20 bg-white px-3 py-2 outline-none focus:border-primary";

function Field({ id, label, children }) {
  return (
    <div className="text-sm font-medium">
      <label htmlFor={id} className="block">
        {label}
      </label>
      {children}
    </div>
  );
}

function SearchFilter({ filters, onChange, onSubmit, onClear }) {
  return (
    <form
      onSubmit={onSubmit}
      className="-mt-12 mx-auto grid max-w-5xl grid-cols-1 items-end gap-4 rounded-2xl bg-white p-6 shadow-lg md:grid-cols-[2fr_1.2fr_1fr_1fr_auto_auto]"
    >
      <Field id="query" label="ค้นหาชื่อหอพักหรือทำเล">
        <input
          id="query"
          name="query"
          type="search"
          value={filters.query}
          onChange={onChange}
          placeholder="ระบุชื่อหอพักหรือทำเล"
          className={`${inputClass} mt-1`}
        />
      </Field>

      <Field id="dormitoryType" label="ประเภทหอพัก">
        <select
          id="dormitoryType"
          name="dormitoryType"
          value={filters.dormitoryType}
          onChange={onChange}
          className={`${inputClass} mt-1 bg-sand/40`}
        >
          <option value="">ทุกประเภท</option>
          <option value="หอพักชาย">หอพักชาย</option>
          <option value="หอพักหญิง">หอพักหญิง</option>
          <option value="หอพักรวม">หอพักรวม</option>
        </select>
      </Field>

      <Field id="minPrice" label="ราคาต่ำสุด">
        <input
          id="minPrice"
          name="minPrice"
          type="number"
          min="0"
          value={filters.minPrice}
          onChange={onChange}
          className={`${inputClass} mt-1`}
        />
      </Field>

      <Field id="maxPrice" label="ราคาสูงสุด">
        <input
          id="maxPrice"
          name="maxPrice"
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={onChange}
          className={`${inputClass} mt-1`}
        />
      </Field>

      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-2 font-medium text-white hover:bg-primary-dark"
      >
        ค้นหา
      </button>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-dark px-5 py-2 font-medium hover:bg-sand/40"
      >
        ล้างตัวกรอง
      </button>
    </form>
  );
}

/* ---------- Dorm Card ---------- */
function DormCard({ dorm, onSelect }) {
  return (
    <li className="flex flex-col rounded-xl bg-white p-3 shadow-md">
      <div className="flex h-40 items-center justify-center rounded-lg bg-sand text-dark/70">
        {dorm.image_url ? (
          <img src={dorm.image_url} alt={dorm.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          "รูปภาพหอพัก"
        )}
      </div>
      <h3 className="mt-3 font-bold">{dorm.name}</h3>
      <p className="text-sm text-dark/70">{dorm.location}</p>
      <p className="text-sm">ประเภท: {dorm.type}</p>
      <p className="text-sm">ราคา: {formatPriceRange(dorm.min_rent, dorm.max_rent)}</p>
      <p className="text-sm">สถานะห้อง: {dorm.availability_status ?? "ไม่มีข้อมูลสถานะห้อง"}</p>
      <button
        type="button"
        onClick={() => onSelect(dorm.id)}
        className="mt-3 rounded-lg bg-primary py-2 font-medium text-white hover:bg-primary-dark"
      >
        ดูรายละเอียด
      </button>
    </li>
  );
}

/* ---------- Dorm List ---------- */
function DormList({ dorms, isRecommended, onSelect }) {
  return (
    <ul
      aria-label={isRecommended ? "หอพักแนะนำ" : "รายการหอพัก"}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {dorms.map((dorm) => (
        <DormCard key={dorm.id} dorm={dorm} onSelect={onSelect} />
      ))}
    </ul>
  );
}

/* ---------- Page ---------- */
export default function HomePage() {
  const navigate = useNavigate();
  const {
    filters, results, displayedResults, loading, error,
    updateFilter, submitSearch, clearFilters,
  } = useDorms();

  const isRecommended = results.length === 0;

  return (
    <>
      <HeroSection />
      <div className="px-6">
        <SearchFilter
          filters={filters}
          onChange={updateFilter}
          onSubmit={submitSearch}
          onClear={clearFilters}
        />

        <section className="mx-auto mt-10 max-w-6xl">
          <h2 className="mb-4 text-2xl font-bold">
            {isRecommended ? "หอพักแนะนำ" : "ผลการค้นหา"}
          </h2>

          {loading && <p role="status">กำลังโหลดรายการหอพัก...</p>}
          {error && <p role="alert" className="text-red-600">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p className="mb-4">ไม่พบหอพักตามเงื่อนไขที่คุณระบุ</p>
          )}
          {!loading && !error && displayedResults.length > 0 && (
            <DormList
              dorms={displayedResults}
              isRecommended={isRecommended}
              onSelect={(id) => navigate(`/dorms/${id}`)}
            />
          )}
        </section>
      </div>
    </>
  );
}