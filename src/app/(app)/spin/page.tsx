import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { getTemplate } from "@/lib/quests/templates";
import { nycDateString } from "@/lib/time";
import { seasonEnded } from "@/lib/season";
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

  const { data: daily } = await supabase
    .from("daily_quests")
    .select("quest_template_id")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .maybeSingle();

  const initialQuest = daily ? getTemplate(daily.quest_template_id) ?? null : null;

  // Has the user completed today's quest already?
  let completedToday = false;
  if (daily) {
    const { data: last } = await supabase
      .from("completions")
      .select("completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    completedToday = Boolean(last && nycDateString(new Date(last.completed_at)) === today);
  }

  return (
    <SpinView
      displayName={profile.display_name}
      points={profile.points}
      currentStreak={profile.current_streak}
      initialQuest={initialQuest}
      completedToday={completedToday}
    />
  );
}
