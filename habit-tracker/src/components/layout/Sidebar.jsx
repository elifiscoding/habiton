import React, { useEffect, useRef, useState } from "react"
import { NavLink } from "react-router-dom"

export default function Sidebar() {
  const MIN_WIDTH = 160
  const MAX_WIDTH = 420
  const STORAGE_KEY = "sidebar_width_px"
  const DEFAULT_WIDTH = 192

  const containerRef = useRef(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const [dragging, setDragging] = useState(false)

  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? parseInt(stored, 10) : NaN
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, MIN_WIDTH), MAX_WIDTH)
      : DEFAULT_WIDTH
  })

  // persist width
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(width))
    }
  }, [width])

  // Add/remove global listeners while dragging
  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e) => {
      // Compute next width
      const delta = e.clientX - startXRef.current
      const next = Math.min(Math.max(startWidthRef.current + delta, MIN_WIDTH), MAX_WIDTH)
      setWidth(next)
      e.preventDefault()
    }

    const handleMouseUp = () => {
      setDragging(false)
    }

    // Apply page-level styles while dragging
    const prevUserSelect = document.body.style.userSelect
    const prevCursor = document.body.style.cursor
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = prevUserSelect
      document.body.style.cursor = prevCursor
    }
  }, [dragging])

  const onDragStart = (e) => {
    if (!containerRef.current) return
    startXRef.current = e.clientX
    // Use the rendered width at drag start for better accuracy
    startWidthRef.current = containerRef.current.getBoundingClientRect().width
    setDragging(true)
    e.preventDefault()
  }

  const onDoubleClickHandle = () => {
    setWidth(DEFAULT_WIDTH)
  }

  return (
    <div ref={containerRef} className="sidebar relative" style={{ width }}>
      <div className="sidebar-title">Habiton</div>

      <NavLink
        to="/habits"
        className={({ isActive }) =>
          isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
        }
      >
        Habits
      </NavLink>

      <NavLink
        to="/categories"
        className={({ isActive }) =>
          isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
        }
      >
        Categories
      </NavLink>

      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
        }
      >
        Analytics
      </NavLink>

      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize. Double-click to reset."
        onMouseDown={onDragStart}
        onDoubleClick={onDoubleClickHandle}
        className="
          absolute top-0 right-0 h-full w-1
          cursor-col-resize bg-transparent
          hover:bg-gray-200 dark:hover:bg-gray-700
          z-10
        "
      />
    </div>
  )
}
