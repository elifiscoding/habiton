import React, { useEffect, useRef, useState } from "react"
import { supabase } from "../../lib/supabase"
import { Input, Button } from "../ui"
import { categoryCache } from "../../services/categoryCache"
import { CATEGORY_COLORS } from "../../utils/categoriesColors"

const EMOJIS = ["🏷️", "📚", "💪", "🧘", "💻", "🍎", "🌍", "💡", "🎨", "📖"]
const GOAL_FREQUENCIES = ["daily", "weekly", "monthly"]
const GOAL_AMOUNT_TYPES = ["times", "minutes", "hours"]

export default function HabitEditor({ habit, onSave, onCancel }) {
  const [title, setTitle] = useState(habit.title)
  const [icon, setIcon] = useState(habit.icon ?? "🏷️")
  const [goalFrequency, setGoalFrequency] = useState(habit.goal_frequency ?? "daily")
  const [goalAmount, setGoalAmount] = useState(habit.goal_amount ?? 1)
  const [goalAmountType, setGoalAmountType] = useState(habit.goal_amount_type ?? "times")
  const [categoryId, setCategoryId] = useState(habit.category_id ?? null)
  const [categories, setCategories] = useState([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#10b981")
  const [showNewCategory, setShowNewCategory] = useState(false)
  const containerRef = useRef(null)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    setTitle(habit.title)
    setIcon(habit.icon ?? "🏷️")
    setGoalFrequency(habit.goal_frequency ?? "daily")
    setGoalAmount(habit.goal_amount ?? 1)
    setGoalAmountType(habit.goal_amount_type ?? "times")
    setCategoryId(habit.category_id ?? null)
  }, [habit])

  const loadCategories = async () => {
    try {
      const cats = await categoryCache.getCategories()
      
      // Deduplicate categories by ID to prevent duplicate keys
      const uniqueCats = cats.filter((cat, index, self) => 
        index === self.findIndex(c => c.id === cat.id)
      )
      
      setCategories(uniqueCats)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const saveEdit = async () => {
    const t = title.trim()
    if (!t) return cancelEdit()
    
    const changes = {
      title: t,
      icon,
      goal_frequency: goalFrequency,
      goal_amount: goalAmount,
      goal_amount_type: goalAmountType,
      category_id: categoryId
    }
    
    onSave(changes)
    
    const { error } = await supabase
      .from("habits")
      .update(changes)
      .eq("id", habit.id)
    if (error) alert(error.message)
  }

  const cancelEdit = () => {
    setTitle(habit.title)
    setIcon(habit.icon ?? "🏷️")
    setGoalFrequency(habit.goal_frequency ?? "daily")
    setGoalAmount(habit.goal_amount ?? 1)
    setGoalAmountType(habit.goal_amount_type ?? "times")
    setCategoryId(habit.category_id ?? null)
    onCancel()
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return

    // Check if category with same name already exists
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase()
    )
    
    if (existingCategory) {
      // Use existing category instead of creating a new one
      setCategoryId(existingCategory.id)
      setNewCategoryName("")
      setShowNewCategory(false)
      return
    }

    try {
      const newCategory = await categoryCache.createCategory(name, selectedColor)
      setCategories(prev => [...prev, newCategory])
      setCategoryId(newCategory.id)
      setNewCategoryName("")
      setShowNewCategory(false)
    } catch (error) {
      // If it's a duplicate key error, try to find and use the existing category
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        try {
          // Refresh categories and find the existing one
          const refreshedCategories = await categoryCache.getCategories()
          const existingCategory = refreshedCategories.find(cat => 
            cat.name.toLowerCase() === name.toLowerCase()
          )
          
          if (existingCategory) {
            setCategories(refreshedCategories)
            setCategoryId(existingCategory.id)
            setNewCategoryName("")
            setShowNewCategory(false)
            return
          }
        } catch (refreshError) {
          console.error('Failed to refresh categories:', refreshError)
        }
      }
      
      alert('Failed to create category: ' + error.message)
    }
  }

  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        saveEdit()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  })

  const handleKey = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Emoji Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Icon
        </label>
        <select
          value={icon}
          onChange={e => setIcon(e.target.value)}
          className="w-full border rounded px-3 py-2 text-lg cursor-pointer bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {EMOJIS.map(e => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Name
        </label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
          placeholder="Enter habit name"
        />
      </div>

      {/* Goal Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Goal Frequency
        </label>
        <select
          value={goalFrequency}
          onChange={e => setGoalFrequency(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {GOAL_FREQUENCIES.map(freq => (
            <option key={freq} value={freq}>
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Goal Amount and Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <Input
            type="number"
            min="1"
            value={goalAmount}
            onChange={e => setGoalAmount(parseInt(e.target.value) || 1)}
            onKeyDown={handleKey}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            value={goalAmountType}
            onChange={e => setGoalAmountType(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GOAL_AMOUNT_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <div className="space-y-2">
          <select
            value={categoryId || ""}
            onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No category</option>
            {categories.map((cat, index) => (
              <option key={`${cat.id}-${index}`} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          
          {!showNewCategory ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewCategory(true)}
              className="w-full"
            >
              + Add New Category
            </Button>
          ) : (
            <div className="space-y-2 p-3 border rounded bg-gray-50 dark:bg-gray-700">
              <Input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory()
                  if (e.key === 'Escape') setShowNewCategory(false)
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Color:</span>
                <div className="flex gap-1">
                  {CATEGORY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCategory(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          onClick={saveEdit}
          className="flex-1"
        >
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={cancelEdit}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
