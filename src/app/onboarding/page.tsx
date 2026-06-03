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
    <main className="flex min-h-dvh flex-col justify-center gap-8 bg-gradient-to-b from-sun-soft via-background to-sky-soft px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-2xl font-extrabold text-coral">
          Welcome! Set up your profile
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Your display name is public on the feed. Your real name never is.
        </p>
        <OnboardingForm suggested={suggested} />
      </div>
    </main>
  );
}
