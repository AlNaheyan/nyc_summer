import { redirect } from "next/navigation";
import { Sun } from "lucide-react";
import { getUser } from "@/lib/auth";
import { LoginButton } from "./login-button";

export default async function LoginPage() {
  // Already signed in → skip straight past login.
  if (await getUser()) redirect("/spin");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="flex max-w-md flex-col items-center text-center">
        <span
          className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card text-primary shadow-paper"
          aria-hidden
        >
          <Sun className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-5 text-muted-foreground">New York City · Summer Edition</p>
        <h1 className="mt-2 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight">
          Summer Quest <span className="italic text-primary">NYC</span>
        </h1>
        <p className="mt-3 max-w-sm text-balance text-muted-foreground">
          One real New York thing to do every day. Spin it, go do it, share the proof.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <LoginButton />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Photos you mark public appear in a public feed.
        </p>
      </div>
    </main>
  );
}
