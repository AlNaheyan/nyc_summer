import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/quests/templates";
import { findOptions } from "@/lib/matcher";

const querySchema = z.object({
  questTemplateId: z.string().min(1),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  borough: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { questTemplateId, lat, lng, borough } = parsed.data;

  const template = getTemplate(questTemplateId);
  if (!template) return NextResponse.json({ error: "unknown_quest" }, { status: 404 });

  const location = lat != null && lng != null ? { lat, lng } : null;

  try {
    const supabase = createClient();
    const options = await findOptions(supabase, {
      matchTags: template.match_tags,
      location,
      borough: borough ?? null,
    });
    return NextResponse.json({ options });
  } catch {
    // Matcher failure degrades to "no options", not a crash (TECH_SPEC §7).
    return NextResponse.json({ options: [] });
  }
}
