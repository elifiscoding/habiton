// src/components/pages/CategoriesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { hierarchy, treemap as d3treemap } from "d3-hierarchy"
import { useCategories } from "../../hooks/useCategories"
import { Card, Input, Button } from "../../components/ui"

export default function CategoriesPage() {
  // Data from hook (assumes categoryCounts contains: { category_id, name, habit_count })
  const { categoryCounts, loading, error, addCategory } = useCategories()

  // Local UI state
  const [newName, setNewName] = useState("")
  const containerRef = useRef(null)
  const [layout, setLayout] = useState([])

  // ---- Compute weights for treemap (STABLE: not behind early return) ----
  // - Non-zero categories: weight = habit_count
  // - Zero categories: small visible weight so each ≈ 4% of total area
  const dataForTreemap = useMemo(() => {
    const totalHabits = (categoryCounts || []).reduce(
      (s, c) => s + (c.habit_count || 0),
      0
    )
    const zeroWeight = Math.max(1, Math.round((totalHabits || 1) * 0.04))

    return (categoryCounts || []).map(c => ({
      id: c.category_id ?? c.id,
      name: c.name,
      rawCount: c.habit_count || 0,
      weight: (c.habit_count || 0) > 0 ? c.habit_count : zeroWeight,
    }))
  }, [categoryCounts])

  // ---- Compute treemap layout whenever data/size changes ----
  const computeLayout = () => {
    if (!containerRef.current || dataForTreemap.length === 0) {
      setLayout([])
      return
    }
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const root = hierarchy({ children: dataForTreemap })
      .sum(d => d.weight)
      .sort((a, b) => b.value - a.value)

    d3treemap().size([width, height]).padding(2)(root)

    const leaves = root.leaves().map(node => ({
      id: node.data.id,
      name: node.data.name,
      count: node.data.rawCount,
      x0: node.x0,
      x1: node.x1,
      y0: node.y0,
      y1: node.y1,
    }))
    setLayout(leaves)
  }

  // Initial / data-driven computation
  useEffect(() => {
    computeLayout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataForTreemap])

  // Resize-driven computation
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => computeLayout())
    ro.observe(containerRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current])

  // Add category handler
  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    await addCategory(name)
    setNewName("")
  }

  // ---- Render (no early returns; conditionals inside JSX) ----
  return (
    <div className="container-slim py-4 space-y-4">
      <h1 className="text-xl font-bold">Categories Overview</h1>

      <Card className="relative h-[500px]">
        {error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <div ref={containerRef} className="w-full h-full">
            {loading ? (
              <div className="p-4">Loading categories…</div>
            ) : (
              <svg width="100%" height="100%">
                {layout.map(node => {
                  const w = node.x1 - node.x0
                  const h = node.y1 - node.y0
                  const bigEnoughForText = w > 70 && h > 38
                  const fill = node.count > 0 ? "#10b981" : "#9ca3af" // green vs gray

                  return (
                    <g key={node.id}>
                      <rect
                        x={node.x0}
                        y={node.y0}
                        width={w}
                        height={h}
                        fill={fill}
                        stroke="#fff"
                        strokeWidth={2}
                        rx={6}
                        ry={6}
                      />
                      {bigEnoughForText && (
                        <>
                          <text
                            x={node.x0 + w / 2}
                            y={node.y0 + h / 2 - 4}
                            textAnchor="middle"
                            fill="white"
                            fontSize={12}
                            fontWeight="bold"
                          >
                            {node.name}
                          </text>
                          <text
                            x={node.x0 + w / 2}
                            y={node.y0 + h / 2 + 12}
                            textAnchor="middle"
                            fill="white"
                            fontSize={10}
                          >
                            {node.count} habits
                          </text>
                        </>
                      )}
                    </g>
                  )
                })}
              </svg>
            )}
          </div>
        )}
      </Card>

      {/* Add new category (outside visualization) */}
      <Card className="p-4 flex gap-2 items-center">
        <Input
          size="sm"
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleAdd()
            if (e.key === "Escape") setNewName("")
          }}
        />
        <Button size="sm" variant="primary" onClick={handleAdd}>
          ➕ Add
        </Button>
      </Card>
    </div>
  )
}
