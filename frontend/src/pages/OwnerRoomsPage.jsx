import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createOwnerDormitoryRoom,
  getOwnerDormitories,
  getOwnerDormitory,
  getOwnerDormitoryRooms,
  updateOwnerDormitoryRoom,
  uploadOwnerRoomImages,
} from "../api/client.js";

// รองรับ CON-ACC-01, CON-AUTH-01, CON-DATA-01, CON-FILE-01, FR-DOR-12,
// FR-DOR-14, FR-DOR-18 และ AC-DOR-08, AC-DOR-10
export default function OwnerRoomsPage() {
  const { dormitoryId } = useParams();
  const [dormitories, setDormitories] = useState([]);
  const [dormitory, setDormitory] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [rentValues, setRentValues] = useState({});
  const [newMonthlyRent, setNewMonthlyRent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRoomImages, setSelectedRoomImages] = useState({});
  const [roomImageResults, setRoomImageResults] = useState({});
  const [roomImageErrors, setRoomImageErrors] = useState({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSuccess("");
    setDormitories([]);
    setDormitory(null);
    setRooms([]);
    setRentValues({});
    setSelectedRoomImages({});
    setRoomImageResults({});
    setRoomImageErrors({});

    async function loadRoomsPage() {
      try {
        if (!dormitoryId) {
          const ownerDormitories = await getOwnerDormitories();
          if (active) setDormitories(ownerDormitories);
          return;
        }

        const [selectedDormitory, ownerRooms] = await Promise.all([
          getOwnerDormitory(dormitoryId),
          getOwnerDormitoryRooms(dormitoryId),
        ]);
        if (active) {
          setDormitory(selectedDormitory);
          setRooms(ownerRooms);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "ไม่สามารถโหลดข้อมูลห้องพักได้",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRoomsPage();
    return () => {
      active = false;
    };
  }, [dormitoryId]);

  // รองรับ CON-DATA-01, FR-DOR-12 และ ASM-16
  function handleNewRentChange(event) {
    setNewMonthlyRent(event.target.value);
    setError("");
    setSuccess("");
  }

  // รองรับ CON-DATA-01, FR-DOR-12 และ ASM-16
  function handleRoomRentChange(roomId, value) {
    setRentValues((current) => ({ ...current, [roomId]: value }));
    setError("");
    setSuccess("");
  }

  // รองรับ CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-16
  async function handleCreateRoom(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const createdRoom = await createOwnerDormitoryRoom(dormitoryId, {
        monthly_rent: newMonthlyRent,
      });
      setRooms((current) => [...current, createdRoom]);
      setNewMonthlyRent("");
      setSuccess("เพิ่มข้อมูลห้องพักแล้ว");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลห้องพักได้",
      );
    } finally {
      setSaving(false);
    }
  }

  // รองรับ CON-AUTH-01, CON-DATA-01, CON-BUS-01, FR-DOR-12 และ ASM-16
  async function handleUpdateRoom(event, room) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const monthlyRent = rentValues[room.room_id] ?? String(room.monthly_rent);
    try {
      const updatedRoom = await updateOwnerDormitoryRoom(
        dormitoryId,
        room.room_id,
        { monthly_rent: monthlyRent },
      );
      setRooms((current) =>
        current.map((item) =>
          item.room_id === updatedRoom.room_id ? updatedRoom : item,
        ),
      );
      setRentValues((current) => ({
        ...current,
        [updatedRoom.room_id]: String(updatedRoom.monthly_rent),
      }));
      setSuccess("บันทึกราคาห้องพักแล้ว");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลห้องพักได้",
      );
    } finally {
      setSaving(false);
    }
  }

  // รองรับ CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
  function handleRoomImageSelection(roomId, event) {
    setSelectedRoomImages((current) => ({
      ...current,
      [roomId]: Array.from(event.target.files ?? []),
    }));
    setRoomImageErrors((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, roomId)) return current;
      const next = { ...current };
      delete next[roomId];
      return next;
    });
    event.target.value = "";
  }

  // รองรับ CON-AUTH-01, CON-FILE-01, FR-DOR-14, FR-DOR-18 และ AC-DOR-10
  async function handleRoomImageUpload(room) {
    const files = selectedRoomImages[room.room_id] ?? [];
    setSaving(true);
    setRoomImageErrors((current) => ({
      ...current,
      [room.room_id]: "",
    }));
    try {
      const result = await uploadOwnerRoomImages(
        dormitoryId,
        room.room_id,
        files,
      );
      setRoomImageResults((current) => {
        const previous = current[room.room_id] ?? {
          accepted: [],
          rejected: [],
        };
        return {
          ...current,
          [room.room_id]: {
            accepted: [...previous.accepted, ...result.accepted],
            rejected: result.rejected,
          },
        };
      });
      setSelectedRoomImages((current) => ({
        ...current,
        [room.room_id]: [],
      }));
    } catch (err) {
      setRoomImageErrors((current) => ({
        ...current,
        [room.room_id]:
          err instanceof Error ? err.message : "ไม่สามารถอัปโหลดรูปภาพได้",
      }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold">จัดการข้อมูลห้องพัก</h1>
      {loading && <p role="status">กำลังโหลดข้อมูลห้องพัก...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !dormitoryId && !error && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            เลือกหอพักที่ต้องการจัดการห้องพัก
          </h2>
          {dormitories.length === 0 ? (
            <p>ยังไม่มีข้อมูลหอพัก</p>
          ) : (
            <ul aria-label="รายการหอพักสำหรับจัดการห้องพัก" className="space-y-4">
              {dormitories.map((item) => (
                <li
                  key={item.dormitory_id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sand bg-white p-5"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-dark/70">{item.location}</p>
                  </div>
                  <Link
                    to={`/owner/dormitories/${encodeURIComponent(item.dormitory_id)}/rooms`}
                    className="rounded-lg border border-dark px-4 py-2 font-medium hover:bg-sand/40"
                  >
                    จัดการห้องพัก
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && dormitoryId && dormitory && (
        <>
          <div className="mb-6 rounded-xl border border-sand bg-white p-5">
            <h2 className="text-xl font-semibold">{dormitory.name}</h2>
            <p className="text-dark/70">{dormitory.location}</p>
            <p className="mt-2 text-sm text-dark/70">
              รหัสหอพัก: {dormitory.dormitory_id}
            </p>
          </div>

          {success && <p role="status">{success}</p>}
          {rooms.length === 0 ? (
            <p className="mb-4">ยังไม่มีข้อมูลห้องพัก</p>
          ) : (
            <ul aria-label="รายการห้องพักของหอพักนี้" className="mb-6 space-y-4">
              {rooms.map((room) => {
                const inputId = `monthly-rent-${room.room_id}`;
                const monthlyRent =
                  rentValues[room.room_id] ?? String(room.monthly_rent);

                return (
                  <li
                    key={room.room_id}
                    className="rounded-xl border border-sand bg-white p-5"
                  >
                    <p className="font-medium">รหัสห้องพัก: {room.room_id}</p>
                    <p className="mb-4 text-dark/70">
                      ราคาปัจจุบัน: {room.monthly_rent} บาท/เดือน
                    </p>
                    <form
                      aria-label={`แบบฟอร์มราคาห้อง ${room.room_id}`}
                      className="flex flex-wrap items-end gap-3"
                      onSubmit={(event) => handleUpdateRoom(event, room)}
                    >
                      <div className="min-w-60 flex-1">
                        <label
                          htmlFor={inputId}
                          className="mb-1 block font-medium"
                        >
                          ราคาใหม่ ห้องพัก {room.room_id} (บาท/เดือน)
                        </label>
                        <input
                          id={inputId}
                          type="number"
                          step="any"
                          required
                          value={monthlyRent}
                          onChange={(event) =>
                            handleRoomRentChange(room.room_id, event.target.value)
                          }
                          className="w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg border border-dark px-4 py-2 font-medium hover:bg-sand/40 disabled:opacity-60"
                      >
                        บันทึกราคา
                      </button>
                    </form>
                    <div className="mt-4 border-t border-sand pt-4">
                      <label
                        htmlFor={`room-images-${room.room_id}`}
                        className="mb-1 block font-medium"
                      >
                        รูปภาพห้องพัก {room.room_id}
                      </label>
                      <input
                        id={`room-images-${room.room_id}`}
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        multiple
                        disabled={saving}
                        onChange={(event) =>
                          handleRoomImageSelection(room.room_id, event)
                        }
                        className="block w-full text-sm"
                      />
                      {(selectedRoomImages[room.room_id] ?? []).length > 0 && (
                        <ul
                          aria-label={`ไฟล์รูปห้อง ${room.room_id} ที่เลือก`}
                          className="mt-2 text-sm"
                        >
                          {selectedRoomImages[room.room_id].map(
                            (file, index) => (
                              <li key={`${file.name}-${index}`}>{file.name}</li>
                            ),
                          )}
                        </ul>
                      )}
                      <p className="mt-1 text-sm text-dark/70">
                        หากไฟล์ถูกปฏิเสธ สามารถเลือกไฟล์ใหม่แล้วอัปโหลดอีกครั้งได้
                      </p>
                      <button
                        type="button"
                        disabled={
                          saving ||
                          (selectedRoomImages[room.room_id] ?? []).length === 0
                        }
                        onClick={() => handleRoomImageUpload(room)}
                        className="mt-2 rounded-lg border border-dark px-4 py-2 font-medium hover:bg-sand/40 disabled:opacity-60"
                      >
                        อัปโหลดรูปภาพห้องพัก
                      </button>
                      {roomImageErrors[room.room_id] && (
                        <p role="alert" className="mt-2 text-sm text-red-700">
                          {roomImageErrors[room.room_id]}
                        </p>
                      )}
                      {roomImageResults[room.room_id]?.accepted.length > 0 && (
                        <div role="status" className="mt-2">
                          <p className="font-medium">รูปภาพที่อัปโหลดแล้ว</p>
                          <ul
                            aria-label={`รูปห้อง ${room.room_id} ที่อัปโหลดแล้ว`}
                          >
                            {roomImageResults[room.room_id].accepted.map(
                              (image) => (
                                <li key={image.image_id}>{image.filename}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                      {roomImageResults[room.room_id]?.rejected.length > 0 && (
                        <div role="alert" className="mt-2 text-sm text-red-700">
                          <p className="font-medium">ไฟล์ที่ถูกปฏิเสธ</p>
                          <ul
                            aria-label={`รูปห้อง ${room.room_id} ที่ถูกปฏิเสธ`}
                          >
                            {roomImageResults[room.room_id].rejected.map(
                              (image, index) => (
                                <li key={`${image.filename}-${index}`}>
                                  {image.filename}: {image.reason}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            aria-label="แบบฟอร์มเพิ่มห้องพัก"
            className="rounded-xl border border-sand bg-white p-5"
            onSubmit={handleCreateRoom}
          >
            <h2 className="mb-4 text-xl font-semibold">เพิ่มห้องพัก</h2>
            <div className="mb-4 max-w-md">
              <label
                htmlFor="new-monthly-rent"
                className="mb-1 block font-medium"
              >
                ราคาต่อห้อง (บาท/เดือน)
              </label>
              <input
                id="new-monthly-rent"
                type="number"
                step="any"
                required
                value={newMonthlyRent}
                onChange={handleNewRentChange}
                className="w-full rounded-lg border border-dark/20 bg-white px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              เพิ่มห้องพัก
            </button>
          </form>
          <Link
            to="/owner/rooms"
            className="mt-6 inline-block font-medium text-primary hover:underline"
          >
            เลือกหอพักอื่น
          </Link>
        </>
      )}
    </section>
  );
}
