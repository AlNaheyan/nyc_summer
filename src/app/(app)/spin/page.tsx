import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { getTemplate } from "@/lib/quests/templates";
import { nycDateString } from "@/lib/time";
import { seasonEnded } from "@/lib/season";
import {
  completedCount,
  isFreeReroll,
  questsRemaining,
  canStartNewQuest,
} from "@/lib/quests/day-rules";
import type { DailyQuest } from "@/lib/types";
import { SpinView } from "@/components/SpinView";
import { EndOfSeason } from "@/components/EndOfSeason";

export default async function SpinPage() {
  const user = await requireUser();
  const supabase = createClient();
  const profile = (await getProfile(supabase, user.id))!;

  if (seasonEnded()) {
    return <EndOfSeason points={profile.points} longestStreak={profile.longest_streak} />;
  }

  const today = nycDateString();
  const { data } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .order("slot", { ascending: true });
  const rows = (data ?? []) as DailyQuest[];

  const active = rows.find((r) => !r.completed) ?? null;
  const allDone = active == null && !canStartNewQuest(rows);

  return (
    <SpinView
      displayName={profile.display_name}
      points={profile.points}
      currentStreak={profile.current_streak}
      initialQuest={active ? getTemplate(active.quest_template_id) ?? null : null}
      completedToday={completedCount(rows)}
      questsRemaining={questsRemaining(rows)}
      freeRerollAvailable={isFreeReroll(rows)}
      allDone={allDone}
    />
  );
}
