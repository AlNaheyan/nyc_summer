import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { rerollActiveQuest } from "@/lib/quests/daily";
import { seasonEnded } from "@/lib/season";

export async function POST() {
  if (seasonEnded()) return NextResponse.json({ error: "season_over" }, { status: 403 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const supabase = createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "no_profile" }, { status: 403 });

  const result = await rerollActiveQuest(supabase, user.id, profile.is_adult, profile.points);

  if (!result.ok) {
    const status = result.error === "insufficient_points" ? 402 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    questTemplate: result.state.template,
    dailyQuestId: result.state.dailyQuest?.id ?? null,
    pointsRemaining: result.pointsRemaining,
    freeRerollAvailable: result.state.freeRerollAvailable,
    wasFree: result.wasFree,
  });
}
