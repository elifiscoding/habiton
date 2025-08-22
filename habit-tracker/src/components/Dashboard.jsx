import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function todayLocal() {
  const now = new Date()
  const tzOff = now.getTimezoneOffset() * 60000
  return new Date(Date.now() - tzOff).toISOString().slice(0,10) // YYYY-MM-DD in local time
}

export default function Dashboard() {
  const [habits, setHabits] = useState([])
  const [stats, setStats] = useState([])
  const [streaks, setStreaks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data: h, error: eh } = await supabase.from('habits').select('*').order('created_at', { ascending: true })
    if (eh) throw eh
    const { data: s, error: es } = await supabase.from('v_habit_30d_stats').select('*').order('title', { ascending: true })
    if (es) throw es
    const { data: st, error: est } = await supabase.from('v_habit_streaks').select('*').order('title', { ascending: true })
    if (est) throw est

    setHabits(h || [])
    setStats(s || [])
    setStreaks(st || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const byHabit = useMemo(() => {
    const map = new Map()
    for (const i of stats) map.set(i.habit_id, i)
    return map
  }, [stats])

  const streakMap = useMemo(() => {
    const map = new Map()
    for (const i of streaks) map.set(i.habit_id, i)
    return map
  }, [streaks])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Header onRefresh={load} />
      <AddHabit onAdded={load} />

      {loading ? <div className="card">Loading…</div> : (
        <>
          <section className="grid md:grid-cols-2 gap-4">
            {habits.map(h => (
              <HabitCard key={h.id} habit={h} onChanged={load}
                         stat={byHabit.get(h.id)} streaks={streakMap.get(h.id)} />
            ))}
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold mb-3">30‑Day Completion (per habit)</h2>
            <div style={{width: '100%', height: 280}}>
              <ResponsiveContainer>
                <BarChart data={stats.map(s => ({ title: s.title, done_days: s.done_days }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="done_days" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Header({ onRefresh }) {
  const [email, setEmail] = useState('')
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? ''))
  }, [])
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Habit Tracker</h1>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{email}</span>
        <button className="btn" onClick={onRefresh}>Refresh</button>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  )
}

function AddHabit({ onAdded }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    const { error } = await supabase.from('habits').insert({ title, description, is_active: true })
    setBusy(false)
    if (error) alert(error.message)
    else {
      setTitle(''); setDescription(''); onAdded?.()
    }
  }

  return (
    <form onSubmit={add} className="card space-y-3">
      <h2 className="text-lg font-semibold">Add habit</h2>
      <input className="input" placeholder="Habit title" value={title} onChange={e=>setTitle(e.target.value)} />
      <input className="input" placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} />
      <button className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
    </form>
  )
}

function HabitCard({ habit, stat, streaks, onChanged }) {
  const [status, setStatus] = useState('done')
  const [saving, setSaving] = useState(false)
  const today = todayLocal()

  const markToday = async () => {
    setSaving(true)
    const { error } = await supabase.from('habit_logs').upsert({
      habit_id: habit.id,
      log_date: today,
      status
    }, { onConflict: 'habit_id,log_date' })
    setSaving(false)
    if (error) alert(error.message)
    else onChanged?.()
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{habit.title}</h3>
          <p className="text-sm text-gray-600">{habit.description}</p>
        </div>
        <span className="text-xs text-gray-500">ID: {habit.id.slice(0,8)}…</span>
      </div>

      <div className="flex items-center gap-2">
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="done">done</option>
          <option value="skipped">skipped</option>
          <option value="missed">missed</option>
        </select>
        <button className="btn" onClick={markToday} disabled={saving}>
          {saving ? 'Saving…' : `Mark ${today}`}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <Metric label="30d completion" value={stat ? `${stat.completion_rate_pct ?? 0}%` : '—'} />
        <Metric label="Current streak" value={streaks ? streaks.streak_current : '—'} />
        <Metric label="Longest streak" value={streaks ? streaks.streak_longest : '—'} />
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}
