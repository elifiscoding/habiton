import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import HabitCard from "../habits/HabitCard"
import AddHabitModal from "../habits/AddHabitModal"

import { Button} from "../ui"


export default function Dashboard() {
  const [habits, setHabits] = useState([])
  const [stats, setStats] = useState([])
  const [streaks, setStreaks] = useState([])
  const [categories, setCategories] = useState([])
  const [me, setMe] = useState({ id: "", email: "" })
  const [q, setQ] = useState("")
  const [sort, setSort] = useState("created") // created | name | category
  const [categorySort, setCategorySort] = useState("name") // name | count
  const [habitSort, setHabitSort] = useState("created") // created | name
  const [collapsedCategories, setCollapsedCategories] = useState(new Set())
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

  const reloadCategories = async () => {
    const { data: c } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })
    setCategories(c || [])
  }

  // load once on mount
  const load = async () => {
    setLoading(true)
    const { data: u } = await supabase.auth.getUser()
    setMe({ id: u?.user?.id ?? "", email: u?.user?.email ?? "" })

    const { data: h } = await supabase
      .from("habits")
      .select("*, categories:category_id ( id, name, color )")
      .order("created_at", { ascending: true })
    // normalize category shape to match services
    const normalized = (h || []).map(x => ({ ...x, category: x.categories || null }))
    setHabits(normalized)

    await reloadCategories()

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
    let filtered = n ? habits.filter(h => (h.title || "").toLowerCase().includes(n)) : habits
    
    // Sort habits
    if (sort === "name") {
      filtered = [...filtered].sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    } else if (sort === "category") {
      filtered = [...filtered].sort((a, b) => {
        const aCat = a.category?.name || "Uncategorized"
        const bCat = b.category?.name || "Uncategorized"
        return aCat.localeCompare(bCat)
      })
    } else if (sort === "created") {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    
    return filtered
  }, [habits, q, sort])

  // Group by category name for vertical grouping
  const groups = useMemo(() => {
    const map = new Map()
    for (const h of filtered) {
      const key = h.category?.name || "Uncategorized"
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(h)
    }
    
    // Sort categories
    let sortedCategories = Array.from(map.entries())
    if (categorySort === "name") {
      sortedCategories = sortedCategories.sort((a, b) => a[0].localeCompare(b[0]))
    } else if (categorySort === "count") {
      sortedCategories = sortedCategories.sort((a, b) => b[1].length - a[1].length)
    }
    
    // Sort habits within each category
    return sortedCategories.map(([categoryName, habits]) => {
      let sortedHabits = [...habits]
      if (habitSort === "name") {
        sortedHabits = sortedHabits.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      } else if (habitSort === "created") {
        sortedHabits = sortedHabits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
      return [categoryName, sortedHabits]
    })
  }, [filtered, categorySort, habitSort])

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

  const onCategoryAdded = (cat) => {
    setCategories(prev => {
      if (prev.find(c => c.id === cat.id)) return prev
      return [...prev, cat].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const toggleCategory = (categoryName) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
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
          <select className="input-sm max-w-[180px]" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="created">Sort by created</option>
            <option value="name">Sort by name</option>
            <option value="category">Sort by category</option>
          </select>
          <Button
            size="sm"
            variant="primary"
            className="ml-auto"
            onClick={() => setShowModal(true)}
          >
            New Habit
          </Button>
        </div>

        {/* separate sorting controls for grouped view */}
        {sort === "category" && (
          <div className="card-s flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-300">Sort categories:</span>
            <select className="input-sm max-w-[140px]" value={categorySort} onChange={e => setCategorySort(e.target.value)}>
              <option value="name">By name</option>
              <option value="count">By habit count</option>
            </select>
            <span className="text-gray-600 dark:text-gray-300">Sort habits:</span>
            <select className="input-sm max-w-[140px]" value={habitSort} onChange={e => setHabitSort(e.target.value)}>
              <option value="created">By created</option>
              <option value="name">By name</option>
            </select>
          </div>
        )}

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
          <section className="space-y-4">
            {groups.map(([name, items]) => {
              const isCollapsed = collapsedCategories.has(name)
              const categoryColor = categories.find(c => c.name === name)?.color || "#3b82f6"
              
              return (
                <div key={name} className="relative">
                  {/* Category header with background */}
                  <div 
                    className="relative rounded-lg p-3 mb-2 cursor-pointer"
                    style={{ backgroundColor: `${categoryColor}20` }}
                    onClick={() => toggleCategory(name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {name} ({items.length} habits)
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {isCollapsed ? "▶" : "▼"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Habits grid */}
                  {!isCollapsed && (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map(h => (
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
                          categories={categories}
                          onCategoryAdded={onCategoryAdded}
                          reloadCategories={reloadCategories}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
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
