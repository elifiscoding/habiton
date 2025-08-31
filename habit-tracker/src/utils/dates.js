// Returns YYYY-MM-DD in local time
export function toISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayLocal() {
  return toISODate(new Date())
}
