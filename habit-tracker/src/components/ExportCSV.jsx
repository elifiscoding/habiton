import React from 'react'
import { supabase } from '../lib/supabase'

export default function ExportCSV() {
  const download = async () => {
    // Pull logs + habit titles for the signed-in user
    const { data, error } = await supabase
      .from('habit_logs')
      .select('log_date,status,note,habit_id,habits(title)')
      .order('log_date', { ascending: true })
    if (error) { alert(error.message); return }

    const rows = (data ?? []).map(r => ({
      date: r.log_date,
      habit_title: r.habits?.title ?? '',
      status: r.status,
      note: r.note ?? ''
    }))

    const header = ['date','habit_title','status','note']
    const csv = [
      header.join(','),
      ...rows.map(o => header.map(k => csvEscape(o[k])).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habit_logs_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return <button className="btn" onClick={download}>Export CSV</button>
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s
}
