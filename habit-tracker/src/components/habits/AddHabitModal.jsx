import React, { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import IconPicker from "../ui/IconPicker"
import { Button, Modal } from "../ui"

export default function AddHabitModal({ open, onClose, onAdded }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("🏷️")
  const [categoryId, setCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)

  // Load categories for dropdown
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
      if (!error && data) setCategories(data)
    })()
  }, [open])

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
      category_id: categoryId || null, // ✅ include category
    })
    setSaving(false)
    if (error) alert(error.message)
    else {
      // reset
      setTitle("")
      setDescription("")
      setIcon("🏷️")
      setCategoryId(null)
      onAdded?.()
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <h2 className="title">Add New Habit</h2>

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

      {/* Category Select */}
      <div className="my-2">
        <label className="subtle block mb-1">Category</label>
        <select
          className="input w-full"
          value={categoryId || ""}
          onChange={e => setCategoryId(e.target.value || null)}
        >
          <option value="">No category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="subtle block mb-1">Choose Icon</label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="success"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Modal>
  )
}
