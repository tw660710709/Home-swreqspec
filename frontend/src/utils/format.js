export function formatPriceRange(min, max) {
  if (min == null || max == null) return "ไม่มีข้อมูลราคา";
  const f = (n) => Number(n).toLocaleString("th-TH");
  return `${f(min)} - ${f(max)} บาท/เดือน`;
}