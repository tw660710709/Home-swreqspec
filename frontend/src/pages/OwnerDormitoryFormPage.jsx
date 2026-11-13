import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createOwnerDormitory,
  getOwnerDormitory,
  OwnerDormitoryValidationError,
  updateOwnerDormitory,
  uploadOwnerDormitoryImages,
} from "../api/client.js";
import OwnerSavedImages from "../components/OwnerSavedImages.jsx";

const emptyForm = {
  name: "",
  location: "",
  type: "",
  contact_info: "",
  amenities: "",
  rules: "",
};

const fields = [
  { name: "name", label: "ชื่อหอพัก", required: true },
  { name: "location", label: "ที่อยู่/ทำเล", required: true },
  { name: "type", label: "ประเภทหอพัก", required: true },
  { name: "contact_info", label: "ช่องทางติดต่อ", required: true },
  { name: "amenities", label: "สิ่งอำนวยความสะดวก" },
  { name: "rules", label: "กฎระเบียบ" },
];

// รองรับ CON-DATA-01, FR-DOR-10, FR-DOR-11, FR-DOR-12 และ FR-DOR-15
function toFormValues(dormitory) {
  return {
    name: dormitory.name ?? "",
    location: dormitory.location ?? "",
    type: dormitory.type ?? "",
    contact_info: dormitory.contact_info ?? "",
    amenities: Array.isArray(dormitory.amenities)
      ? dormitory.amenities.join(", ")
      : "",
    rules: dormitory.rules ?? "",
  };
}

// รองรับ CON-DATA-01, FR-DOR-10 และ FR-DOR-12
function toSavePayload(formValues) {
  const amenities = formValues.amenities
    .split(",")
    .map((amenity) => amenity.trim())
    .filter(Boolean);

  return {
    name: formValues.name,
    location: formValues.location,
    type: formValues.type,
    contact_info: formValues.contact_info,
    amenities: amenities.length > 0 ? amenities : null,
    rules: formValues.rules.trim() || null,
  };
}

// รองรับ CON-ACC-01, CON-AUTH-01, CON-DATA-01, CON-FILE-01, FR-DOR-10 ถึง FR-DOR-14,
// FR-DOR-15, FR-DOR-17, FR-DOR-18 และ AC-DOR-08 ถึง AC-DOR-10
export default function OwnerDormitoryFormPage() {
  const { dormitoryId } = useParams();
  const navigate = useNavigate();
  const [dormitory, setDormitory] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(dormitoryId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageListRefreshKey, setImageListRefreshKey] = useState(0);
  const [imageUploadResult, setImageUploadResult] = useState({
    accepted: [],
    rejected: [],
  });
  const [imageUploadError, setImageUploadError] = useState("");

  useEffect(() => {
    let active = true;

    if (!dormitoryId) {
      setDormitory(null);
      setFormValues(emptyForm);
      setLoading(false);
      setError("");
      setFieldErrors({});
      return () => {
        active = false;
      };
    }

    async function loadDormitory() {
      setLoading(true);
      setError("");
      setFieldErrors({});
      try {
        const data = await getOwnerDormitory(dormitoryId);
        if (active) {
          setDormitory(data);
          setFormValues(toFormValues(data));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "ไม่สามารถโหลดข้อมูลหอพักได้",
          );
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

  // รองรับ CON-DATA-01, FR-DOR-10, FR-DOR-12, FR-DOR-13 และ FR-DOR-17
  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, name)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setError("");
    setSuccess("");
  }

  // รองรับ CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
  function handleImageSelection(event) {
    setSelectedImages(Array.from(event.target.files ?? []));
    setImageUploadError("");
    event.target.value = "";
  }

  // รองรับ CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
  async function uploadSelectedImages(savedDormitoryId, files) {
    if (files.length === 0) return;

    setUploadingImages(true);
    setImageUploadError("");
    try {
      const result = await uploadOwnerDormitoryImages(savedDormitoryId, files);
      setImageUploadResult((current) => ({
        accepted: [...current.accepted, ...result.accepted],
        rejected: result.rejected,
      }));
      if (result.accepted.length > 0) {
        setImageListRefreshKey((current) => current + 1);
      }
      setSelectedImages([]);
    } catch (err) {
      setImageUploadError(
        err instanceof Error ? err.message : "ไม่สามารถอัปโหลดรูปภาพได้",
      );
    } finally {
      setUploadingImages(false);
    }
  }

  // รองรับ CON-BUS-01, FR-DOR-10, FR-DOR-12, FR-DOR-13, FR-DOR-15,
  // FR-DOR-17, FR-DOR-18 และ AC-DOR-08 ถึง AC-DOR-10
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    setSuccess("");

    try {
      const payload = toSavePayload(formValues);
      const savedDormitory = dormitoryId
        ? await updateOwnerDormitory(dormitoryId, payload)
        : await createOwnerDormitory(payload);

      setDormitory(savedDormitory);
      setFormValues(toFormValues(savedDormitory));
      setSuccess("บันทึกข้อมูลหอพักสำเร็จ");
      await uploadSelectedImages(savedDormitory.dormitory_id, selectedImages);

      if (!dormitoryId) {
        navigate(
          `/owner/dormitories/${encodeURIComponent(savedDormitory.dormitory_id)}/edit`,
          { replace: true },
        );
      }
    } catch (err) {
      if (err instanceof OwnerDormitoryValidationError) {
        setFieldErrors(err.fieldErrors);
      } else {
        setError(
          err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลหอพักได้",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const statusLabel =
    dormitory?.approval_status === "Pending"
      ? "รออนุมัติ"
      : dormitory?.approval_status;

  return (
    <section className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        {dormitoryId ? "แก้ไขข้อมูลหอพัก" : "เพิ่มข้อมูลหอพัก"}
      </h1>
      {loading && <p role="status">กำลังโหลดข้อมูลหอพัก...</p>}
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      {!loading && !error && (
        <>
          {dormitory && (
            <div className="mb-4 text-sm text-dark/70">
              <p>รหัสหอพัก: {dormitory.dormitory_id}</p>
              {statusLabel && <p>สถานะ: {statusLabel}</p>}
            </div>
          )}
          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            {fields.map(({ name, label, required }) => {
              const fieldError = fieldErrors[name];
              const errorId = `${name}-error`;
              return (
                <div key={name}>
                  <label htmlFor={name} className="mb-1 block font-medium">
                    {label}
                  </label>
                  {name === "rules" ? (
                    <textarea
                      id={name}
                      name={name}
                      value={formValues[name]}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? errorId : undefined}
                    />
                  ) : (
                    <input
                      id={name}
                      name={name}
                      value={formValues[name]}
                      onChange={handleChange}
                      required={required}
                      className="w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? errorId : undefined}
                    />
                  )}
                  {fieldError && (
                    <p
                      id={errorId}
                      role="alert"
                      className="mt-1 text-sm text-red-700"
                    >
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
            <div>
              <label
                htmlFor="dormitory-images"
                className="mb-1 block font-medium"
              >
                รูปภาพหอพัก
              </label>
              <input
                id="dormitory-images"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                disabled={saving || uploadingImages}
                onChange={handleImageSelection}
                className="block w-full text-sm"
              />
              {selectedImages.length > 0 && (
                <ul aria-label="ไฟล์รูปหอพักที่เลือก" className="mt-2 text-sm">
                  {selectedImages.map((file, index) => (
                    <li key={`${file.name}-${index}`}>{file.name}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-sm text-dark/70">
                ไฟล์ที่เลือกจะอัปโหลดหลังบันทึกข้อมูลหอพักสำเร็จ
                หากไฟล์ถูกปฏิเสธ สามารถเลือกไฟล์ใหม่แล้วบันทึกอีกครั้งได้
              </p>
              {uploadingImages && (
                <p role="status" className="mt-2 text-sm">
                  กำลังอัปโหลดรูปภาพ...
                </p>
              )}
              {imageUploadError && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {imageUploadError}
                </p>
              )}
              {imageUploadResult.accepted.length > 0 && (
                <div role="status" className="mt-2">
                  <p className="font-medium">รูปภาพที่อัปโหลดแล้ว</p>
                  <ul aria-label="รูปภาพหอพักที่อัปโหลดแล้ว">
                    {imageUploadResult.accepted.map((image) => (
                      <li key={image.image_id}>{image.filename}</li>
                    ))}
                  </ul>
                </div>
              )}
              {imageUploadResult.rejected.length > 0 && (
                <div role="alert" className="mt-2 text-sm text-red-700">
                  <p className="font-medium">ไฟล์ที่ถูกปฏิเสธ</p>
                  <ul aria-label="รูปหอพักที่ถูกปฏิเสธ">
                    {imageUploadResult.rejected.map((image, index) => (
                      <li key={`${image.filename}-${index}`}>
                        {image.filename}: {image.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dormitory?.dormitory_id && (
                <OwnerSavedImages
                  dormitoryId={dormitory.dormitory_id}
                  refreshKey={imageListRefreshKey}
                />
              )}
            </div>
            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลหอพัก"}
            </button>
          </form>
        </>
      )}
      {dormitoryId ? (
        <button
          type="button"
          onClick={() => navigate("/owner/dormitories")}
          className="mt-6 rounded-lg border border-dark px-4 py-2 font-medium hover:bg-sand/40"
        >
          ยกเลิก
        </button>
      ) : (
        <Link
          to="/owner/dormitories"
          className="mt-6 inline-block font-medium text-primary hover:underline"
        >
          กลับไปรายการหอพัก
        </Link>
      )}
    </section>
  );
}
