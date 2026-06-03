import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { recordCompletion } from "@/lib/completions/service";

// Phase 1 is honor-system, no photo upload (photos + feed arrive in Phase 2).
const bodySchema = z.object({
  activityId: z.number().int().positive().nullish(),
  caption: z.string().max(280).nullish(),
  isPrivate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = {};
  }
  const parsed = bodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await recordCompletion(admin, {
      userId: user.id,
      activityId: parsed.data.activityId ?? null,
      caption: parsed.data.caption ?? null,
      isPrivate: parsed.data.isPrivate ?? false,
      hasPhoto: false,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "no_active_quest") {
      return NextResponse.json({ error: "no_active_quest" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
