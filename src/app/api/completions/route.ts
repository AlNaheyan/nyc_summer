import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { recordCompletion } from "@/lib/completions/service";
import { uploadQuestPhoto, publishCompletionPhoto, type PublishStatus } from "@/lib/feed/service";
import { getTemplate } from "@/lib/quests/templates";
import { seasonEnded } from "@/lib/season";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

const fieldsSchema = z.object({
  activityId: z.number().int().positive().nullish(),
  caption: z.string().max(280).nullish(),
  isPrivate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  if (seasonEnded()) return NextResponse.json({ error: "season_over" }, { status: 403 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Expensive path (upload + paid moderation API) — cap per user.
  const rl = await rateLimit("completions", user.id);
  if (!rl.ok) return rateLimitResponse(rl);

  // Parse JSON or multipart (with optional photo).
  let fields: z.infer<typeof fieldsSchema>;
  let photo: File | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("photo");
      photo = file instanceof File && file.size > 0 ? file : null;
      fields = fieldsSchema.parse({
        activityId: form.get("activityId") ? Number(form.get("activityId")) : null,
        caption: (form.get("caption") as string) || null,
        isPrivate: form.get("isPrivate") === "true",
      });
    } else {
      fields = fieldsSchema.parse((await request.json().catch(() => ({}))) ?? {});
    }
  } catch (err) {
    console.error("[completions] bad_request:", err);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (photo && (!ALLOWED_TYPES.includes(photo.type) || photo.size > MAX_BYTES)) {
    console.error("[completions] invalid_photo:", { type: photo.type, size: photo.size });
    return NextResponse.json({ error: "invalid_photo" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // Upload the photo first (so a failure doesn't create a completion).
    let uploaded: { publicUrl: string; path: string } | null = null;
    if (photo) uploaded = await uploadQuestPhoto(admin, user.id, photo);

    const result = await recordCompletion(admin, {
      userId: user.id,
      activityId: fields.activityId ?? null,
      caption: fields.caption ?? null,
      isPrivate: fields.isPrivate ?? false,
      hasPhoto: Boolean(uploaded),
      photoUrl: uploaded?.publicUrl ?? null,
    });

    // Photo + public → run the moderation gate into the feed.
    let feedStatus: PublishStatus | "none" = "none";
    let feedPostId: string | null = null;
    if (uploaded && !fields.isPrivate) {
      const template = getTemplate(result.completion.quest_template_id);
      let locationName: string | null = null;
      if (result.completion.activity_id != null) {
        const { data } = await admin
          .from("activities")
          .select("location_name")
          .eq("id", result.completion.activity_id)
          .maybeSingle();
        locationName = data?.location_name ?? null;
      }
      const published = await publishCompletionPhoto(admin, {
        completion: result.completion,
        photoUrl: uploaded.publicUrl,
        storagePath: uploaded.path,
        questTitle: template?.title ?? "A summer quest",
        locationName,
      });
      feedStatus = published.status;
      feedPostId = published.feedPost?.id ?? null;
    }

    return NextResponse.json({ ...result, feedStatus, feedPostId }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "no_active_quest") {
      return NextResponse.json({ error: "no_active_quest" }, { status: 409 });
    }
    if (err instanceof Error && err.message === "invalid_activity") {
      return NextResponse.json({ error: "invalid_activity" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
