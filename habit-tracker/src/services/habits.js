import { supabase } from "../lib/supabase";
import { toLocalYMD } from "../utils/dates"

// -------- Categories --------
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function upsertCategory({ id, name, color }) {
  const payload = id ? { id, name, color } : { name, color };
  const { data, error } = await supabase.from("categories").upsert(payload).select().single();
  if (error) throw error;
  return data;
}

// -------- Habits --------
export async function fetchHabits() {
  const { data, error } = await supabase
    .from("habits")
    .select(`
      id, title, is_active, frequency, goal_period, goal_target, category_id,
      categories:category_id ( id, name, color )
    `)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data?.map(h => ({
    ...h,
    category: h.categories ? { ...h.categories } : null
  }));
}

export async function createHabit({ title, category_id, frequency = "daily", goal_period = "monthly", goal_target = 20 }) {
  const { data, error } = await supabase
    .from("habits")
    .insert([{ title, category_id, frequency, goal_period, goal_target }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHabit(id, patch) {
  const { data, error } = await supabase.from("habits").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHabit(id) {
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw error;
}

// -------- Logs (mark / undo) --------
export async function fetchRecentLogs({ habitId, days = 7 }) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  const fromYMD = toLocalYMD(from);
  const toLocalYMDStr = toLocalYMD(today);

  const { data, error } = await supabase
    .from("habit_logs")
    .select("id, habit_id, log_date, is_done")
    .eq("habit_id", habitId)
    .gte("log_date", fromYMD)
    .lte("log_date", toLocalYMDStr)
    .order("log_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function markDone({ habitId, dateYMD = toLocalYMD() }) {
  // upsert: if exists, set is_done=true; if not, create row
  const { data, error } = await supabase
    .from("habit_logs")
    .upsert([{ habit_id: habitId, log_date: dateYMD, is_done: true }], { onConflict: "habit_id,log_date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function undoDone({ habitId, dateYMD = toLocalYMD() }) {
  // remove the log row (cleanest), or set is_done=false if you want to keep history
  const { error } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .eq("log_date", dateYMD);
  if (error) throw error;
  return true;
}
