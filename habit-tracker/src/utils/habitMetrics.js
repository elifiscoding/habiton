// utils/habitMetrics.js
import { todayLocal, toLocalYMD } from "../utils/dates"

/**
 * We treat the completion % as "last 30 days".
 * done_days = number of days marked 'done' within [today - 29, today]
 * completion_rate_pct = round(100 * done_days / 30)
 */
export const WINDOW_DAYS = 30

function isWithinLastNDays(ymd, todayYMD, n = WINDOW_DAYS) {
  const t = new Date(todayYMD)
  const d = new Date(ymd)
  const from = new Date(t)
  from.setDate(t.getDate() - (n - 1))
  return d >= from && d <= t
}

/**
 * Lightweight, incremental stat updates that don't need full 30d history.
 * This is exact for toggling *today* only.
 *
 * prevStat: { done_days?: number, completion_rate_pct?: number }
 * wasDoneTodayBefore: boolean (whether tfoday was already done before this action)
 * isMark: boolean (true for mark, false for undo)
 * todayYMD: string 'YYYY-MM-DD'
 */
export function nextThirtyDayStatAfterTodayToggle({
  prevStat,
  wasDoneTodayBefore,
  isMark,
  todayYMD = todayLocal(),
}) {
  const prevDone = Math.max(0, Number(prevStat?.done_days ?? 0))

  let nextDone = prevDone
  // Only change count if the action actually *changes* today's state
  if (isMark && !wasDoneTodayBefore) nextDone = prevDone + 1
  if (!isMark && wasDoneTodayBefore) nextDone = Math.max(0, prevDone - 1)

  const pct = Math.round((nextDone / WINDOW_DAYS) * 100)
  return {
    done_days: nextDone,
    completion_rate_pct: pct,
  }
}

/**
 * Streak rules (current streak only):
 * - When you MARK today:
 *    current = wasDoneYesterday ? prevCurrent + 1 : 1
 * - When you UNDO today:
 *    current = 0
 *
 * (We assume toggles are for 'today'. For historical edits, you’d need a recompute.)
 *
 * prevStreak: { streak_current?: number }
 * wasDoneYesterday: boolean
 */
export function nextStreakAfterTodayToggle({
  prevStreak,
  wasDoneYesterday,
  isMark,
}) {
  const prevCur = Math.max(0, Number(prevStreak?.streak_current ?? 0))
  if (isMark) {
    return {
      streak_current: wasDoneYesterday ? prevCur + 1 : 1,
    }
  } else {
    // undo today => current streak breaks
    return {
      streak_current: 0,
    }
  }
}

/**
 * Helper to derive booleans for today/yesterday from a 7-day array:
 * recent7: [{ date:'YYYY-MM-DD', status:'done' | null }, ...] (ascending)
 */
export function getTodayAndYesterdayFlags(recent7, todayYMD = todayLocal()) {
  const map = new Map((recent7 || []).map(d => [d.date, d.status === "done"]))
  const todayDone = !!map.get(todayYMD)

  const y = new Date(todayYMD)
  y.setDate(y.getDate() - 1)
  const ymdY = toLocalYMD(y)
  const yDone = !!map.get(ymdY)

  return { wasDoneTodayBefore: todayDone, wasDoneYesterday: yDone }
}




/** Current streak = consecutive 'done' days ending today (or yesterday if today not done). */
export function currentStreakFromRecent(recent7, todayYMD = todayLocal()) {
  if (!Array.isArray(recent7) || recent7.length === 0) return { streak_current: 0 };

  const doneSet = new Set(recent7.filter(r => r?.status === "done").map(r => r.date));

  // start: today if done, else yesterday
  let cursor = new Date(todayYMD);
  if (!doneSet.has(todayYMD)) cursor.setDate(cursor.getDate() - 1);

  let count = 0;
  for (let i = 0; i < recent7.length; i++) {
    const ymd = toLocalYMD(cursor);
    if (doneSet.has(ymd)) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return { streak_current: count };
}