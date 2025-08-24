import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function QuickAdd({ onAdded }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const EMOJI_RE = /^\p{Extended_Pictographic}/u
    function splitEmojiTitle(s) {
      const m = EMOJI_RE.exec(s.trim())
      if (!m) return { icon: '🏷️', title: s.trim() }
      const icon = m[0]
      const title = s.trim().slice(icon.length).trim() || 'Untitled'
      return { icon, title }
    }


  const submit = async (e) => {
    e?.preventDefault?.()
    if (!text.trim()) return
    setBusy(true)
    const { icon, title } = splitEmojiTitle(text)
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('habits').insert({
      user_id: u?.user?.id, title, icon, is_active: true, description: ''
    })
    setBusy(false)
    if (error) alert(error.message); else { setText(''); onAdded?.() }
  }


  return (
    <form onSubmit={submit} className="flex items-center gap-2 min-w-[260px]">
      <input className="input-sm flex-1" placeholder="Add a habit… (Enter)"
             value={text} onChange={e=>setText(e.target.value)} />
      <button className="btn-sm" disabled={busy}>{busy?'…':'Add'}</button>
    </form>
  )
}
