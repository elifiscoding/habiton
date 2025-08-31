import React from "react"
import { Button, Badge, CompletionRing } from "./ui"
import { useMarkToday } from "../hooks/useMarkToday"
import { useRecentLogs } from "../hooks/useRecetLogs"

export default function HabitList({
  habits,
  stats,     // Map<hid, stat>
  streaks,   // Map<hid, streak>
  onLog,
  onUpdateHabitStat,
  onUpdateStreak
}) {
  const [recentLogs, setRecentLogs] = useRecentLogs(habits.map(h => h.id))

  const { markToday } = useMarkToday({
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
    getStreak: (hid) => streaks.get(hid),
    onUpdateStat: onUpdateHabitStat,
    onUpdateStreak: onUpdateStreak,
    onLog,
  })

  return (
    <div className="card-s overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b dark:border-gray-700">
            <th className="p-2">Habit</th>
            <th className="p-2">Streak</th>
            <th className="p-2">30d %</th>
            <th className="p-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => {
            const stat = stats.get(h.id)
            const st = streaks.get(h.id)
            return (
              <tr key={h.id} className="border-b last:border-0 dark:border-gray-700">
                <td className="p-2 flex items-center gap-2">
                  <span>{h.icon || "🏷️"}</span>
                  <span className="font-medium">{h.title}</span>
                </td>
                <td className="p-2">
                  <Badge>
                    <span aria-hidden>🔥</span>
                    <span>{st ? (st.streak_current > 0 ? `${st.streak_current}d` : "-") : "-"}</span>
                  </Badge>
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
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => markToday(h.id)}
                  >
                    ✅ Done
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
