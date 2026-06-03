import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/** Fetch the current user's profile, or null if onboarding isn't done. */
export async function getProfile(
  client: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

/**
 * Create the profile row for a freshly onboarded user. RLS allows a user to
 * insert only their own row (id = auth.uid()).
 */
export async function createProfile(
  client: SupabaseClient,
  input: { id: string; display_name: string; is_adult: boolean; avatar_url?: string | null },
): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .insert({
      id: input.id,
      display_name: input.display_name.trim().slice(0, 40),
      is_adult: input.is_adult,
      avatar_url: input.avatar_url ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}
