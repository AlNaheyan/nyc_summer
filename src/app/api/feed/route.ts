import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getFeedPage } from "@/lib/feed/reads";

// Public read (TECH_SPEC §8). No auth required.
export async function GET(request: NextRequest) {
  const cursor = new URL(request.url).searchParams.get("cursor");
  try {
    const page = await getFeedPage(createAdminClient(), cursor);
    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ posts: [], nextCursor: null });
  }
}
