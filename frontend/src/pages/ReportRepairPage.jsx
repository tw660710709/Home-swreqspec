import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createRepairRequest,
  getRoomRepairRequests,
  RepairValidationError,
} from "../api/client.js";
import {
  ALLOWED_REPAIR_IMAGE_EXTENSIONS,
  ALLOWED_REPAIR_IMAGE_MIME_TYPES,
  MAX_REPAIR_IMAGE_SIZE_BYTES,
  MAX_REPAIR_IMAGES_PER_REQUEST,
  REPAIR_DESC_MAX_LENGTH,
  REPAIR_ISSUE_TYPES,
} from "../config.js";

const STATUS_LABELS = {
  Pending: "รอดำเนินการ (Pending)",
  "In Progress": "กำลังดำเนินการ",
  Resolved: "ดำเนินการเสร็จสิ้น",
};

function validateSelectedFiles(fileList) {
  if (!fileList || fileList.length === 0) return "";
  if (fileList.length > MAX_REPAIR_IMAGES_PER_REQUEST) {
    return `แนบรูปภาพได้สูงสุดไม่เกิน ${MAX_REPAIR_IMAGES_PER_REQUEST} รูปต่อรายการ`;
  }
  for (const file of fileList) {
    const lowerName = (file.name || "").toLowerCase();
    const hasValidExt = ALLOWED_REPAIR_IMAGE_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );
    const hasValidMime =
      !file.type || ALLOWED_REPAIR_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());
    if (!hasValidExt || !hasValidMime) {
      return "รองรับเฉพาะไฟล์รูปภาพนามสกุล .jpg, .jpeg หรือ .png เท่านั้น";
    }
    if (file.size > MAX_REPAIR_IMAGE_SIZE_BYTES) {
      return "ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB ต่อไฟล์";
    }
  }
  return "";
}

export default function ReportRepairPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [repairs, setRepairs] = useState([]);
  const [loadingRepairs, setLoadingRepairs] = useState(true);

  async function loadRepairs() {
    setLoadingRepairs(true);
    try {
      const data = await getRoomRepairRequests();
      setRepairs(data);
    } catch {
      // คงรายการเดิมไว้หากโหลดไม่สำเร็จ
    } finally {
      setLoadingRepairs(false);
    }
  }

  useEffect(() => {
    loadRepairs();
  }, []);

  // รองรับ FR-REP-05 และ AC-REP-04
  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    const validationMsg = validateSelectedFiles(files);
    setImageError(validationMsg);
    setSelectedFiles(validationMsg ? [] : files);
  }

  // รองรับ FR-REP-01 ถึง FR-REP-06 และ AC-REP-01 ถึง AC-REP-04
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    const errors = {};
    if (!issueType.trim()) {
      errors.issue_type = "กรุณาเลือกประเภทปัญหา";
    }
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = "กรุณากรอกรายละเอียดปัญหา";
    } else if (trimmedDesc.length > REPAIR_DESC_MAX_LENGTH) {
      errors.description = `รายละเอียดปัญหาต้องไม่เกิน ${REPAIR_DESC_MAX_LENGTH} ตัวอักษร`;
    }

    const fileValidationMsg = validateSelectedFiles(selectedFiles);
    setFieldErrors(errors);
    setImageError(fileValidationMsg);

    if (Object.keys(errors).length > 0 || fileValidationMsg) {
      return;
    }

    setSubmitting(true);
    try {
      const created = await createRepairRequest({
        issueType,
        description: trimmedDesc,
        images: selectedFiles,
      });
      setSuccessMessage("ส่งข้อมูลแจ้งซ่อมสำเร็จ");
      setIssueType("");
      setDescription("");
      setSelectedFiles([]);
      setFieldErrors({});
      setImageError("");
      setRepairs((prev) => [created, ...prev]);
    } catch (error) {
      if (error instanceof RepairValidationError) {
        setFieldErrors(error.fieldErrors || {});
      } else {
        setSubmitError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // รองรับ FR-REP-03 และ AC-REP-05
  function handleCancel() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">แจ้งซ่อมและรายงานปัญหา</h1>

      {submitError && (
        <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {submitError}
        </p>
      )}
      {successMessage && (
        <p role="status" className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-green-800">
          {successMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-dark/20 bg-white p-4 sm:p-6"
      >
        <div>
          <label htmlFor="issue-type" className="mb-1 block font-medium">
            ประเภทปัญหา <span className="text-red-700">*</span>
          </label>
          <select
            id="issue-type"
            value={issueType}
            onChange={(e) => {
              setIssueType(e.target.value);
              if (fieldErrors.issue_type) {
                setFieldErrors((prev) => ({ ...prev, issue_type: "" }));
              }
            }}
            className="w-full rounded-lg border border-dark/30 px-3 py-2"
          >
            <option value="">-- เลือกประเภทปัญหา --</option>
            {REPAIR_ISSUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {fieldErrors.issue_type && (
            <p className="mt-1 text-sm text-red-700">{fieldErrors.issue_type}</p>
          )}
        </div>

        <div>
          <label htmlFor="repair-description" className="mb-1 block font-medium">
            รายละเอียดปัญหา <span className="text-red-700">*</span>
          </label>
          <textarea
            id="repair-description"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description) {
                setFieldErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            placeholder="ระบุอาการหรือรายละเอียดของปัญหาที่พบ..."
            className="w-full rounded-lg border border-dark/30 px-3 py-2"
          />
          <div className="mt-1 flex justify-between text-xs text-dark/70">
            <span>{fieldErrors.description ? <span className="text-sm text-red-700">{fieldErrors.description}</span> : ""}</span>
            <span>{description.length}/{REPAIR_DESC_MAX_LENGTH}</span>
          </div>
        </div>

        <div>
          <label htmlFor="repair-images" className="mb-1 block font-medium">
            รูปภาพประกอบ (ไม่บังคับ, สูงสุด 3 รูป, ขนาดไม่เกิน 5MB ต่อไฟล์)
          </label>
          <input
            id="repair-images"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-dark/30 px-3 py-2 text-sm"
          />
          {selectedFiles.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-dark/80">
              {selectedFiles.map((file, idx) => (
                <li key={`${file.name}-${idx}`}>{file.name}</li>
              ))}
            </ul>
          )}
          {imageError && (
            <p role="alert" className="mt-1 text-sm text-red-700">
              {imageError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "กำลังส่งข้อมูล..." : "ยืนยันการแจ้งซ่อม"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-dark/30 px-5 py-2.5 font-medium"
          >
            ยกเลิก
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">รายการแจ้งซ่อมของห้องพัก</h2>
        {loadingRepairs ? (
          <p role="status">กำลังโหลดรายการแจ้งซ่อม...</p>
        ) : repairs.length === 0 ? (
          <p className="text-dark/70">ยังไม่มีรายการแจ้งซ่อม</p>
        ) : (
          <ol className="space-y-4">
            {repairs.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-dark/20 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{item.issue_type}</span>
                  <span className="rounded-full bg-sand px-3 py-1 text-sm font-medium">
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
                <p className="mt-2">{item.description}</p>
                {Array.isArray(item.images) && item.images.length > 0 && (
                  <p className="mt-2 text-sm text-dark/80">
                    ไฟล์แนบ: {item.images.map((img) => img.original_filename).join(", ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-dark/70">{item.created_at}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}