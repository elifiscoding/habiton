import React from 'react'

export default function CompletionRing({
  pct = 0, count = 0, size = 28, stroke = 4, duration = 700, animate = true, title = 'last 30 days',
}) {
  const target = Math.max(0, Math.min(100, Number(pct) || 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [p, setP] = React.useState(animate ? 0 : target)

  React.useEffect(() => {
    if (!animate) { setP(target); return }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setP(target); return }
    let rafId; const start = performance.now()
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setP(target * easeOutCubic(t))
      if (t < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, animate, duration])

  const hue = (p / 100) * 120         // 0=red → 120=green
  const color = `hsl(${hue}, 75%, 45%)`
  const offset = c * (1 - p / 100)

  return (
    <div
      className="relative"
      title={`${Math.round(p)}% • ${count}/30 days (${title})`}
      aria-label={`Completion ${Math.round(p)} percent over 30 days`}
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 200ms linear' }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="text-[8px] font-medium text-gray-700 leading-none">{Math.round(p)}%</span>
      </div>
    </div>
  )
}
