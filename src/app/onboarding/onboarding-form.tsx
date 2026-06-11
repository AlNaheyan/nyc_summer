"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProfileAction, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: OnboardingState = {};

export function OnboardingForm({ suggested }: { suggested: string }) {
  const [state, formAction] = useFormState(createProfileAction, initial);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Display name</span>
        <input
          name="display_name"
          defaultValue={suggested}
          required
          maxLength={40}
          placeholder="e.g. sunny_explorer"
          className="rounded-lg border border-input bg-card px-4 py-3 font-medium outline-none transition focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <input type="checkbox" name="is_adult" defaultChecked className="mt-0.5 h-4 w-4 accent-primary" />
        <span className="text-sm text-foreground/80">
          I&apos;m 18 or older.{" "}
          <span className="text-muted-foreground">(Unchecking hides adult-oriented quests.)</span>
        </span>
      </label>

      <p className="rounded-lg border border-border bg-teal-soft/40 px-4 py-3 text-xs text-foreground/75">
        Heads up: photos you mark <strong>public</strong> when completing a quest appear in a
        public feed for everyone.
      </p>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="rounded-full">
      {pending ? "Setting up…" : "Start exploring"}
    </Button>
  );
}
