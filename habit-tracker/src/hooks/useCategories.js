// src/hooks/useCategories.js
import { useEffect, useState, useCallback } from "react"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHabitCounts,   // 👈 import service fn
} from "../services/categories"
import { categoryCache } from "../services/categoryCache"

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [categoryCounts, setCategoryCounts] = useState([]) // 👈 new state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // load categories and counts in parallel
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Load both in parallel for better performance
      const [categoriesData, countsData] = await Promise.all([
        categoryCache.getCategories(),
        getCategoryHabitCounts()
      ])
      
      setCategories(categoriesData)
      setCategoryCounts(countsData)
    } catch (err) {
      setError(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addCategory = async (name, color = "#e5e7eb") => {
    const cat = await categoryCache.createCategory(name, color)
    setCategories((prev) => [...prev, cat])
    // refresh counts
    const counts = await getCategoryHabitCounts()
    setCategoryCounts(counts)
    return cat
  }

  const editCategory = async (id, changes) => {
    const cat = await updateCategory(id, changes)
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cat } : c))
    )
    // Invalidate cache and refresh counts
    categoryCache.invalidate()
    const counts = await getCategoryHabitCounts()
    setCategoryCounts(counts)
    return cat
  }

  const removeCategory = async (id) => {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    // Invalidate cache and refresh counts
    categoryCache.invalidate()
    const counts = await getCategoryHabitCounts()
    setCategoryCounts(counts)
    return true
  }

  return {
    categories,
    categoryCounts, // 👈 available to components
    loading,
    error,
    reload: load,
    addCategory,
    editCategory,
    removeCategory,
  }
}
