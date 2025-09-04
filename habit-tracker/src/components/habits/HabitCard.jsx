// HabitCard.jsx
import React, { useEffect, useRef, useState, useMemo } from "react"
import clsx from "clsx"
import { supabase } from "../../lib/supabase"
import { toLocalYMD, todayLocal } from "../../utils/dates"
import { Card, Button, Input, Badge, CompletionRing, WeekDots } from "../ui"
import { useMarkToday, LOCAL_OVERRIDES } from "../../hooks/useMarkToday"
import { currentStreakFromRecent } from "../../utils/habitMetrics"

import HabitEditor from "./HabitEditor"
import { CATEGORY_COLORS } from "../../utils/categoriesColors"


export default function HabitCard({
  habit, stat, streaks,
  onUpdateHabit, onDeleteHabit, onLog,
  onUpdateHabitStat, onUpdateStreak,
  categories = [],
  onCategoryAdded,
  reloadCategories,
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(habit.title)
  const [description, setDescription] = useState(habit.description ?? "")
  const [icon, setIcon] = useState(habit.icon ?? "🏷️")
  const [recent7, setRecent7] = useState([])
  const [flash, setFlash] = useState(false)
  const headerRef = useRef(null)
  const today = todayLocal()

  const [showCats, setShowCats] = useState(false)
  const [newCat, setNewCat] = useState("")
  const [selectedColor, setSelectedColor] = useState("#10b981")
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const popRef = useRef(null)
  const menuRef = useRef(null)

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

  useEffect(() => {
    function onDocClick(e) {
      if (showCats && popRef.current && !popRef.current.contains(e.target)) {
        setShowCats(false)
      }
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [showCats, showMenu])

  // Close category popover when entering edit mode
  useEffect(() => {
    if (editing && showCats) setShowCats(false)
  }, [editing, showCats])

  const changeCategory = async (categoryId) => {
    const nextCategory = categories.find(c => c.id === categoryId) || null
    onUpdateHabit?.(habit.id, { category_id: categoryId, category: nextCategory })
    const { error } = await supabase.from("habits").update({ category_id: categoryId }).eq("id", habit.id)
    if (error) alert(error.message)
    setShowCats(false)
  }

  const createCategoryWithColor = async (colorArg) => {
    const name = newCat.trim()
    if (!name) return
    const color = colorArg || selectedColor
    // If a category with the same name exists (case-insensitive), use it instead
    const existing = (categories || []).find(c => (c.name || "").trim().toLowerCase() === name.toLowerCase())
    if (existing) {
      setNewCat("")
      await changeCategory(existing.id)
      setShowCats(false)
      return
    }
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    const payload = uid ? { name, color, user_id: uid } : { name, color }
    const { data, error } = await supabase.from("categories").insert(payload).select().single()
    if (error) { alert(error.message); return }
    onCategoryAdded?.(data)
    if (reloadCategories) await reloadCategories()
    setNewCat("")
    await changeCategory(data.id)
  }

  return (
    <div className={clsx(
      "relative bg-gray-100 dark:bg-gray-800 rounded-lg p-0 transition",
      !habit.is_active && "opacity-60",
      flash && "flash-success"
    )}>

      {/* Header bar - 10% height with category color */}
      <div 
        className="h-10 rounded-t-lg flex items-center justify-between px-3"
        style={{ backgroundColor: habit.category?.color || "#3b82f6" }}
        onDoubleClick={() => setEditing(true)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{icon}</span>
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
            <div className="font-semibold text-white text-sm truncate">
              {habit.title}
            </div>
          )}
        </div>
        <Button
          variant="switch"
          isActive={habit.is_active}
          title={habit.is_active ? "Pause" : "Resume"}
          onClick={toggleActive}
        />
      </div>

      {/* Main content area */}
      <div className="p-3 flex items-center justify-between">
        {/* Left side content */}
        <div className="flex-1 space-y-2">
          {/* Frequency and amount */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>🕐</span>
            <span>
              {habit.goal_frequency || 'daily'} | {habit.goal_amount || 1} {habit.goal_amount_type || 'times'}
              {habit.goal_frequency === 'weekly' ? '/week' : habit.goal_frequency === 'monthly' ? '/month' : ''}
            </span>
          </div>

          {/* Completion ring and streak */}
          <div className="flex items-center gap-3">
            <CompletionRing
              pct={stat?.completion_rate_pct ?? 0}
              count={stat?.done_days ?? 0}
              size={28}
              stroke={3}
            />
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <span aria-hidden>🔥</span>
              <span>{streaks ? (streaks.streak_current > 0 ? `${streaks.streak_current}` : "0") : "0"}</span>
            </Badge>
          </div>

          {/* Weekly progress */}
          <div className="flex items-center gap-2 ml-2">
            <WeekDots items={recent7} />
          </div>
        </div>

        {/* Right side - Done button and menu */}
        <div className="ml-4 flex flex-col items-end gap-2">
          {!isDoneToday ? (
            <Button
              size="md"
              variant="success"
              onClick={() => habit.is_active && markToday(habit.id)}
              disabled={!habit.is_active}
              title={habit.is_active ? "Mark as done today" : "This habit is paused"}
              className="h-12 w-12 rounded-lg text-lg"
            >
              ✅
            </Button>
          ) : (
            <Button
              size="md"
              variant="warning"
              onClick={() => undoToday(habit.id)}
              title="Undo today's completion"
              className="h-12 w-12 rounded-lg text-lg"
            >
              ↩️
            </Button>
          )}
          
          {/* Three dots menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="More options"
            >
              ⋯
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg border dark:border-gray-600 py-1 z-20">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowEditModal(true)
                    setShowMenu(false)
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400"
                  onClick={() => {
                    if (confirm(`Delete "${habit.title}"?`)) {
                      del()
                    }
                    setShowMenu(false)
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCats && (
        <div ref={popRef} className="absolute right-2 top-9 z-20 w-56 rounded-md border bg-white shadow dark:bg-gray-800 dark:border-gray-700 p-2 space-y-2">
          <div className="max-h-48 overflow-auto space-y-1">
            {categories.map(c => (
              <button
                key={c.id}
                className={clsx(
                  "w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                  habit.category?.id === c.id && "bg-gray-100 dark:bg-gray-700"
                )}
                onClick={() => changeCategory(c.id)}
              >
                <span className="inline-block w-3 h-3 rounded mr-2 align-middle" style={{ background: c.color || "#e5e7eb" }} />
                {c.name}
              </button>
            ))}
            {!categories.length && (
              <div className="px-2 py-1 text-xs text-gray-500">No categories</div>
            )}
          </div>
          <div className="border-t dark:border-gray-700 pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                className="input-sm flex-1"
                placeholder="New category"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
              />
              <Button size="sm" variant="primary" onClick={() => createCategoryWithColor(selectedColor)}>Add</Button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className="h-6 w-6 rounded border"
                  style={{ background: c, borderColor: "#e5e7eb" }}
                  onClick={() => setSelectedColor(c)}
                  title={c}
                />)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Habit</h3>
            <HabitEditor
              habit={habit}
              onSave={(changes) => {
                setShowEditModal(false)
                onUpdateHabit?.(habit.id, changes)
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
