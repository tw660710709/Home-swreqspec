import { useEffect, useState } from "react";
import {
  deleteOwnerDormitoryImage,
  deleteOwnerRoomImage,
  getOwnerDormitoryImage,
  getOwnerDormitoryImages,
  getOwnerRoomImage,
  getOwnerRoomImages,
} from "../api/client.js";

// รองรับ CON-AUTH-01, CON-FILE-01 และ FR-DOR-12
export default function OwnerSavedImages({
  dormitoryId,
  roomId,
  refreshKey = 0,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingImageId, setDeletingImageId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const objectUrls = [];
    setImages([]);
    setLoading(true);
    setError("");

    async function loadImages() {
      try {
        const savedImages = roomId
          ? await getOwnerRoomImages(dormitoryId, roomId)
          : await getOwnerDormitoryImages(dormitoryId);
        const imagesWithPreviews = await Promise.all(
          savedImages.map(async (image) => {
            const content = roomId
              ? await getOwnerRoomImage(dormitoryId, roomId, image.image_id)
              : await getOwnerDormitoryImage(dormitoryId, image.image_id);
            const previewUrl = URL.createObjectURL(content);
            if (active) {
              objectUrls.push(previewUrl);
            } else {
              URL.revokeObjectURL(previewUrl);
            }
            return { ...image, previewUrl };
          }),
        );
        if (active) setImages(imagesWithPreviews);
      } catch (loadError) {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "ไม่สามารถโหลดรูปภาพที่บันทึกแล้วได้",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadImages();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [dormitoryId, roomId, refreshKey]);

  async function handleDelete(image) {
    setDeletingImageId(image.image_id);
    setError("");
    try {
      if (roomId) {
        await deleteOwnerRoomImage(dormitoryId, roomId, image.image_id);
      } else {
        await deleteOwnerDormitoryImage(dormitoryId, image.image_id);
      }
      URL.revokeObjectURL(image.previewUrl);
      setImages((current) =>
        current.filter((savedImage) => savedImage.image_id !== image.image_id),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "ไม่สามารถลบรูปภาพได้",
      );
    } finally {
      setDeletingImageId("");
    }
  }

  const imageLabel = roomId
    ? `รูปภาพห้องพัก ${roomId}`
    : "รูปภาพหอพัก";

  return (
    <div className="mt-4">
      <h3 className="font-medium">{imageLabel}ที่บันทึกแล้ว</h3>
      {loading && <p role="status">กำลังโหลดรูปภาพที่บันทึกแล้ว...</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {!loading && !error && images.length === 0 && (
        <p className="mt-2 text-sm text-dark/70">ยังไม่มีรูปภาพที่บันทึกแล้ว</p>
      )}
      {images.length > 0 && (
        <ul aria-label={`${imageLabel}ที่บันทึกแล้ว`} className="mt-2 grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <li
              key={image.image_id}
              className="rounded-lg border border-sand p-3"
            >
              <img
                src={image.previewUrl}
                alt={`${imageLabel} ${index + 1}`}
                className="mb-2 h-40 w-full rounded object-cover"
              />
              <p className="text-sm text-dark/70">
                สถานะ: {image.approval_status === "Pending"
                  ? "รออนุมัติ"
                  : image.approval_status}
              </p>
              <button
                type="button"
                aria-label={`ลบ${imageLabel} ${index + 1}`}
                disabled={Boolean(deletingImageId)}
                onClick={() => handleDelete(image)}
                className="mt-2 rounded-lg border border-dark px-3 py-1 text-sm font-medium hover:bg-sand/40 disabled:opacity-60"
              >
                {deletingImageId === image.image_id ? "กำลังลบ..." : "ลบรูปภาพ"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
