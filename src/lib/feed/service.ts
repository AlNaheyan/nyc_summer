import type { SupabaseClient } from "@supabase/supabase-js";
import type { Completion, FeedPost } from "@/lib/types";
import { moderateImage } from "@/lib/moderation";
import { reportCsamSuspicion } from "@/lib/moderation/csam";
import { nycDateString } from "@/lib/time";

const BUCKET = "quest-photos";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface UploadedPhoto {
  publicUrl: string;
  path: string;
}

/** Upload a photo to Storage (service-role). Returns its public URL + path. */
export async function uploadQuestPhoto(
  admin: SupabaseClient,
  userId: string,
  file: { arrayBuffer(): Promise<ArrayBuffer>; type: string },
): Promise<UploadedPhoto> {
  const ext = EXT[file.type];
  if (!ext) throw new Error("unsupported_image_type");

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

async function deletePhoto(admin: SupabaseClient, path: string) {
  await admin.storage.from(BUCKET).remove([path]);
}

async function postsToday(admin: SupabaseClient, userId: string, now: Date): Promise<number> {
  const startOfDayUtc = `${nycDateString(now)}T00:00:00-04:00`;
  const { count } = await admin
    .from("feed_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUtc);
  return count ?? 0;
}

async function maxPostsPerDay(admin: SupabaseClient): Promise<number> {
  const { data } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "max_posts_per_day")
    .maybeSingle();
  return data ? Number(data.value) : 10;
}

export type PublishStatus = "allowed" | "held" | "blocked" | "rate_limited";

export interface PublishResult {
  status: PublishStatus;
  feedPost?: FeedPost;
}

/**
 * Run the moderation gate on a completion's photo and, when it passes, create
 * the feed post. block → delete the image (+ CSAM path); flag → hold (created
 * but not publicly visible per RLS); allow → public. Enforces the per-day post
 * rate limit.
 */
export async function publishCompletionPhoto(
  admin: SupabaseClient,
  input: {
    completion: Completion;
    photoUrl: string;
    storagePath: string;
    questTitle: string;
    locationName: string | null;
  },
  now: Date = new Date(),
): Promise<PublishResult> {
  // Banned authors can still complete quests, but never post to the feed.
  const { data: author } = await admin
    .from("profiles")
    .select("is_banned")
    .eq("id", input.completion.user_id)
    .maybeSingle();
  if (author?.is_banned) {
    await deletePhoto(admin, input.storagePath);
    await admin.from("completions").update({ photo_url: null }).eq("id", input.completion.id);
    return { status: "blocked" };
  }

  const moderation = await moderateImage(input.photoUrl);

  if (moderation.verdict === "block") {
    await deletePhoto(admin, input.storagePath);
    if (moderation.csam) {
      await reportCsamSuspicion({
        userId: input.completion.user_id,
        completionId: input.completion.id,
        storagePath: input.storagePath,
        detectedBy: moderation.reason ?? "moderation",
      });
    }
    // Scrub the rejected URL from the completion record.
    await admin.from("completions").update({ photo_url: null }).eq("id", input.completion.id);
    return { status: "blocked" };
  }

  // Rate limit (only counts toward created posts).
  const [count, limit] = await Promise.all([postsToday(admin, input.completion.user_id, now), maxPostsPerDay(admin)]);
  if (count >= limit) {
    return { status: "rate_limited" };
  }

  const { data, error } = await admin
    .from("feed_posts")
    .insert({
      completion_id: input.completion.id,
      user_id: input.completion.user_id,
      photo_url: input.photoUrl,
      caption: input.completion.caption,
      quest_title: input.questTitle,
      location_name: input.locationName,
      moderation_status: moderation.verdict === "allow" ? "allowed" : "flagged",
    })
    .select("*")
    .single();
  if (error) throw error;

  return { status: moderation.verdict === "allow" ? "allowed" : "held", feedPost: data as FeedPost };
}
