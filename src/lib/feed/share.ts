import type { SupabaseClient } from "@supabase/supabase-js";

export interface ShareablePost {
  id: string;
  questTitle: string;
  authorName: string;
  photoUrl: string;
  caption: string | null;
  locationName: string | null;
  createdAt: string;
}

/**
 * Fetch a post for a public share card. Only allowed, below-threshold posts are
 * shareable, so a held/removed/reported image can never be surfaced via a link.
 */
export async function getShareablePost(
  admin: SupabaseClient,
  id: string,
): Promise<ShareablePost | null> {
  const { data: cfg } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "report_threshold")
    .maybeSingle();
  const threshold = cfg ? Number(cfg.value) : 3;

  const { data, error } = await admin
    .from("feed_posts")
    // Name the FK to disambiguate the embed (PGRST201); see feed/reads.ts.
    .select("id, photo_url, caption, quest_title, location_name, created_at, report_count, moderation_status, author:profiles!feed_posts_user_id_fkey(display_name)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.moderation_status !== "allowed" || (data.report_count as number) >= threshold) return null;

  const author = data.author as { display_name?: string } | null;
  return {
    id: data.id as string,
    questTitle: data.quest_title as string,
    authorName: author?.display_name ?? "an explorer",
    photoUrl: data.photo_url as string,
    caption: (data.caption as string | null) ?? null,
    locationName: (data.location_name as string | null) ?? null,
    createdAt: data.created_at as string,
  };
}
