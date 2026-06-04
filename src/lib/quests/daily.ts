import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyQuest, QuestTemplate } from "@/lib/types";
import { nycDateString } from "@/lib/time";
import { spinQuest } from "./spin";
import { getTemplate } from "./templates";
import { POINTS } from "@/lib/gamification/points";
import {
  canStartNewQuest,
  completedCount,
  isFreeReroll,
  nextSlot,
  questsRemaining,
  rerollsUsedToday,
  FREE_REROLLS_PER_DAY,
} from "./day-rules";

export interface DayState {
  /** Active (incomplete) quest + its template, or null when none is in progress. */
  dailyQuest: DailyQuest | null;
  template: QuestTemplate | null;
  created: boolean;
  completedToday: number;
  questsRemaining: number;
  freeRerollAvailable: boolean;
  /** True when all 3 quests for the day are done. */
  allDone: boolean;
}

async function fetchDayRows(
  client: SupabaseClient,
  userId: string,
  questDate: string,
): Promise<DailyQuest[]> {
  const { data, error } = await client
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_date", questDate)
    .order("slot", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DailyQuest[];
}

function template(row: DailyQuest): QuestTemplate {
  const t = getTemplate(row.quest_template_id);
  if (!t) throw new Error(`Unknown quest template: ${row.quest_template_id}`);
  return t;
}

function stateFrom(rows: DailyQuest[], active: DailyQuest | null, created: boolean): DayState {
  return {
    dailyQuest: active,
    template: active ? template(active) : null,
    created,
    completedToday: completedCount(rows),
    questsRemaining: questsRemaining(rows),
    freeRerollAvailable: isFreeReroll(rows),
    allDone: active == null && !canStartNewQuest(rows),
  };
}

/**
 * Return today's active quest, or create the next one on spin. Hands back the
 * existing in-progress quest if there is one; otherwise creates the next slot
 * (up to 3/day). When all 3 are done, returns allDone with no quest.
 */
export async function getActiveOrNextQuest(
  client: SupabaseClient,
  userId: string,
  isAdult: boolean,
  now: Date = new Date(),
): Promise<DayState> {
  const questDate = nycDateString(now);
  const rows = await fetchDayRows(client, userId, questDate);

  const active = rows.find((r) => !r.completed) ?? null;
  if (active) return stateFrom(rows, active, false);

  if (!canStartNewQuest(rows)) return stateFrom(rows, null, false); // all 3 done

  const picked = spinQuest(isAdult);
  if (!picked) throw new Error("No eligible quest templates");

  const { data, error } = await client
    .from("daily_quests")
    .insert({
      user_id: userId,
      quest_template_id: picked.id,
      quest_date: questDate,
      slot: nextSlot(rows),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Race: another request created this slot — re-read and return active.
      const refreshed = await fetchDayRows(client, userId, questDate);
      const a = refreshed.find((r) => !r.completed) ?? null;
      return stateFrom(refreshed, a, false);
    }
    throw error;
  }

  const newRows = [...rows, data as DailyQuest];
  return stateFrom(newRows, data as DailyQuest, true);
}

export type RerollResult =
  | { ok: true; state: DayState; pointsRemaining: number; wasFree: boolean }
  | { ok: false; error: "insufficient_points" | "no_active_quest" };

/**
 * Re-roll the active quest. The first re-roll each day is free; subsequent ones
 * cost POINTS.rerollCost.
 */
export async function rerollActiveQuest(
  client: SupabaseClient,
  userId: string,
  isAdult: boolean,
  currentPoints: number,
  now: Date = new Date(),
): Promise<RerollResult> {
  const questDate = nycDateString(now);
  const rows = await fetchDayRows(client, userId, questDate);

  const active = rows.find((r) => !r.completed) ?? null;
  if (!active) return { ok: false, error: "no_active_quest" };

  const free = isFreeReroll(rows);
  if (!free && currentPoints < POINTS.rerollCost) {
    return { ok: false, error: "insufficient_points" };
  }

  const picked = spinQuest(isAdult);
  if (!picked) throw new Error("No eligible quest templates");

  const pointsRemaining = free ? currentPoints : currentPoints - POINTS.rerollCost;

  const { data, error } = await client
    .from("daily_quests")
    .update({ quest_template_id: picked.id, spins_used: active.spins_used + 1 })
    .eq("id", active.id)
    .select("*")
    .single();
  if (error) throw error;

  if (!free) {
    const { error: pErr } = await client
      .from("profiles")
      .update({ points: pointsRemaining })
      .eq("id", userId);
    if (pErr) throw pErr;
  }

  // Recompute state with the updated active row.
  const updatedRows = rows.map((r) => (r.id === active.id ? (data as DailyQuest) : r));
  const freeNowUsed = rerollsUsedToday(updatedRows) >= FREE_REROLLS_PER_DAY;
  const state = stateFrom(updatedRows, data as DailyQuest, false);
  state.freeRerollAvailable = !freeNowUsed;

  return { ok: true, state, pointsRemaining, wasFree: free };
}
