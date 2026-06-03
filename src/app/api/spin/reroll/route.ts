import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { rerollDailyQuest } from "@/lib/quests/daily";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const supabase = createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "no_profile" }, { status: 403 });

  const result = await rerollDailyQuest(supabase, user.id, profile.is_adult, profile.points);

  if (!result.ok) {
    const status = result.error === "insufficient_points" ? 402 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    questTemplate: result.result.template,
    dailyQuestId: result.result.dailyQuest.id,
    spinsUsed: result.result.dailyQuest.spins_used,
    pointsRemaining: result.pointsRemaining,
  });
}
