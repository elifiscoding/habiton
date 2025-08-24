import React from 'react'

/**
 * 7-day mini strip
 * items: Array<{ date: 'YYYY-MM-DD', status: 'done'|'skipped'|'missed'|null }>
 */
export default function WeekDots({ items = [], size = 8, gap = 4 }) {
  const color = (s) =>
    s === 'done'    ? '#16a34a' : // green-600
    s === 'skipped' ? '#f59e0b' : // amber-500
    s === 'missed'  ? '#ef4444' : // red-500
                      '#e5e7eb'   // gray-200

  // short labels for 7 days, starting Monday
  const labels = ['M','T','W','T','F','S','S']

  return (
    <div className="flex flex-col items-center">
      {/* top row: labels */}
      <div className="flex text-[9px] text-gray-500" style={{ gap }}>
        {labels.map((l, i) => (
          <span key={i} className="w-[8px] text-center">{l}</span>
        ))}
      </div>
      {/* bottom row: colored dots */}
      <div className="flex" style={{ gap }}>
        {items.map((d, i) => (
          <div key={i} title={`${d.date} • ${d.status || 'no log'}`}>
            <svg width={size} height={size} aria-hidden="true">
              <circle cx={size/2} cy={size/2} r={size/2} fill={color(d.status)} />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
