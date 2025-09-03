import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import HabitCard from "../habits/HabitCard"
import AddHabitModal from "../habits/AddHabitModal"

import { Button} from "../ui"


export default function Dashboard() {
  const [habits, setHabits] = useState([])
  const [stats, setStats] = useState([])
  const [streaks, setStreaks] = useState([])
  const [me, setMe] = useState({ id: "", email: "" })
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState("cards")   // ✅ add view state

  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  // load once on mount
  const load = async () => {
    setLoading(true)
    const { data: u } = await supabase.auth.getUser()
    setMe({ id: u?.user?.id ?? "", email: u?.user?.email ?? "" })

    const { data: h } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: true })
    setHabits(h || [])

    const { data: s } = await supabase.from("v_habit_30d_stats").select("*")
    setStats(s || [])

    const { data: st } = await supabase.from("v_habit_streaks").select("*")
    setStreaks(st || [])

    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // maps for stats/streaks
  const byHabit   = useMemo(() => new Map(stats.map(r => [r.habit_id, r])), [stats])
  const streakMap = useMemo(() => new Map(streaks.map(r => [r.habit_id, r])), [streaks])
  const filtered  = useMemo(() => {
    const n = q.trim().toLowerCase()
    return n ? habits.filter(h => (h.title || "").toLowerCase().includes(n)) : habits
  }, [habits, q])

  // optimistic mutators
  const updateHabit = (id, changes) => {
    setHabits(habits.map(h => (h.id === id ? { ...h, ...changes } : h)))
  }
  const updateHabitStat = (id, changes) => {
    setStats(prev => prev.map(s => (s.habit_id === id ? { ...s, ...changes } : s)))
  }
  const updateStreak = (id, changes) => {
    setStreaks(prev => prev.map(s => (s.habit_id === id ? { ...s, ...changes } : s)))
  }
  const deleteHabit = id => {
    setHabits(habits.filter(h => h.id !== id))
  }
  const logHabit = (habitId, log) => {
    console.log("optimistic log:", habitId, log)
  }

  return (
    <>
      {/* header bar */}
      <div className="header-bar">
        <div className="container-slim py-2 flex items-center justify-between gap-4">
          <div className="text-lg font-semibold">Habiton</div>
          <div className="subtle">Welcome, {me.email}!</div>
          <div className="flex gap-2">
            <button className="btn-sm" onClick={load}>Refresh</button>
            <button className="btn-sm" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
          <button
            className="btn-sm"
            onClick={() => setDark(!dark)}
          >
            {dark ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      

      {/* main area */}
      <main className="container-slim py-4 space-y-3">
        {/* search + new habit */}
        <div className="card-s flex flex-wrap items-center gap-2">
          <input
            className="input-sm flex-1 min-w-[180px]"
            placeholder="Search habits…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <Button
            size="sm"
            variant="primary"
            className="ml-auto"
            onClick={() => setShowModal(true)}
          >
            New Habit
          </Button>
        </div>

        {/* view toggle */}
        <div className="flex justify-end gap-2">
          <button
            className={`btn-sm ${view === "cards" ? "bg-gray-200" : ""}`}
            onClick={() => setView("cards")}
          >
            🔲 Cards
          </button>
          <button
            className={`btn-sm ${view === "list" ? "bg-gray-200" : ""}`}
            onClick={() => setView("list")}
          >
            📋 List
          </button>
        </div>

        {/* habits area */}
        {loading ? (
          <div className="card-s">Loading…</div>
        ) : (
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                stat={byHabit.get(h.id)}
                streaks={streakMap.get(h.id)}
                onUpdateHabit={updateHabit}
                onDeleteHabit={deleteHabit}
                onLog={logHabit}
                onUpdateHabitStat={updateHabitStat}
                onUpdateStreak={updateStreak}
              />
            ))}
            {!filtered.length && (
              <div className="card-s text-gray-600">
                No habits match “{q}”.
              </div>
            )}
          </section>
        )}
      </main>

      {/* modal */}
      <AddHabitModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdded={load}
      />
    </>
  )
}
