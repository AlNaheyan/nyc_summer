import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

const bodySchema = z.object({ reason: z.string().max(280).nullish() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  const reason = body.success ? body.data.reason ?? null : null;

  const admin = createAdminClient();

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
