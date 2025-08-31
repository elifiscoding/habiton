import React, { useEffect, useRef, useState } from "react"
import { supabase } from "../../lib/supabase"
import { Input } from "../ui"

const EMOJIS = ["🏷️", "📚", "💪", "🧘", "💻", "🍎", "🌍", "💡", "🎨", "📖"]

export default function HabitEditor({ habit, onSave, onCancel }) {
  const [title, setTitle] = useState(habit.title)
  const [description, setDescription] = useState(habit.description ?? "")
  const [icon, setIcon] = useState(habit.icon ?? "🏷️")
  const containerRef = useRef(null)

  useEffect(() => {
    setTitle(habit.title)
    setDescription(habit.description ?? "")
    setIcon(habit.icon ?? "🏷️")
  }, [habit])

  const saveEdit = async () => {
    const t = title.trim()
    if (!t) return cancelEdit()
    onSave({ title: t, description: description.trim(), icon })
    const { error } = await supabase
      .from("habits")
      .update({ title: t, description: description.trim(), icon })
      .eq("id", habit.id)
    if (error) alert(error.message)
  }

  const cancelEdit = () => {
    setTitle(habit.title)
    setDescription(habit.description ?? "")
    setIcon(habit.icon ?? "🏷️")
    onCancel()
  }

  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        saveEdit()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  })

  const handleKey = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <div ref={containerRef} className="space-y-1">
      <div className="flex items-center gap-2">
        {/* Simple emoji picker */}
        <select
          value={icon}
          onChange={e => setIcon(e.target.value)}
          className="
            border rounded px-2 py-1 text-lg cursor-pointer
            bg-white text-gray-900
            dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          {EMOJIS.map(e => (
            <option
              key={e}
              value={e}
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {e}
            </option>
          ))}
        </select>


        <Input
          size="sm"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
        />
      </div>
      <Input
        size="sm"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
        onKeyDown={handleKey}
      />
    </div>
  )
}
