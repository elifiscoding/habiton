import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { toLocalYMD } from "../utils/dates"


/**
 * useRecentLogs: fetches recent 7-day logs for one or many habits.
 * @param {string[]} habitIds
 * @returns [recentLogs, setRecentLogs]
 *   recentLogs: Map<hid, Array<{date, status}>>
 */
export function useRecentLogs(habitIds = []) {
  const [recentLogs, setRecentLogs] = useState(new Map())

  useEffect(() => {
    if (!habitIds.length) return

    ;(async () => {
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - 6)
      

      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from("habit_logs")
        .select("habit_id, log_date, status")
        .in("habit_id", habitIds)
        .eq("user_id", uid)
        .gte("log_date", toLocalYMD(start))
        .lte("log_date", toLocalYMD(now))
        .order("log_date", { ascending: true })

      if (error) {
        console.error("Failed to fetch logs:", error)
        return
      }

      const grouped = new Map()
      for (const hid of habitIds) {
        const map = new Map(
          (data || [])
            .filter(r => r.habit_id === hid)
            .map(r => [r.log_date, r.status])
        )
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now)
          d.setDate(now.getDate() - (6 - i))
          const key = toLocalYMD(d)
          return { date: key, status: map.get(key) ?? null }
        })
        grouped.set(hid, days)
      }


      setRecentLogs(grouped)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitIds.join(",")])

  return [recentLogs, setRecentLogs]
}
