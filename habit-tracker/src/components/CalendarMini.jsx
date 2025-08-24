import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CalendarMini({ habitId }) {
  const [days, setDays] = useState([])

  useEffect(() => {
    (async () => {
      const today = new Date()
      const tz = today.getTimezoneOffset() * 60000
      const end = new Date(Date.now() - tz).toISOString().slice(0,10)
      const startD = new Date(today); startD.setDate(today.getDate() - 27)
      const start = new Date(startD - tz).toISOString().slice(0,10)

      const { data } = await supabase
        .from('v_daily_habit_calendar')
        .select('log_date,status')
        .eq('habit_id', habitId)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('log_date', { ascending: true })

      setDays(data ?? [])
    })()
  }, [habitId])

  const color = s => s==='done' ? 'bg-green-500' : s==='skipped' ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, i) => {
          const d = days[i]
          const c = color(d?.status ?? 'missed')
          return <div key={i} className={`h-3.5 w-3.5 rounded-sm ${c}`} title={`${d?.log_date ?? ''} • ${d?.status ?? 'missed'}`} />
        })}
      </div>
      <div className="flex items-center gap-3 text-[12px] text-gray-600">
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 bg-green-500 inline-block rounded-sm"></i>done</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 bg-yellow-400 inline-block rounded-sm"></i>skipped</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 bg-red-400 inline-block rounded-sm"></i>missed</span>
      </div>
    </div>
  )
}
