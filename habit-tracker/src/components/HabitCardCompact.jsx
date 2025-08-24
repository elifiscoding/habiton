import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayLocal, toISODate } from '../utils/dates'
import CompletionRing from '../Elements/CompletionRing'
import WeekDots from '../Elements/WeekDots'

export default function HabitCard({
                        habit, stat, streaks,
                        onUpdateHabit, onDeleteHabit, onLog,
                        onUpdateHabitStat, onUpdateStreak
                      }) {
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(habit.title)
  const [description, setDescription] = useState(habit.description ?? '')
  const [icon, setIcon] = useState(habit.icon ?? '🏷️')
  const [showDelete, setShowDelete] = useState(false)
  const [flash, setFlash] = useState(false)
  const headerRef = useRef(null)
  const today = todayLocal()

  const [recent7, setRecent7] = useState([])
  useEffect(() => {
    (async () => {
      const now = new Date()
      const start = new Date(now); start.setDate(now.getDate() - 6)
      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      const { data } = await supabase
        .from('habit_logs')
        .select('log_date,status')
        .eq('habit_id', habit.id)
        .eq('user_id', uid)
        .gte('log_date', toISODate(start))
        .lte('log_date', toISODate(now))
        .order('log_date', { ascending: true })
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
      setDescription(habit.description ?? '')
      setIcon(habit.icon ?? '🏷️')
    }
  }, [habit.id, habit.title, habit.description, habit.icon, editing])

  const saveEdit = async () => {
    const t = title.trim()
    if (!t) return cancelEdit()
    setEditing(false)
    onUpdateHabit?.(habit.id, { title: t, description, icon }) // optimistic update
    const { error } = await supabase.from('habits')
      .update({ title: t, description: description.trim(), icon })
      .eq('id', habit.id)
    if (error) alert(error.message)
  }

  const cancelEdit = () => {
    setEditing(false)
    setTitle(habit.title)
    setDescription(habit.description ?? '')
    setIcon(habit.icon ?? '🏷️')
  }

  const del = async () => {
    if (!confirm(`Delete "${habit.title}"?`)) return
    onDeleteHabit?.(habit.id) // optimistic
    const { error } = await supabase.from('habits').delete().eq('id', habit.id)
    if (error) alert(error.message)
  }

  const markToday = async () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 700)

    // ✅ optimistic week dots
    setRecent7(prev => prev.map(d =>
      d.date === today ? { ...d, status: 'done' } : d
    ))

    // ✅ optimistic completion %
    if (stat) {
      const newDoneDays = (stat.done_days || 0) + 1
      const newPct = (newDoneDays / 30) * 100
      onUpdateHabitStat?.(habit.id, {
        done_days: newDoneDays,
        completion_rate_pct: newPct
      })
    }

    // ✅ optimistic streak
    if (streaks) {
      const newCur = (streaks.streak_current || 0) + 1
      const newBest = Math.max(streaks.streak_best || 0, newCur)
      onUpdateStreak?.(habit.id, {
        streak_current: newCur,
        streak_best: newBest
      })
    }

    onLog?.(habit.id, { status: 'done', date: today })

    setSaving(true)
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    const { error } = await supabase.from('habit_logs').upsert(
      { user_id: uid, habit_id: habit.id, log_date: today, status: 'done' },
      { onConflict: 'habit_id,log_date' }
    )
    setSaving(false)
    if (error) alert(error.message)
  }

  

  return (
    <div className={`card-s relative space-y-2 transition ${flash ? 'flash-success' : ''}`}>
      {/* delete (x) */}
      <div
        className="absolute right-1 top-1 h-8 w-8"
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
      />
      {showDelete && (
        <button
          className="absolute right-1 top-1 h-6 w-6 rounded bg-red-500 text-white text-xs grid place-items-center shadow"
          onClick={del}
        >×</button>
      )}

      {/* header */}
      <div ref={headerRef} className="flex-1 min-w-0 pr-8 cursor-default" onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <div className="space-y-1">
            <input
              className="input-sm"
              value={title}
              onChange={e=>setTitle(e.target.value)}
              onKeyDown={e=>e.key==='Enter' && saveEdit()}
              autoFocus
            />
            <input
              className="input-sm"
              value={description}
              onChange={e=>setDescription(e.target.value)}
              placeholder="Description"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1">
              <span>{icon}</span>
              <div className="font-semibold text-[13px] truncate">{habit.title}</div>
            </div>
            {habit.description && <div className="subtle text-sm truncate">{habit.description}</div>}
          </div>
        )}
      </div>

      {/* metrics */}
      <div className="flex items-center justify-between gap-2">
        <CompletionRing
          pct={stat?.completion_rate_pct ?? 0}
          count={stat?.done_days ?? 0}
          size={32}
          stroke={4}
        />
        <WeekDots items={recent7} />
      </div>

      {/* ✅ Done button bottom-right */}
      <div className="flex justify-end">
        <button
          className={`px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition
                      ${saving ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          onClick={markToday}
          disabled={saving}
        >
          {saving ? '…' : '✅ Done'}
        </button>
      </div>
    </div>
  )
}
