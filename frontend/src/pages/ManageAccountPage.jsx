import { useState } from "react";

// ต้นแบบ UI รองรับ FR-ACCOUNT-01 ถึง FR-ACCOUNT-08; persistence และ auth ยังรอ UC-07
const emptyProfile = { name: "", phone: "", email: "" };
const emptyPassword = { current: "", next: "", confirmation: "" };

function InputField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  help,
  error,
}) {
  const messageId = `${id}-message`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error || help ? messageId : undefined}
        className="mt-1 w-full rounded-lg border border-sand bg-white px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {error ? (
        <p id={messageId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : help ? (
        <p id={messageId} className="mt-1 text-sm text-dark/60">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function validateProfile(profile) {
  const errors = {};

  if (profile.phone && !/^\d{10}$/.test(profile.phone)) {
    errors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก";
  }
  if (
    profile.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
  ) {
    errors.email = "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง";
  }

  return errors;
}

export default function ManageAccountPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(emptyProfile);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState("");
  const [password, setPassword] = useState(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setProfileErrors((current) => ({ ...current, [field]: undefined }));
    setProfileMessage("");
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    const errors = validateProfile(profile);
    setProfileErrors(errors);

    if (Object.keys(errors).length > 0) {
      setProfileMessage("");
      return;
    }

    setSavedProfile({ ...profile });
    setProfileMessage(
      "บันทึกข้อมูลในต้นแบบแล้ว (ยังไม่ได้บันทึกลงฐานข้อมูล)",
    );
  }

  function handleProfileCancel() {
    setProfile({ ...savedProfile });
    setProfileErrors({});
    setProfileMessage("ยกเลิกการแก้ไขและคืนค่าข้อมูลล่าสุดในต้นแบบแล้ว");
  }

  function updatePassword(field, value) {
    setPassword((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: undefined }));
    setPasswordMessage("");
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    const errors = {};

    if (!password.current) {
      errors.current = "กรุณากรอกรหัสผ่านเดิม";
    }
    if (password.next.length < 8) {
      errors.next = "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
    }
    if (!password.confirmation || password.confirmation !== password.next) {
      errors.confirmation = "รหัสผ่านใหม่และการยืนยันต้องตรงกัน";
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) {
      setPasswordMessage("");
      return;
    }

    setPassword(emptyPassword);
    setPasswordMessage(
      "ตรวจรูปแบบผ่านในต้นแบบ แต่ยังเปลี่ยนรหัสผ่านไม่ได้จนกว่าจะเชื่อมระบบ Authentication ของ UC-07",
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">จัดการบัญชี</h1>
          <p className="mt-2 text-dark/70">
            ดูและแก้ไขข้อมูลส่วนตัว หรือเปลี่ยนรหัสผ่าน
          </p>
        </div>
        <span className="rounded-full border border-sand px-3 py-1 text-sm font-medium">
          Prototype
        </span>
      </div>

      <p
        role="note"
        className="mb-6 rounded-lg border border-sand bg-white px-4 py-3 text-sm text-dark/70"
      >
        โหมดต้นแบบ: การแก้ไขข้อมูลทำงานเฉพาะในหน้านี้ ไม่เชื่อมต่อฐานข้อมูลหรือ
        Authentication และยังไม่ใช่ข้อมูลบัญชีจริง
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="account-profile-heading"
          className="rounded-xl border border-sand bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 id="account-profile-heading" className="text-xl font-semibold">
            ข้อมูลส่วนตัว
          </h2>
          <p className="mt-1 text-sm text-dark/70">
            แก้ไขชื่อ เบอร์โทรศัพท์ และอีเมลของคุณ
          </p>

          <form
            noValidate
            onSubmit={handleProfileSubmit}
            className="mt-5 space-y-4"
          >
            <InputField
              id="account-name"
              label="ชื่อ"
              value={profile.name}
              onChange={(event) => updateProfile("name", event.target.value)}
              autoComplete="name"
            />
            <InputField
              id="account-phone"
              label="เบอร์โทรศัพท์"
              value={profile.phone}
              onChange={(event) => updateProfile("phone", event.target.value)}
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              error={profileErrors.phone}
            />
            <InputField
              id="account-email"
              label="อีเมล"
              value={profile.email}
              onChange={(event) => updateProfile("email", event.target.value)}
              type="email"
              autoComplete="email"
              error={profileErrors.email}
            />

            {profileMessage && (
              <p role="status" className="text-sm text-dark/80">
                {profileMessage}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                บันทึกข้อมูล
              </button>
              <button
                type="button"
                onClick={handleProfileCancel}
                className="rounded-lg border border-sand px-4 py-2 font-medium hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                ยกเลิก
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-dark/60">
            การบังคับกรอกและเงื่อนไขการตรวจสอบชื่อรอข้อสรุปจากทีม
          </p>
        </section>

        <section
          aria-labelledby="account-password-heading"
          className="rounded-xl border border-sand bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 id="account-password-heading" className="text-xl font-semibold">
            เปลี่ยนรหัสผ่าน
          </h2>
          <p className="mt-1 text-sm text-dark/70">
            ส่วนนี้แยกจากข้อมูลส่วนตัว และต้องใช้รหัสผ่านเดิม
          </p>

          <form
            noValidate
            onSubmit={handlePasswordSubmit}
            className="mt-5 space-y-4"
          >
            <InputField
              id="account-current-password"
              label="รหัสผ่านเดิม"
              value={password.current}
              onChange={(event) =>
                updatePassword("current", event.target.value)
              }
              type="password"
              autoComplete="current-password"
              error={passwordErrors.current}
            />
            <InputField
              id="account-new-password"
              label="รหัสผ่านใหม่"
              value={password.next}
              onChange={(event) => updatePassword("next", event.target.value)}
              type="password"
              autoComplete="new-password"
              help="ต้องมีความยาวอย่างน้อย 8 ตัวอักษร"
              error={passwordErrors.next}
            />
            <InputField
              id="account-confirm-password"
              label="ยืนยันรหัสผ่านใหม่"
              value={password.confirmation}
              onChange={(event) =>
                updatePassword("confirmation", event.target.value)
              }
              type="password"
              autoComplete="new-password"
              error={passwordErrors.confirmation}
            />

            {passwordMessage && (
              <p role="status" className="text-sm text-dark/80">
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              ตรวจสอบข้อมูลในต้นแบบ
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
