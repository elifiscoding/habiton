import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { setRememberMe, getRememberMe } from "../../lib/authStorage"
import { Button, Input, Card } from "../ui"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(getRememberMe())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setRememberMe(remember)
    navigate("/habits", { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-bg">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <h1 className="text-xl font-semibold mb-4">Sign in</h1>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="#" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
        <div className="text-center text-xs text-gray-500 mt-3">
          Or use magic link via <code>/components/Auth.jsx</code>
        </div>
      </div>
    </div>
  )
}
