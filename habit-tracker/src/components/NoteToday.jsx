import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayLocal, toLocalYMD } from "../utils/dates"

export default function NoteToday({ habitId, defaultStatus='done', onSaved }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const today = todayLocal()

  const save = async () => {
    setBusy(true)
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    const { error } = await supabase.from('habit_logs').upsert({
      user_id: uid, habit_id: habitId, log_date: today, status: defaultStatus, note
    }, { onConflict: 'habit_id,log_date' })
    setBusy(false)
    if (error) alert(error.message); else { setOpen(false); setNote(''); onSaved?.() }
  }

  return (
    <div className="relative">
      <button className="btn-sm" onClick={()=>setOpen(v=>!v)}>Note</button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-60 p-2 rounded-md border bg-white shadow">
          <textarea className="input-sm !h-20" value={note} onChange={e=>setNote(e.target.value)}
                    placeholder="How did it go?" />
          <div className="flex gap-2 mt-2">
            <button className="btn-sm" onClick={save} disabled={busy}>{busy?'…':'Save'}</button>
            <button className="btn-sm" onClick={()=>{setOpen(false); setNote('')}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
