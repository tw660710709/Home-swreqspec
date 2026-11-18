// รองรับ FR-REP-01, FR-REP-02, FR-REP-04, FR-REP-05, CON-UI-01, ASM-03, ASM-06
export const REPAIR_ISSUE_TYPES = [
  "ไฟฟ้า",
  "ประปา",
  "เฟอร์นิเจอร์/อุปกรณ์",
  "อื่นๆ",
];

export const REPAIR_DESC_MIN_LENGTH = 1;
export const REPAIR_DESC_MAX_LENGTH = 1000;
export const MAX_REPAIR_IMAGES_PER_REQUEST = 3;
export const MAX_REPAIR_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_REPAIR_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
export const ALLOWED_REPAIR_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];