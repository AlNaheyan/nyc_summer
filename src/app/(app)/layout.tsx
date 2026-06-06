import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect("/onboarding");

  // The single-page dashboard (HomeShell) owns its layout + mobile section nav.
  return <div className="min-h-dvh bg-background">{children}</div>;
}
