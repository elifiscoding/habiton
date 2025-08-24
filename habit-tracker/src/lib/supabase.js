import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON,
  { auth: { persistSession: true, autoRefreshToken: true } }
)


/**
 * Calls the SQL function `take_daily_snapshot()` (created earlier in SQL).
 * Safe to call after you log for the day; RLS uses auth.uid().
 */
export async function takeDailySnapshot() {
  const { error } = await supabase.rpc('take_daily_snapshot')
  if (error) throw error
}

/** Helper if you ever need the current uid in components */
export async function getUid() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}