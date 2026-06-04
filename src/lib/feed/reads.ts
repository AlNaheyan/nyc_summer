import type { SupabaseClient } from "@supabase/supabase-js";

export interface PublicFeedPost {
  id: string;
  photoUrl: string;
  caption: string | null;
  questTitle: string;
  locationName: string | null;
  authorName: string;
  createdAt: string;
}

export interface FeedPage {
  posts: PublicFeedPost[];
  nextCursor: string | null;
}

const PAGE_SIZE = 20;

async function reportThreshold(admin: SupabaseClient): Promise<number> {
  const { data } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "report_threshold")
    .maybeSingle();
  return data ? Number(data.value) : 3;
}

/**
 * Public feed page (reverse-chron). Served with the service-role client so the
 * poster's display name can be joined, but only public-safe fields are returned
 * and the allowed + below-report-threshold filter is applied explicitly.
 */
export async function getFeedPage(
  admin: SupabaseClient,
  cursor: string | null,
): Promise<FeedPage> {
  const threshold = await reportThreshold(admin);

  let query = admin
    .from("feed_posts")
    .select("id, photo_url, caption, quest_title, location_name, created_at, report_count, author:profiles(display_name)")
    .eq("moderation_status", "allowed")
    .lt("report_count", threshold)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);

  const posts: PublicFeedPost[] = page.map((r) => {
    const author = r.author as { display_name?: string } | null;
    return {
      id: r.id as string,
      photoUrl: r.photo_url as string,
      caption: (r.caption as string | null) ?? null,
      questTitle: r.quest_title as string,
      locationName: (r.location_name as string | null) ?? null,
      authorName: author?.display_name ?? "Explorer",
      createdAt: r.created_at as string,
    };
  });

  return {
    posts,
    nextCursor: hasMore ? (page[page.length - 1].created_at as string) : null,
  };
}
