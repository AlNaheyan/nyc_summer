"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProfileAction, type OnboardingState } from "./actions";

const initial: OnboardingState = {};

export function OnboardingForm({ suggested }: { suggested: string }) {
  const [state, formAction] = useFormState(createProfileAction, initial);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Display name</span>
        <input
          name="display_name"
          defaultValue={suggested}
          required
          maxLength={40}
          placeholder="e.g. sunny_explorer"
          className="rounded-2xl border-2 border-foreground/15 bg-white px-4 py-3 font-medium shadow-clay outline-none transition focus:border-coral"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border-2 border-white bg-white/70 px-4 py-3 shadow-clay">
        <input type="checkbox" name="is_adult" defaultChecked className="mt-1 h-5 w-5 accent-coral" />
        <span className="text-sm text-foreground/80">
          I&apos;m 18 or older.{" "}
          <span className="text-foreground/55">(Unchecking hides adult-oriented quests.)</span>
        </span>
      </label>

      <p className="rounded-2xl border-2 border-white bg-sky-soft/40 px-4 py-3 text-xs font-medium text-foreground/70 shadow-clay">
        Heads up: photos you mark <strong>public</strong> when completing a quest appear in a
        public feed for everyone.
      </p>

      {state.error && <p className="text-sm text-coral">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-coral px-6 py-3.5 font-display font-semibold text-white shadow-pop-coral transition-transform active:translate-y-1 active:shadow-none disabled:opacity-60"
    >
      {pending ? "Setting up…" : "Start exploring"}
    </button>
  );
}
