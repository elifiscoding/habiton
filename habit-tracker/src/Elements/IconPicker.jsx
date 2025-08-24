import React from 'react'

const ICONS = ['✅','🏃‍♀️','📚','🧘‍♀️','💧','🍎','🛏️','🧹','💸','🖥️','📝','🧪','🕯️','🎧','🧠','🦷','☀️','🌙']

export default function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ICONS.map(ic => (
        <button
          key={ic}
          type="button"
          className={`px-2 py-1 text-sm rounded border ${ic===value ? 'bg-gray-200 border-gray-400' : 'hover:bg-gray-50 border-gray-300'}`}
          onClick={() => onChange(ic)}
          title={ic}
        >
          {ic}
        </button>
      ))}
    </div>
  )
}
