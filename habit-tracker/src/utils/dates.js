// utils/dates.js

export function toLocalYMD(date = new Date()) {
  const d = (typeof date === "string") ? new Date(date) : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocal() {
  return toLocalYMD(new Date());
}

export function addDays(date, days) {
  const d = (typeof date === "string") ? new Date(date) : new Date(date);
  const r = new Date(d);
  r.setDate(d.getDate() + days);
  return r;
}
