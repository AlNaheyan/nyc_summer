import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({ reason: z.string().max(280).nullish() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Reporting auto-hides posts at a low threshold, so it's an abuse surface —
  // cap it per user.
  const rl = await rateLimit("report", user.id);
  if (!rl.ok) return rateLimitResponse(rl);

  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  const reason = body.success ? body.data.reason ?? null : null;

  const admin = createAdminClient();

  // Only accept reports against a real, currently-visible post — don't let
  // callers create report rows for arbitrary or already-removed ids.
  const { data: post } = await admin
    .from("feed_posts")
    .select("id")
    .eq("id", params.id)
    .eq("moderation_status", "allowed")
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error: insertError } = await admin
    .from("reports")
    .insert({ feed_post_id: params.id, reporter_id: user.id, reason });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "already_reported" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Recompute the report count (auto-hide is enforced by the RLS threshold).
  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("feed_post_id", params.id);
  await admin.from("feed_posts").update({ report_count: count ?? 1 }).eq("id", params.id);

  return NextResponse.json({ reported: true });
}
