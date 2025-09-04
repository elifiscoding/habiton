// src/components/pages/CategoriesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { hierarchy, treemap as d3treemap } from "d3-hierarchy"
import { useCategories } from "../../hooks/useCategories"
import { Card, Input, Button } from "../../components/ui"
import { CATEGORY_COLORS } from "../../utils/categoriesColors"

export default function CategoriesPage() {
  // Data from hook (assumes categoryCounts contains: { category_id, name, habit_count })
  const { categories = [], categoryCounts, loading, error, addCategory, editCategory, reload } = useCategories()

  // Local UI state
  const [newName, setNewName] = useState("")
  const containerRef = useRef(null)
  const [layout, setLayout] = useState([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("name") // name | count

  // ---- Compute weights for treemap (STABLE: not behind early return) ----
  // - Non-zero categories: weight = habit_count
  // - Zero categories: share an exact small pool percentage of total area using fractional weights
  const dataForTreemap = useMemo(() => {
    let list = categoryCounts || []
    const s = search.trim().toLowerCase()
    if (s) list = list.filter(c => (c.name || "").toLowerCase().includes(s))
    if (sort === "name") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    else if (sort === "count") list = [...list].sort((a, b) => (b.habit_count || 0) - (a.habit_count || 0))

    const nonZero = list.filter(c => (c.habit_count || 0) > 0)
    const zero = list.filter(c => (c.habit_count || 0) === 0)

    const totalNonZero = nonZero.reduce((s, c) => s + (c.habit_count || 0), 0)
    const zeroCount = zero.length

    // Fraction of the overall area to allocate to zero-count categories
    const POOL_PERCENT = 0.08 // 8%

    let perZeroWeight = 0
    if (zeroCount > 0) {
      // Target zero pool sum so that zeros occupy POOL_PERCENT of total area
      // If S = totalNonZero, T = S + zeroSum, want zeroSum/T = p ⇒ zeroSum = p*S/(1-p)
      const zeroSum = (totalNonZero * POOL_PERCENT) / Math.max(1e-6, (1 - POOL_PERCENT))
      perZeroWeight = zeroSum / zeroCount
    }

    // Map existing categories to colors by id
    const colorById = new Map((categories || []).map(c => [c.id, c.color]))

    return list.map(c => {
      const id = c.category_id ?? c.id
      return {
        id,
        name: c.name,
        color: colorById.get(id) || "#9ca3af",
        rawCount: c.habit_count || 0,
        weight: (c.habit_count || 0) > 0 ? c.habit_count : perZeroWeight,
      }
    })
  }, [categoryCounts, categories, search, sort])

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
      color: node.data.color,
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
    await reload()
  }

  // ---- Render (no early returns; conditionals inside JSX) ----
  return (
    <div className="container-slim py-4 space-y-4">
      <h1 className="text-xl font-bold">Categories Overview</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Input size="sm" placeholder="Filter categories" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <select className="input-sm max-w-[180px]" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="name">Sort by name</option>
          <option value="count">Sort by habit count</option>
        </select>
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: "#10b981" }} /> has habits</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: "#9ca3af" }} /> 0 habits (small tile)</span>
      </div>

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
                  const fill = node.color || "#9ca3af"

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
                      {bigEnoughForText ? (
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
                      ) : (
                        <title>{node.name} — {node.count} habits</title>
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

      {/* Manage colors */}
      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">Edit category colors</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-start gap-2 border rounded p-2 dark:border-gray-700">
              <div className="truncate flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{cat.name}</div>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[260px] overflow-hidden">
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="h-5 w-5 rounded border"
                    style={{ background: color, borderColor: "#e5e7eb", outline: cat.color === color ? "2px solid #111827" : "none" }}
                    title={color}
                    onClick={async () => {
                      if (cat.color === color) return
                      await editCategory(cat.id, { color })
                      await reload()
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
