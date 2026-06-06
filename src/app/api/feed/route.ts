import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getFeedPage } from "@/lib/feed/reads";

// Public read (TECH_SPEC §8). Auth is optional — only used to mark the viewer's
// own reactions.
export async function GET(request: NextRequest) {
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const user = await getUser();
    const page = await getFeedPage(createAdminClient(), cursor, user?.id ?? null);
    return NextResponse.json(page);
  } catch (err) {
    // Degrade to an empty feed rather than a crash, but don't fail silently.
    console.error("[feed] getFeedPage failed:", err);
    return NextResponse.json({ posts: [], nextCursor: null });
  }
}
