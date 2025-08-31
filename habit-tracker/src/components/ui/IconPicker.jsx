import React from "react"

const ICONS = ['✅','🏃‍♀️','📚','🧘‍♀️','💧','🍎','🛏️','🧹','💸','🖥️','📝','🧪','🕯️','🎧','🧠','🦷','☀️','🌙']

export default function IconPicker({ value, onChange }) {
  return (
    <div className="icon-picker">
      {ICONS.map(ic => (
        <button
          key={ic}
          type="button"
          className={`icon-picker-btn ${ic === value ? "icon-picker-btn-active" : ""}`}
          onClick={() => onChange(ic)}
          title={ic}
        >
          {ic}
        </button>
      ))}
    </div>
  )
}
