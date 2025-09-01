import React, { useState } from "react"
import { supabase } from "../../lib/supabase"
import IconPicker from "../ui/IconPicker"
import { Button, Modal } from "../ui"


export default function AddHabitModal({ open, onClose, onAdded }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("🏷️")
  const [saving, setSaving] = useState(false)

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

      <div>
        <label className="subtle block mb-1">Choose Icon</label>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      <div className="flex justify-end gap-2">
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
