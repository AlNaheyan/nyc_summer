import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = createClient();
  if (await getProfile(supabase, user.id)) redirect("/spin");

  const suggested =
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ?? "";

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-8 px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <p className="eyebrow text-muted-foreground">Welcome aboard</p>
        <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight">
          Set up your profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your display name is public on the feed. Your real name never is.
        </p>
        <OnboardingForm suggested={suggested} />
      </div>
    </main>
  );
}
