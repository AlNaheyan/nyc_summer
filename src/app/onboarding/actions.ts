"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createProfile, getProfile } from "@/lib/profiles/service";

const schema = z.object({
  display_name: z.string().trim().min(1, "Pick a name").max(40),
  is_adult: z.boolean(),
});

export interface OnboardingState {
  error?: string;
}

export async function createProfileAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    display_name: String(formData.get("display_name") ?? ""),
    is_adult: formData.get("is_adult") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createClient();
  const existing = await getProfile(supabase, user.id);
  if (!existing) {
    await createProfile(supabase, { id: user.id, ...parsed.data });
  }
  redirect("/spin");
}
