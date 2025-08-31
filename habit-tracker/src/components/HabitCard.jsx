import React, { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { supabase } from "../lib/supabase"
import { toISODate, todayLocal } from "../utils/dates"
import { Card, Button, Input, Badge, CompletionRing, WeekDots } from "./ui"
import { useMarkToday } from "../hooks/useMarkToday"

export default function HabitCard({
  habit, stat, streaks,
  onUpdateHabit, onDeleteHabit, onLog,
  onUpdateHabitStat, onUpdateStreak
}) {
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(habit.title)
  const [description, setDescription] = useState(habit.description ?? "")
  const [icon, setIcon] = useState(habit.icon ?? "🏷️")
  const [showDelete, setShowDelete] = useState(false)
  const [flash, setFlash] = useState(false)
  const [recent7, setRecent7] = useState([])
  const headerRef = useRef(null)
  const today = todayLocal()

  // load last 7 logs for this habit
  useEffect(() => {
    (async () => {
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - 6)
      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      if (!uid) return
      const { data } = await supabase
        .from("habit_logs")
        .select("log_date,status")
        .eq("habit_id", habit.id)
        .eq("user_id", uid)
        .gte("log_date", toISODate(start))
        .lte("log_date", toISODate(now))
        .order("log_date", { ascending: true })

      const map = new Map((data || []).map(r => [r.log_date, r.status]))
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(now.getDate() - (6 - i))
        return { date: toISODate(d), status: map.get(toISODate(d)) ?? null }
      })
      setRecent7(days)
    })()
  }, [habit.id])

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

  // centralized mark-today using hook
  const { markToday } = useMarkToday({
    getRecent: (hid) => hid === habit.id ? recent7 : [],
    setRecent: (_hid, updater) => setRecent7(updater),
    getStat: () => stat,
    getStreak: () => streaks,
    onUpdateStat: onUpdateHabitStat,
    onUpdateStreak: onUpdateStreak,
    onLog,
    setSaving,
    setFlash,
  })

  return (
    <Card size="sm" className={clsx("relative space-y-2 transition", flash && "flash-success")}>
      {/* hover delete hotspot */}
      {/* delete (x) — CSS-only hover reveal */}
      <div className="absolute right-1 top-1 group z-10">
        {/* hover target area — keeps hover active while moving onto the button */}
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
        {editing ? (
          <div className="space-y-1">
            <Input
              size="sm"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveEdit()}
              autoFocus
            />
            <Input
              size="sm"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1">
              <span>{icon}</span>
              <div className="font-semibold text-[13px] truncate">{habit.title}</div>
            </div>
            {habit.description && (
              <div className="subtle text-sm truncate">{habit.description}</div>
            )}
          </div>
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

      {/* Done */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="success"
          onClick={() => markToday(habit.id)}
          disabled={saving}
        >
          {saving ? "…" : "✅ Done"}
        </Button>
      </div>
    </Card>
  )
}
