import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayLocal } from '../utils/dates'

export default function BulkMarkToday({ habits, onDone }) {
  const [status, setStatus] = useState('done')
  const [busy, setBusy] = useState(false)
  const today = todayLocal()

  const run = async () => {
    if (!habits.length) return
    setBusy(true)
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    const rows = habits.map(h => ({ user_id: uid, habit_id: h.id, log_date: today, status }))
    const { error } = await supabase.from('habit_logs').upsert(rows, { onConflict: 'habit_id,log_date' })
    setBusy(false)
    if (error) alert(error.message); else onDone?.()
  }

  return (
    <div className="flex items-center gap-2">
      <select className="select-sm w-auto" value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="done">done</option>
        <option value="skipped">skipped</option>
        <option value="missed">missed</option>
      </select>
      <button className="btn-sm" onClick={run} disabled={!habits.length || busy}>
        {busy ? '…' : `Mark all (${habits.length})`}
      </button>
    </div>
  )
}
