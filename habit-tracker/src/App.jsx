import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./components/pages/Dashboard";
import Categories from "./components/pages/Categories";
import Analytics from "./components/pages/Analytics";
import Sidebar from "./components/layout/Sidebar";
import Login from "./components/pages/Login";
import { supabase } from "./lib/supabase";

function AppShell() {
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const onLoginPage = location.pathname === "/login"

  if (!ready) {
    return <div className="app-bg min-h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <div className="flex app-bg">
      {!onLoginPage && session && <Sidebar />}
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/habits" replace /> : <Login />} />
          <Route path="/" element={<Navigate to="/habits" replace />} />
          <Route path="/habits" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/categories" element={session ? <Categories /> : <Navigate to="/login" replace />} />
          <Route path="/analytics" element={session ? <Analytics /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
