import React from "react"

/**
 * items: Array<{date:'YYYY-MM-DD', status:'done'|'skipped'|'missed'|null}>
 */
export default function WeekDots({ items = [], size = 8, gap = 4 }) {
  const labels = ["M","T","W","T","F","S","S"]
  return (
    <div className="flex flex-col items-center">
      <div className="flex text-[9px] text-gray-500 dark:text-gray-400" style={{ gap }}>
        {labels.map((l, i) => <span key={i} className="w-[8px] text-center">{l}</span>)}
      </div>
      <div className="flex" style={{ gap }}>
        {items.map((d, i) => (
          <div key={i} title={`${d.date} • ${d.status || "no log"}`}>
            <svg width={size} height={size} aria-hidden="true">
              <circle
                cx={size/2} cy={size/2} r={size/2}
                className={`week-dot ${d.status ? `week-dot-${d.status}` : "week-dot-none"}`}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
