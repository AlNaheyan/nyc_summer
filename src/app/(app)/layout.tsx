import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
