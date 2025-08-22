import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const signInWithEmail = async (e) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (error) setError(error.message)
    else setSent(true)
  }

  const signOut = async () => supabase.auth.signOut()

  return (
    <div className="max-w-md mx-auto mt-16 card">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      {sent ? (
        <p>Magic link sent to <b>{email}</b>. Check your inbox.</p>
      ) : (
        <form onSubmit={signInWithEmail} className="space-y-3">
          <input className="input" type="email" placeholder="your@email.com"
                 value={email} onChange={e => setEmail(e.target.value)} required />
          <button className="btn" type="submit">Send magic link</button>
          {error && <p className="text-red-600">{error}</p>}
        </form>
      )}
      <p className="text-xs mt-4 text-gray-500">Tip: enable Email auth in Supabase → Authentication.</p>
    </div>
  )
}
