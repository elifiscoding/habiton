import { supabase } from "../lib/supabase"
import { todayLocal } from "../utils/dates"

/**
 * useMarkToday: returns a generic markToday(habitId) that:
 * - prevents double-marking for the same day
 * - updates recent logs (via injected get/set functions)
 * - updates 30d stats + streaks optimistically (via injected callbacks)
 *
 * @param {{
 *   getRecent: (hid: string) => Array<{date:string,status:string|null}>,
 *   setRecent: (hid: string, updater: (prevArr)=>newArr) => void,
 *   getStat?: (hid: string) => { done_days:number, completion_rate_pct:number } | undefined,
 *   getStreak?: (hid: string) => { streak_current:number, streak_best:number } | undefined,
 *   onUpdateStat?: (hid: string, changes: object) => void,
 *   onUpdateStreak?: (hid: string, changes: object) => void,
 *   onLog?: (hid: string, payload: object) => void,
 *   setSaving?: (boolean) => void,
 *   setFlash?: (boolean) => void,
 * }} deps
 */
export function useMarkToday(deps) {
  const {
    getRecent,
    setRecent,
    getStat,
    getStreak,
    onUpdateStat,
    onUpdateStreak,
    onLog,
    setSaving,
    setFlash,
  } = deps

  const markToday = async (habitId) => {
    const today = todayLocal()
    const recent7 = getRecent?.(habitId) || []
    const alreadyDoneToday = recent7.some(d => d.date === today && d.status === "done")
    if (alreadyDoneToday) return

    // subtle visual feedback
    setFlash?.(true)
    setTimeout(() => setFlash?.(false), 700)

    // optimistic week dots
    setRecent?.(habitId, (prev) =>
      prev.map(d => d.date === today ? ({ ...d, status: "done" }) : d)
    )

    // optimistic 30d stats
    const s = getStat?.(habitId)
    if (s && onUpdateStat) {
      const newDoneDays = (s.done_days || 0) + 1
      const newPct = Math.min((newDoneDays / 30) * 100, 100)
      onUpdateStat(habitId, { done_days: newDoneDays, completion_rate_pct: newPct })
    }

    // optimistic streak
    const st = getStreak?.(habitId)
    if (st && onUpdateStreak) {
      const newCur = (st.streak_current || 0) + 1
      const newBest = Math.max(st.streak_best || 0, newCur)
      onUpdateStreak(habitId, { streak_current: newCur, streak_best: newBest })
    }

    onLog?.(habitId, { status: "done", date: today })

    // persist
    try {
      setSaving?.(true)
      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      if (!uid) return
      const { error } = await supabase.from("habit_logs").upsert(
        { user_id: uid, habit_id: habitId, log_date: today, status: "done" },
        { onConflict: "habit_id,log_date" }
      )
      if (error) throw error
    } catch (err) {
      alert(err.message || "Failed to log habit.")
    } finally {
      setSaving?.(false)
    }
  }

  return { markToday }
}
