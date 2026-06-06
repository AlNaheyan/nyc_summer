import type { SupabaseClient } from "@supabase/supabase-js";

export interface PublicFeedPost {
  id: string;
  photoUrl: string;
  caption: string | null;
  questTitle: string;
  locationName: string | null;
  authorName: string;
  createdAt: string;
  reactionCount: number;
  viewerReacted: boolean;
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
  viewerId: string | null = null,
): Promise<FeedPage> {
  const threshold = await reportThreshold(admin);

  let query = admin
    .from("feed_posts")
    // Disambiguate the embed: feed_posts ↔ profiles has two relationship paths
    // (direct user_id FK + indirect via feed_reactions), so name the FK (PGRST201).
    .select("id, photo_url, caption, quest_title, location_name, created_at, report_count, author:profiles!feed_posts_user_id_fkey(display_name)")
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
  const ids = page.map((r) => r.id as string);

  // Reaction counts (+ whether the viewer reacted) for this page.
  const counts = new Map<string, number>();
  const viewerReacted = new Set<string>();
  if (ids.length > 0) {
    const { data: reactions } = await admin
      .from("feed_reactions")
      .select("feed_post_id, user_id")
      .in("feed_post_id", ids);
    for (const r of reactions ?? []) {
      const pid = r.feed_post_id as string;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
      if (viewerId && r.user_id === viewerId) viewerReacted.add(pid);
    }
  }

  const posts: PublicFeedPost[] = page.map((r) => {
    const author = r.author as { display_name?: string } | null;
    const id = r.id as string;
    return {
      id,
      photoUrl: r.photo_url as string,
      caption: (r.caption as string | null) ?? null,
      questTitle: r.quest_title as string,
      locationName: (r.location_name as string | null) ?? null,
      authorName: author?.display_name ?? "Explorer",
      createdAt: r.created_at as string,
      reactionCount: counts.get(id) ?? 0,
      viewerReacted: viewerReacted.has(id),
    };
  });

  return {
    posts,
    nextCursor: hasMore ? (page[page.length - 1].created_at as string) : null,
  };
}
