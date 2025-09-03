import React, { useMemo, useState } from "react"

const frequencies = ["daily", "weekly", "monthly"]
const periods = ["daily", "weekly", "monthly"]

function CategorySelect({ categories, value, onChange }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="border rounded p-2"
    >
      <option value="">No category</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}

export default function AddHabit({ categories, onAdd }) {
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState(null)
  const [frequency, setFrequency] = useState("daily")
  const [goalPeriod, setGoalPeriod] = useState("monthly")
  const [goalTarget, setGoalTarget] = useState(20)

  const disabled = useMemo(() => title.trim().length === 0, [title])

  async function handleAdd() {
    if (disabled) return

    await onAdd({
      title: title.trim(),
      category_id: categoryId, // ✅ passes null if "No category"
      frequency,
      goal_period: goalPeriod,
      goal_target: Number(goalTarget) || 0,
    })

    // reset
    setTitle("")
    setCategoryId(null)
    setFrequency("daily")
    setGoalPeriod("monthly")
    setGoalTarget(20)
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Habit title"
        className="border rounded p-2"
      />

      <div className="flex gap-2 flex-wrap">
        <CategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="border rounded p-2"
        >
          {frequencies.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          value={goalPeriod}
          onChange={(e) => setGoalPeriod(e.target.value)}
          className="border rounded p-2"
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          value={goalTarget}
          onChange={(e) => setGoalTarget(e.target.value)}
          className="w-24 border rounded p-2"
          placeholder="Goal"
          title="Target count in the selected goal period"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={disabled}
        className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        Add Habit
      </button>
    </div>
  )
}
