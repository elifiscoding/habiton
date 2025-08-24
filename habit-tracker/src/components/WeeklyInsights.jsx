import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function WeeklyInsights({ habits }) {
  const [selected, setSelected] = useState(habits?.[0]?.id || '')
  const [rows, setRows] = useState([])

  useEffect(() => { if (habits?.length && !selected) setSelected(habits[0].id) }, [habits])
  useEffect(() => {
    if (!selected) return
    ;(async () => {
      const { data, error } = await supabase
        .from('v_weekly_insights')
        .select('*')
        .eq('habit_id', selected)
        .order('dow', { ascending: true })
      if (!error) setRows(data ?? [])
      else console.warn('weekly insights error', error)
    })()
  }, [selected])

  const data = useMemo(() => {
    const map = new Map(rows.map(r => [r.dow, r]))
    return Array.from({ length: 7 }).map((_, dow) => {
      const r = map.get(dow)
      return {
        name: DOW[dow],
        completion: r?.completion_pct ?? 0
      }
    })
  }, [rows])

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Weekly Insights</h2>
        <select className="select" value={selected} onChange={e=>setSelected(e.target.value)}>
          {habits.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </div>
      <div style={{width:'100%', height:280}}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="completion" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-gray-600">
        Tip: Aim to schedule this habit on the strongest days.
      </p>
    </div>
  )
}
