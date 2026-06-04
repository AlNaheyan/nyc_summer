import type { SupabaseClient } from "@supabase/supabase-js";

export interface QueueItem {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  quest_title: string;
  location_name: string | null;
  moderation_status: string;
  report_count: number;
  created_at: string;
}

/**
 * Posts needing admin attention: everything held for review (flagged) plus
 * allowed posts that have been reported. Service-role only.
 */
export async function listModerationQueue(admin: SupabaseClient): Promise<QueueItem[]> {
  const { data, error } = await admin
    .from("feed_posts")
    .select("id, user_id, photo_url, caption, quest_title, location_name, moderation_status, report_count, created_at")
    .or("moderation_status.eq.flagged,and(moderation_status.eq.allowed,report_count.gt.0)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as QueueItem[];
}

/** Approve a held/reported post: make it public and clear its reports. */
export async function approvePost(admin: SupabaseClient, postId: string): Promise<void> {
  const { error } = await admin
    .from("feed_posts")
    .update({ moderation_status: "allowed", report_count: 0 })
    .eq("id", postId);
  if (error) throw error;
  await admin.from("reports").delete().eq("feed_post_id", postId);
}

/** Remove a post from the feed; optionally ban its author from posting. */
export async function removePost(
  admin: SupabaseClient,
  postId: string,
  ban = false,
): Promise<void> {
  const { data: post, error } = await admin
    .from("feed_posts")
    .update({ moderation_status: "removed" })
    .eq("id", postId)
    .select("user_id, photo_url")
    .single();
  if (error) throw error;

  // Best-effort: drop the stored image so a removed photo can't be re-surfaced.
  const path = storagePathFromUrl(post.photo_url as string);
  if (path) await admin.storage.from("quest-photos").remove([path]);

  if (ban && post.user_id) {
    await admin.from("profiles").update({ is_banned: true }).eq("id", post.user_id);
  }
}

function storagePathFromUrl(url: string): string | null {
  const marker = "/quest-photos/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
