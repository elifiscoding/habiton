import React, { useState } from "react"
import { supabase } from "../lib/supabase"

export default function AddHabitModal({ open, onClose, onAdded }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("🏷️")
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    const { error } = await supabase.from("habits").insert({
      user_id: uid,
      title: title.trim(),
      description: description.trim(),
      icon,
      is_active: true,
    })
    setSaving(false)
    if (error) alert(error.message)
    else {
      setTitle("")
      setDescription("")
      setIcon("🏷️")
      onAdded?.()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add New Habit</h2>

        <input
          className="input w-full"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="input w-full"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input
          className="input w-full"
          placeholder="Icon (emoji)"
          value={icon}
          onChange={e => setIcon(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button className="btn-sm" onClick={onClose}>Cancel</button>
          <button
            className={`btn-sm ${saving ? "bg-gray-300" : "bg-green-500 text-white hover:bg-green-600"}`}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
