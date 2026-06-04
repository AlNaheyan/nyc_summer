import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/** Toggle the viewer's 👍 on a post. Returns the new state + count. */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createAdminClient();
  const postId = params.id;

  const { data: existing } = await admin
    .from("feed_reactions")
    .select("user_id")
    .eq("feed_post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  let reacted: boolean;
  if (existing) {
    await admin.from("feed_reactions").delete().eq("feed_post_id", postId).eq("user_id", user.id);
    reacted = false;
  } else {
    const { error } = await admin
      .from("feed_reactions")
      .insert({ feed_post_id: postId, user_id: user.id });
    if (error && error.code !== "23505") {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    reacted = true;
  }

  const { count } = await admin
    .from("feed_reactions")
    .select("user_id", { count: "exact", head: true })
    .eq("feed_post_id", postId);

  return NextResponse.json({ reacted, count: count ?? 0 });
}
