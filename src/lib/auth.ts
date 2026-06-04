import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** The authenticated Supabase user, or null. Server-only. */
export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a signed-in user in a page/route; redirects to /login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** True when the signed-in user has the admin flag on their profile. */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return Boolean(data?.is_admin);
}
