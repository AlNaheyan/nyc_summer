import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { getOrCreateDailyQuest } from "@/lib/quests/daily";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const supabase = createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "no_profile" }, { status: 403 });

  const { dailyQuest, template } = await getOrCreateDailyQuest(
    supabase,
    user.id,
    profile.is_adult,
  );

  return NextResponse.json({
    questTemplate: template,
    dailyQuestId: dailyQuest.id,
    spinsUsed: dailyQuest.spins_used,
  });
}
