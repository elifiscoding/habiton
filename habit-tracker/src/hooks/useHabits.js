import { useEffect, useMemo, useState } from "react";
import {
  fetchHabits, createHabit, updateHabit, deleteHabit,
  fetchRecentLogs, markDone, undoDone, fetchCategories
} from "../services/habits";
import { todayLocal, toLocalYMD } from "../utils/dates"

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logsByHabit, setLogsByHabit] = useState({}); // habitId -> { 'YYYY-MM-DD': true }

  const today = toLocalYMD();

  async function load() {
    const [h, c] = await Promise.all([fetchHabits(), fetchCategories()]);
    setHabits(h);
    setCategories(c);

    // warm recent-7 logs
    const logPromises = h.map(async (hb) => {
      const list = await fetchRecentLogs({ habitId: hb.id, days: 7 });
      const dict = {};
      list.forEach(l => { if (l.is_done) dict[l.log_date] = true; });
      return { id: hb.id, dict };
    });
    const all = await Promise.all(logPromises);
    const merged = {};
    all.forEach(({ id, dict }) => merged[id] = dict);
    setLogsByHabit(merged);
  }

  useEffect(() => { load(); }, []);

  // CRUD
  async function addHabit(payload) {
    const created = await createHabit(payload);
    setHabits(prev => [...prev, created]);
    setLogsByHabit(prev => ({ ...prev, [created.id]: {} }));
  }

  async function patchHabit(id, patch) {
    const updated = await updateHabit(id, patch);
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updated } : h));
  }

  async function removeHabit(id) {
    await deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogsByHabit(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  // Mark / Undo with optimistic update
  async function markToday(habitId, dateYMD = today) {
    // skip if habit paused
    const hb = habits.find(h => h.id === habitId);
    if (!hb?.is_active) return;

    setLogsByHabit(prev => ({
      ...prev,
      [habitId]: { ...(prev[habitId] || {}), [dateYMD]: true }
    }));
    try {
      await markDone({ habitId, dateYMD });
    } catch (e) {
      // rollback
      setLogsByHabit(prev => {
        const copy = { ...(prev[habitId] || {}) };
        delete copy[dateYMD];
        return { ...prev, [habitId]: copy };
      });
      throw e;
    }
  }

  async function undoToday(habitId, dateYMD = today) {
    // optimistic
    setLogsByHabit(prev => {
      const copy = { ...(prev[habitId] || {}) };
      delete copy[dateYMD];
      return { ...prev, [habitId]: copy };
    });
    try {
      await undoDone({ habitId, dateYMD });
    } catch (e) {
      // rollback (set back to true)
      setLogsByHabit(prev => ({
        ...prev,
        [habitId]: { ...(prev[habitId] || {}), [dateYMD]: true }
      }));
      throw e;
    }
  }

  // Derived stats for UI (recent-7 completion %, quick analytics)
  const recentPercents = useMemo(() => {
    const result = {};
    for (const h of habits) {
      const dict = logsByHabit[h.id] || {};
      const doneCount = Object.keys(dict).length;
      result[h.id] = Math.round((doneCount / 7) * 100);
    }
    return result;
  }, [habits, logsByHabit]);

  return {
    today,
    habits, categories, logsByHabit, recentPercents,
    addHabit, patchHabit, removeHabit,
    markToday, undoToday
  };
}
