// รองรับ T-07, FR-ACCOUNT-01, NFR-USE-01, CON-UI-01 และ AC-ACCOUNT-01
const profileFields = ["ชื่อ", "เบอร์โทรศัพท์", "อีเมล"];

export default function ManageAccountPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">จัดการบัญชี</h1>
          <p className="mt-2 text-dark/70">
            ดูข้อมูลบัญชีและส่วนสำหรับเปลี่ยนรหัสผ่าน
          </p>
        </div>
        <span className="rounded-full border border-sand px-3 py-1 text-sm font-medium">
          Prototype
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="account-profile-heading"
          className="rounded-xl border border-sand bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 id="account-profile-heading" className="text-xl font-semibold">
            ข้อมูลส่วนตัว
          </h2>
          <p className="mt-1 text-sm text-dark/70">
            ข้อมูลบัญชีปัจจุบันของคุณ
          </p>

          <dl className="mt-5 space-y-4">
            {profileFields.map((field) => (
              <div
                key={field}
                className="rounded-lg bg-cream px-4 py-3"
              >
                <dt className="text-sm font-medium text-dark/70">{field}</dt>
                <dd className="mt-1 text-dark/50">ยังไม่มีข้อมูลในต้นแบบ</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="account-password-heading"
          className="rounded-xl border border-sand bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 id="account-password-heading" className="text-xl font-semibold">
            เปลี่ยนรหัสผ่าน
          </h2>
          <p className="mt-1 text-sm text-dark/70">
            ส่วนนี้แยกจากข้อมูลส่วนตัว
          </p>
          <div className="mt-5 rounded-lg bg-cream px-4 py-4">
            <p className="font-medium">รหัสผ่าน</p>
            <p className="mt-1 text-sm text-dark/70">
              รหัสผ่านจะไม่แสดงบนหน้าจอ
            </p>
          </div>
        </section>
      </div>

      <p className="mt-6 text-sm text-dark/60" role="note">
        ต้นแบบนี้ยังไม่เชื่อมต่อข้อมูลบัญชีหรือระบบ Authentication
      </p>
    </section>
  );
}
