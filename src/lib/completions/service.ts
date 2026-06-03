import type { SupabaseClient } from "@supabase/supabase-js";
import type { Completion, Profile } from "@/lib/types";
import { nycDateString } from "@/lib/time";
import { applyCompletion } from "@/lib/gamification/streak";
import { computePoints } from "@/lib/gamification/points";
import { evaluateBadges, type UserStats } from "@/lib/gamification/evaluate-badges";

export interface RecordCompletionInput {
  userId: string;
  activityId?: number | null;
  caption?: string | null;
  isPrivate?: boolean;
  hasPhoto?: boolean;
  photoUrl?: string | null;
}

export interface RecordCompletionResult {
  completion: Completion;
  pointsAwarded: number;
  streak: number;
  longestStreak: number;
  newBadges: string[];
}

/** Aggregate the stats badge rules are evaluated against. */
async function getUserStats(client: SupabaseClient, userId: string, points: number): Promise<UserStats> {
  const { data, error } = await client
    .from("completions")
    .select("activity:activities(tags,borough)")
    .eq("user_id", userId);
  if (error) throw error;

  const tags = new Set<string>();
  const boroughs = new Set<string>();
  for (const row of data ?? []) {
    const activity = (row as { activity: { tags?: string[]; borough?: string | null } | null }).activity;
    if (!activity) continue;
    for (const t of activity.tags ?? []) tags.add(t);
    if (activity.borough) boroughs.add(activity.borough);
  }

  const { count: shares } = await client
    .from("feed_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    completions: data?.length ?? 0,
    streak: 0, // filled by caller (longest streak)
    points,
    distinctTags: tags.size,
    boroughs: boroughs.size,
    shares: shares ?? 0,
  };
}

/**
 * Record a quest completion: derive the active quest from today's lock (never
 * trust the client), write the completion, then apply streak, points, and
 * badge unlocks. Runs with a trusted (service-role) client.
 */
export async function recordCompletion(
  admin: SupabaseClient,
  input: RecordCompletionInput,
  now: Date = new Date(),
): Promise<RecordCompletionResult> {
  const today = nycDateString(now);

  // Active quest for today (server-derived).
  const { data: daily, error: dErr } = await admin
    .from("daily_quests")
    .select("quest_template_id")
    .eq("user_id", input.userId)
    .eq("quest_date", today)
    .maybeSingle();
  if (dErr) throw dErr;
  if (!daily) throw new Error("no_active_quest");

  const { data: profileRow, error: pErr } = await admin
    .from("profiles")
    .select("*")
    .eq("id", input.userId)
    .single();
  if (pErr) throw pErr;
  const profile = profileRow as Profile;

  // Streak + points.
  const streak = applyCompletion(
    {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_completion_date: profile.last_completion_date,
    },
    today,
  );
  const points = computePoints({
    hasPhoto: Boolean(input.hasPhoto),
    newStreak: streak.current_streak,
    countsForStreak: !streak.sameDay,
  });
  const newPoints = profile.points + points.total;

  // Write the completion.
  const { data: completionRow, error: cErr } = await admin
    .from("completions")
    .insert({
      user_id: input.userId,
      quest_template_id: daily.quest_template_id,
      activity_id: input.activityId ?? null,
      caption: input.caption ?? null,
      is_private: input.isPrivate ?? false,
      photo_url: input.photoUrl ?? null,
    })
    .select("*")
    .single();
  if (cErr) throw cErr;

  // Update the profile (points + streak).
  const { error: upErr } = await admin
    .from("profiles")
    .update({
      points: newPoints,
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_completion_date: streak.last_completion_date,
    })
    .eq("id", input.userId);
  if (upErr) throw upErr;

  // Badges.
  const stats = await getUserStats(admin, input.userId, newPoints);
  stats.streak = streak.longest_streak;

  const { data: held } = await admin
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", input.userId);
  const heldIds = (held ?? []).map((r) => (r as { badge_id: string }).badge_id);

  const newBadges = evaluateBadges(stats, heldIds);
  if (newBadges.length > 0) {
    const { error: bErr } = await admin
      .from("user_badges")
      .insert(newBadges.map((badge_id) => ({ user_id: input.userId, badge_id })));
    if (bErr) throw bErr;
  }

  return {
    completion: completionRow as Completion,
    pointsAwarded: points.total,
    streak: streak.current_streak,
    longestStreak: streak.longest_streak,
    newBadges,
  };
}
