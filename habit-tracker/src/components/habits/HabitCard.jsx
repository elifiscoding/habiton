// HabitCard.jsx
import React, { useEffect, useRef, useState, useMemo } from "react"
import clsx from "clsx"
import { supabase } from "../../lib/supabase"
import { toLocalYMD, todayLocal } from "../../utils/dates"
import { Card, Button, Input, Badge, CompletionRing, WeekDots } from "../ui"
import { useMarkToday, LOCAL_OVERRIDES } from "../../hooks/useMarkToday"
import { currentStreakFromRecent } from "../../utils/habitMetrics"

import HabitEditor from "./HabitEditor"


export default function HabitCard({
  habit, stat, streaks,
  onUpdateHabit, onDeleteHabit, onLog,
  onUpdateHabitStat, onUpdateStreak
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(habit.title)
  const [description, setDescription] = useState(habit.description ?? "")
  const [icon, setIcon] = useState(habit.icon ?? "🏷️")
  const [recent7, setRecent7] = useState([])
  const [flash, setFlash] = useState(false)
  const headerRef = useRef(null)
  const today = todayLocal()

  const isDoneToday = useMemo(
    () => recent7.find(d => d.date === today && d.status === "done"),
    [recent7, today]
  )

  // Load last 7 logs
  useEffect(() => {
    (async () => {
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - 6)

      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from("habit_logs")
        .select("log_date,status")
        .eq("habit_id", habit.id)
        .eq("user_id", uid)
        .gte("log_date", toLocalYMD(start))
        .lte("log_date", toLocalYMD(now))
        .order("log_date", { ascending: true })

      if (error) { console.error(error); return }

      const map = new Map((data || []).map(r => [r.log_date, r.status]))
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(now.getDate() - (6 - i))
        const key = toLocalYMD(d)
        // prefer override if present
      const local = LOCAL_OVERRIDES.get(`${habit.id}:${key}`)
      let status
      if (local === "done") status = "done"
      else if (local === "undone") status = null
      else status = map.get(key) ?? null
        return { date: key, status }
      })
      setRecent7(days)

      const nextStreak = currentStreakFromRecent(days, today)
      onUpdateStreak?.(habit.id, nextStreak)
    })()
  }, [habit.id, onUpdateStreak, today])

  useEffect(() => {
    if (!editing) {
      setTitle(habit.title)
      setDescription(habit.description ?? "")
      setIcon(habit.icon ?? "🏷️")
    }
  }, [habit, editing])

  const saveEdit = async () => {
    const t = title.trim()
    if (!t) return cancelEdit()
    setEditing(false)
    onUpdateHabit?.(habit.id, { title: t, description, icon }) // optimistic
    const { error } = await supabase
      .from("habits")
      .update({ title: t, description: description.trim(), icon })
      .eq("id", habit.id)
    if (error) alert(error.message)
  }
  const cancelEdit = () => {
    setEditing(false)
    setTitle(habit.title)
    setDescription(habit.description ?? "")
    setIcon(habit.icon ?? "🏷️")
  }

  const del = async () => {
    if (!confirm(`Delete "${habit.title}"?`)) return
    onDeleteHabit?.(habit.id)
    const { error } = await supabase.from("habits").delete().eq("id", habit.id)
    if (error) alert(error.message)
  }

  const toggleActive = async () => {
    const next = !habit.is_active
    onUpdateHabit?.(habit.id, { is_active: next }) // optimistic
    const { error } = await supabase
      .from("habits")
      .update({ is_active: next })
      .eq("id", habit.id)
    if (error) {
      alert(error.message)
      onUpdateHabit?.(habit.id, { is_active: habit.is_active }) // rollback
    }
  }

  const { markToday, undoToday } = useMarkToday({
    getRecent: (hid) => hid === habit.id ? recent7 : [],
    setRecent: (_hid, arr) => setRecent7(arr),
    getStat: () => stat,
    onUpdateStat: onUpdateHabitStat,
    onUpdateStreak: (_hid, next) => onUpdateStreak?.(habit.id, next),
    onLog,
    setFlash,
  })

  return (
    <Card size="sm" className={clsx(
      "relative space-y-2 transition",
      !habit.is_active && "opacity-60",
      flash && "flash-success"
    )}>
      {/* delete (x) — hover reveal */}
      <div className="absolute right-1 top-1 group z-10">
        <div className="h-8 w-8 rounded-md"></div>
        <button
          type="button"
          aria-label="Delete habit"
          onClick={(e) => { e.stopPropagation(); del() }}
          className="
            absolute inset-0 m-auto h-6 w-6
            rounded-full text-xs grid place-items-center shadow
            bg-red-500 text-white
            opacity-0 pointer-events-none
            transition
            group-hover:opacity-100 group-hover:pointer-events-auto
            hover:bg-red-600
          "
        >
          ×
        </button>
      </div>

      {/* header / edit */}
      <div
        ref={headerRef}
        className="flex-1 min-w-0 pr-8 cursor-default"
        onDoubleClick={() => setEditing(true)}
      >
        <div className="flex items-center gap-2">
          {/* Toggle is always fixed on the left */}
          <Button
            variant="switch"
            isActive={habit.is_active}
            title={habit.is_active ? "Pause" : "Resume"}
            onClick={toggleActive}
          />

          {/* Editable block: icon + title */}
          {editing ? (
            <HabitEditor
              habit={habit}
              onSave={(changes) => {
                setEditing(false)
                onUpdateHabit?.(habit.id, changes)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span>{icon}</span>
              <div className="font-semibold text-[13px] truncate">
                {habit.title}
              </div>
            </div>
          )}
        </div>

        {/* Description always below */}
        {!editing && habit.description && (
          <div className="subtle text-sm truncate mt-1">{habit.description}</div>
        )}
      </div>


      {/* metrics */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CompletionRing
            pct={stat?.completion_rate_pct ?? 0}
            count={stat?.done_days ?? 0}
            size={32}
            stroke={4}
          />
          <Badge>
            <span aria-hidden>🔥</span>
            <span>{streaks ? (streaks.streak_current > 0 ? `${streaks.streak_current}d` : "-") : "-"}</span>
          </Badge>
        </div>
        <WeekDots items={recent7} />
      </div>

      {/* Done / Undo */}
      <div className="flex justify-end gap-2">
        {!isDoneToday ? (
          <Button
            size="sm"
            variant="success"
            onClick={() => habit.is_active && markToday(habit.id)}
            disabled={!habit.is_active}
            title={habit.is_active ? "Mark as done today" : "This habit is paused"}
          >
            ✅ Done
          </Button>
        ) : (
          <Button
            size="sm"
            variant="warning"
            onClick={() => undoToday(habit.id)}
            title="Undo today's completion"
          >
            ↩️ Undo
          </Button>
        )}
      </div>
    </Card>
  )
}
