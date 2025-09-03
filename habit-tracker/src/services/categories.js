// src/services/categoryService.js
import { supabase } from "../lib/supabase"

/**
 * Get categories of current user
 */
export async function getCategories() {
  const { data: user } = await supabase.auth.getUser()
  const uid = user?.user?.id
  if (!uid) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data
}

/**
 * Create a new category
 */
export async function createCategory(name) {
  const { data: user } = await supabase.auth.getUser()
  const uid = user?.user?.id
  if (!uid) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name: name.trim(), user_id: uid }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing category
 */
export async function updateCategory(id, changes) {
  const { data: user } = await supabase.auth.getUser()
  const uid = user?.user?.id
  if (!uid) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("categories")
    .update({ ...changes })
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a category
 * (habits linked to it will auto set category_id = null via FK rule)
 */
export async function deleteCategory(id) {
  const { data: user } = await supabase.auth.getUser()
  const uid = user?.user?.id
  if (!uid) throw new Error("User not authenticated")

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)

  if (error) throw error
  return true
}

export async function getCategoryHabitCounts() {
  const { data: user } = await supabase.auth.getUser()
  const uid = user?.user?.id
  if (!uid) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("v_category_habit_counts")
    .select("*")
    .eq("user_id", uid)

  if (error) throw error
  return data
}
