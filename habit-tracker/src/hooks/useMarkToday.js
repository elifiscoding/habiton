// /src/hooks/useMarkToday.js
import { supabase } from "../lib/supabase"
import { todayLocal, toLocalYMD } from "../utils/dates"
import { currentStreakFromRecent } from "../utils/habitMetrics"

const WINDOW_DAYS = 30

// ---------- LOCAL OVERRIDES ----------
// Holds today's optimistic status so stale server reads don't overwrite it
export const LOCAL_OVERRIDES = new Map()

function makeKey(hid, ymd) {
  return `${hid}:${ymd}`
}

// ---------- helpers ----------

// Get current authenticated user id
async function getUid() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const uid = data?.user?.id
  if (!uid) throw new Error("Not authenticated")
  return uid
}

// Compute next 30-day stats (done_days, completion_rate_pct)
function nextThirtyDayStat(prevStat, wasTodayDone, isMark) {
  const prev = Math.max(0, Number(prevStat?.done_days ?? 0))
  let next = prev
  if (isMark && !wasTodayDone) next = prev + 1
  if (!isMark && wasTodayDone) next = Math.max(0, prev - 1)
  const pct = Math.round((next / WINDOW_DAYS) * 100)
  return { done_days: next, completion_rate_pct: pct }
}

// Snapshot: check if today/yesterday are marked done in recent7
function snapshotFlags(recent7, todayYMD) {
  const map = new Map((recent7 || []).map(d => [d.date, d.status === "done"]))
  const todayDone = !!map.get(todayYMD)
  const y = new Date(todayYMD); y.setDate(y.getDate() - 1)
  const ymdY = toLocalYMD(y)
  const yDone = !!map.get(ymdY)
  return { todayDone, yesterdayDone: yDone }
}

// ---------- main hook ----------

export function useMarkToday({
  getRecent,
  setRecent,
  getStat,
  onUpdateStat,
  onUpdateStreak,
  onLog,
  setFlash,
}) {
  async function doToggle({ habitId, isMark, dateYMD = todayLocal() }) {
    // --- 1. Snapshot BEFORE optimistic change ---
    const prevRecent = getRecent?.(habitId) || []
    const prevStat = getStat?.(habitId)
    const { todayDone } = snapshotFlags(prevRecent, dateYMD)

    // idempotent guards
    if (isMark && todayDone) return
    if (!isMark && !todayDone) return

    // --- 2. Build NEXT recent7 optimistically ---
    const nextStatus = isMark ? "done" : null
    const nextRecent = prevRecent.map(d =>
      d.date === dateYMD ? { ...d, status: nextStatus } : d
    )
    setRecent?.(habitId, nextRecent)

    // also update LOCAL_OVERRIDES
    const key = makeKey(habitId, dateYMD)
    if (nextStatus === null) {
     // pin undone instead of removing override
      LOCAL_OVERRIDES.set(key, "undone")
      // optional: auto-clear after 5s so future loads rely on DB again
      setTimeout(() => {
        if (LOCAL_OVERRIDES.get(key) === "undone") {
          LOCAL_OVERRIDES.delete(key)
        }
      }, 5000)
    } else {
      LOCAL_OVERRIDES.set(key, "done")
    }

    // --- 3. Optimistic stats & streaks ---
    const nextStat = nextThirtyDayStat(prevStat, todayDone, isMark)
    onUpdateStat?.(habitId, nextStat)
    const nextStreak = currentStreakFromRecent(nextRecent, dateYMD)
    onUpdateStreak?.(habitId, nextStreak)
    onLog?.(habitId, { date: dateYMD, status: nextStatus })
    if (isMark) { setFlash?.(true); setTimeout(() => setFlash?.(false), 600) }

    // --- 4. Persist to DB (with echo row) ---
    try {
      const uid = await getUid()

      if (isMark) {
        const res = await supabase
          .from("habit_logs")
          .upsert(
            [{ user_id: uid, habit_id: habitId, log_date: dateYMD, status: "done" }],
            { onConflict: "user_id,habit_id,log_date" }
          )
          .select("id,user_id,habit_id,log_date,status")
        if (res.error) throw res.error
        console.log("[markToday] upsert result:", res.data)
      } else {
        const res = await supabase
          .from("habit_logs")
          .delete()
          .eq("user_id", uid)
          .eq("habit_id", habitId)
          .eq("log_date", dateYMD)
          .select("id,user_id,habit_id,log_date,status")
        if (res.error) throw res.error
        console.log("[markToday] delete result:", res.data)
      }
    } catch (e) {
      console.error("[markToday] DB error:", e)
      setRecent?.(habitId, prevRecent)
      onUpdateStat?.(habitId, prevStat)
      const rollbackStreak = currentStreakFromRecent(prevRecent, dateYMD)
      onUpdateStreak?.(habitId, rollbackStreak)
    }
  }

  const markToday = (habitId, dateYMD) => doToggle({ habitId, isMark: true, dateYMD })
  const undoToday = (habitId, dateYMD) => doToggle({ habitId, isMark: false, dateYMD })

  return { markToday, undoToday }
}
