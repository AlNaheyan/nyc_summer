import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { getTemplate } from "@/lib/quests/templates";
import { nycDateString } from "@/lib/time";
import { seasonEnded } from "@/lib/season";
import { completedCount, isFreeReroll, questsRemaining, canStartNewQuest } from "@/lib/quests/day-rules";
import type { DailyQuest } from "@/lib/types";
import { HomeShell } from "@/components/HomeShell";
import { EndOfSeason } from "@/components/EndOfSeason";
import type { JournalEntry } from "@/components/JournalList";

export default async function HomePage() {
  const user = await requireUser();
  const supabase = createClient();
  const profile = (await getProfile(supabase, user.id))!;

  if (seasonEnded()) {
    return <EndOfSeason points={profile.points} longestStreak={profile.longest_streak} />;
  }

  const today = nycDateString();

  // Today's quest slots (drives the spin column).
  const { data: questRows } = await supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .order("slot", { ascending: true });
  const rows = (questRows ?? []) as DailyQuest[];
  const active = rows.find((r) => !r.completed) ?? null;
  const allDone = active == null && !canStartNewQuest(rows);

  // Earned badges (left column).
  const { data: badgeRows } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);
  const earnedBadges = (badgeRows ?? []).map((b) => b.badge_id as string);

  // Journal (right column).
  const { data: completions } = await supabase
    .from("completions")
    .select("id, quest_template_id, caption, completed_at, activity:activities(title, location_name)")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(50);
  const journal: JournalEntry[] = (completions ?? []).map((c) => {
    const template = getTemplate(c.quest_template_id);
    const activity = c.activity as { title?: string; location_name?: string } | null;
    return {
      id: c.id as string,
      icon: template?.icon ?? "✅",
      title: template?.title ?? "Quest",
      subtitle: activity?.title ?? activity?.location_name ?? "Honor-system completion",
      date: c.completed_at as string,
      caption: (c.caption as string | null) ?? null,
    };
  });

  return (
    <HomeShell
      profile={profile}
      earnedBadges={earnedBadges}
      journal={journal}
      spin={{
        displayName: profile.display_name,
        points: profile.points,
        currentStreak: profile.current_streak,
        initialQuest: active ? getTemplate(active.quest_template_id) ?? null : null,
        completedToday: completedCount(rows),
        questsRemaining: questsRemaining(rows),
        freeRerollAvailable: isFreeReroll(rows),
        allDone,
      }}
    />
  );
}
