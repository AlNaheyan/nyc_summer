import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginButton } from "./login-button";

export default async function LoginPage() {
  // Already signed in → skip straight past login.
  if (await getUser()) redirect("/spin");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-sun-soft via-background to-sky-soft px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>
          ☀️
        </span>
        <h1 className="font-display text-3xl font-extrabold text-coral">Summer Quest NYC</h1>
        <p className="max-w-xs text-balance text-foreground/75">
          One real NYC thing to do every day. Spin it, go do it, share the proof.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <LoginButton />
        <p className="mt-4 text-center text-xs text-foreground/55">
          Photos you mark public appear in a public feed.
        </p>
      </div>
    </main>
  );
}
