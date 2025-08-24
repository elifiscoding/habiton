// local YYYY-MM-DD (avoids UTC shift)
export function todayLocal() {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60000
  return new Date(Date.now() - tz).toISOString().slice(0,10)
}

export function toISODate(d) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0,10)
}
