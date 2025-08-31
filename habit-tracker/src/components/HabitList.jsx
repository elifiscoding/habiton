// HabitList.jsx
import React, { useEffect } from "react"
import { Button, Badge, CompletionRing } from "./ui"
import { useMarkToday } from "../hooks/useMarkToday"
import { useRecentLogs } from "../hooks/useRecentLogs"
import { todayLocal } from "../utils/dates"
import { currentStreakFromRecent } from "../utils/habitMetrics"

export default function HabitList({
  habits,
  stats,              // Map<hid, stat>
  streaks,            // Map<hid, streak>
  onLog,
  onUpdateHabitStat,
  onUpdateStreak
}) {
  const [recentLogs, setRecentLogs] = useRecentLogs(habits.map(h => h.id))
  const today = todayLocal()

  // Recompute streaks on load/refresh so they are correct immediately
  useEffect(() => {
    if (!recentLogs) return
    for (const h of habits) {
      const arr = recentLogs.get(h.id) || []
      const next = currentStreakFromRecent(arr, today)
      onUpdateStreak?.(h.id, next)
    }
  }, [recentLogs, habits, today, onUpdateStreak])

  const { markToday, undoToday } = useMarkToday({
    getRecent: (hid) => recentLogs.get(hid) || [],
    setRecent: (hid, updater) => {
      setRecentLogs(prev => {
        const newMap = new Map(prev)
        const updated = updater(prev.get(hid) || [])
        newMap.set(hid, updated)
        return newMap
      })
    },
    getStat: (hid) => stats.get(hid),
    onUpdateStat: onUpdateHabitStat,
    onUpdateStreak,  // hook updates on toggle too
    onLog,
  })

  return (
    <div className="card-s overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b dark:border-gray-700">
            <th className="p-2">Habit</th>
            <th className="p-2">Category</th>
            <th className="p-2">Streak</th>
            <th className="p-2">Goal</th>
            <th className="p-2">30d %</th>
            <th className="p-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => {
            const stat = stats.get(h.id)
            const st = streaks.get(h.id)
            const days = recentLogs.get(h.id) || []
            const isDoneToday = days.some(d => d.date === today && d.status === "done")
            return (
              <tr key={h.id} className="border-b last:border-0 dark:border-gray-700">
                <td className="p-2 flex items-center gap-2">
                  <span>{h.icon || "🏷️"}</span>
                  <span className="font-medium truncate">{h.title}</span>
                  {!h.is_active && <Badge>paused</Badge>}
                </td>

                <td className="p-2">
                  {h.category_id && h.category_name ? (
                    <a href={`/categories/${h.category_id}`} className="inline-block">
                      <Badge style={h.category_color ? { backgroundColor: h.category_color } : undefined}>
                        {h.category_name}
                      </Badge>
                    </a>
                  ) : (
                    <span className="subtle">—</span>
                  )}
                </td>

                <td className="p-2">
                  <Badge>
                    <span aria-hidden>🔥</span>
                    <span>{st ? (st.streak_current > 0 ? `${st.streak_current}d` : "-") : "-"}</span>
                  </Badge>
                </td>

                <td className="p-2 subtle">
                  {(h.goal_target ?? 0)}/{h.goal_period || "monthly"} • {h.frequency || "daily"}
                </td>

                <td className="p-2">
                  <CompletionRing
                    pct={stat?.completion_rate_pct ?? 0}
                    count={stat?.done_days ?? 0}
                    size={24}
                    stroke={3}
                  />
                </td>

                <td className="p-2 text-right">
                  {!isDoneToday ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => h.is_active && markToday(h.id)}
                      disabled={!h.is_active}
                      title={h.is_active ? "Mark as done today" : "This habit is paused"}
                    >
                      ✅ Done
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => undoToday(h.id)}
                      title="Undo today's completion"
                    >
                      ↩️ Undo
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
