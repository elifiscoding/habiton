import React from "react"
import CompletionRing from "../Elements/CompletionRing"

export default function HabitList({
  habits,
  stats,
  streaks,
  onUpdateHabit,
  onDeleteHabit,
  onLog,
  onUpdateHabitStat,
  onUpdateStreak
}) {
  return (
    <div className="card-s overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
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
              <tr key={h.id} className="border-b last:border-0">
                <td className="p-2 flex items-center gap-2">
                  <span>{h.icon || "🏷️"}</span>
                  <span>{h.title}</span>
                </td>
                <td className="p-2">{st?.streak_current || "-"}</td>
                <td className="p-2">
                  <CompletionRing
                    pct={stat?.completion_rate_pct ?? 0}
                    count={stat?.done_days ?? 0}
                    size={24}
                    stroke={3}
                  />
                </td>
                <td className="p-2 text-right">
                  <button
                    className="btn-sm bg-green-500 text-white hover:bg-green-600"
                    onClick={() => {
                      // reuse same markToday logic you used in HabitCard
                      onLog?.(h.id, { status: "done", date: new Date().toISOString().split("T")[0] })
                    }}
                  >
                    ✅ Done
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
