import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyQuest, QuestTemplate } from "@/lib/types";
import { nycDateString } from "@/lib/time";
import { spinQuest } from "./spin";
import { getTemplate } from "./templates";
import { POINTS } from "@/lib/gamification/points";

export interface DailyQuestResult {
  dailyQuest: DailyQuest;
  template: QuestTemplate;
  created: boolean;
}

function withTemplate(row: DailyQuest, created: boolean): DailyQuestResult {
  const template = getTemplate(row.quest_template_id);
  if (!template) throw new Error(`Unknown quest template: ${row.quest_template_id}`);
  return { dailyQuest: row, template, created };
}

async function fetchToday(
  client: SupabaseClient,
  userId: string,
  questDate: string,
): Promise<DailyQuest | null> {
  const { data, error } = await client
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_date", questDate)
    .maybeSingle();
  if (error) throw error;
  return (data as DailyQuest) ?? null;
}

/**
 * Return today's locked quest, creating it on first spin. The UNIQUE
 * (user_id, quest_date) constraint makes this safe under a double-tap race:
 * on conflict we just refetch the existing row.
 */
export async function getOrCreateDailyQuest(
  client: SupabaseClient,
  userId: string,
  isAdult: boolean,
  now: Date = new Date(),
): Promise<DailyQuestResult> {
  const questDate = nycDateString(now);

  const existing = await fetchToday(client, userId, questDate);
  if (existing) return withTemplate(existing, false);

  const template = spinQuest(isAdult);
  if (!template) throw new Error("No eligible quest templates");

  const { data, error } = await client
    .from("daily_quests")
    .insert({ user_id: userId, quest_template_id: template.id, quest_date: questDate })
    .select("*")
    .single();

  if (error) {
    // Unique violation → another request won the race; return that row.
    if (error.code === "23505") {
      const row = await fetchToday(client, userId, questDate);
      if (row) return withTemplate(row, false);
    }
    throw error;
  }

  return withTemplate(data as DailyQuest, true);
}

export type RerollResult =
  | { ok: true; result: DailyQuestResult; pointsRemaining: number }
  | { ok: false; error: "insufficient_points" | "no_quest_today" };

/**
 * Spend points to re-roll today's quest. Debits the configured cost, picks a
 * new template, and bumps spins_used.
 */
export async function rerollDailyQuest(
  client: SupabaseClient,
  userId: string,
  isAdult: boolean,
  currentPoints: number,
  now: Date = new Date(),
): Promise<RerollResult> {
  const questDate = nycDateString(now);

  const existing = await fetchToday(client, userId, questDate);
  if (!existing) return { ok: false, error: "no_quest_today" };
  if (currentPoints < POINTS.rerollCost) return { ok: false, error: "insufficient_points" };

  const template = spinQuest(isAdult);
  if (!template) throw new Error("No eligible quest templates");

  const pointsRemaining = currentPoints - POINTS.rerollCost;

  const { data, error } = await client
    .from("daily_quests")
    .update({ quest_template_id: template.id, spins_used: existing.spins_used + 1 })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) throw error;

  const { error: pErr } = await client
    .from("profiles")
    .update({ points: pointsRemaining })
    .eq("id", userId);
  if (pErr) throw pErr;

  return { ok: true, result: withTemplate(data as DailyQuest, false), pointsRemaining };
}
