// src/App.jsx
import React from 'react'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--accent)]">Habiton</h1>
        </div>
      </header>

      {/* Main dashboard */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Dashboard />
      </main>
    </div>
  )
}
