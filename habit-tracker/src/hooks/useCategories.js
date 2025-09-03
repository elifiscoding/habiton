// src/hooks/useCategories.js
import { useEffect, useState, useCallback } from "react"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHabitCounts,   // 👈 import service fn
} from "../services/categories"

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [categoryCounts, setCategoryCounts] = useState([]) // 👈 new state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // load plain categories
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCategories(data)

      const counts = await getCategoryHabitCounts()
      setCategoryCounts(counts)
    } catch (err) {
      setError(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addCategory = async (name) => {
    const cat = await createCategory(name)
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
    const counts = await getCategoryHabitCounts()
    setCategoryCounts(counts)
    return cat
  }

  const removeCategory = async (id) => {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
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
