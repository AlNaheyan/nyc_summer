import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { removePost } from "@/lib/feed/admin";

const bodySchema = z.object({ ban: z.boolean().optional() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  const ban = body.success ? Boolean(body.data.ban) : false;

  await removePost(createAdminClient(), params.id, ban);
  return NextResponse.json({ removed: true });
}
