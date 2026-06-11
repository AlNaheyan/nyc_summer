"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-segment error boundary. Catches runtime errors thrown while rendering a
 * page (everything below the root layout). `reset()` re-renders the segment.
 * Next.js shows this in place of the real stack trace in production.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to server logs / observability — the user never sees the trace.
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-b from-sun-soft via-background to-sky-soft px-6 text-center">
      <div aria-hidden className="blob left-[-3rem] top-16 h-48 w-48 animate-float bg-coral-soft" />
      <div aria-hidden className="blob right-[-4rem] top-1/4 h-60 w-60 animate-float bg-grape-soft [animation-delay:2s]" />
      <div aria-hidden className="blob bottom-12 left-1/3 h-52 w-52 animate-float bg-mint-soft [animation-delay:3.5s]" />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span
          className="grid h-20 w-20 place-items-center rounded-blob border-2 border-white bg-white text-5xl shadow-clay"
          aria-hidden
        >
          <span className="animate-bounce-soft">🌩️</span>
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-coral">A summer storm</h1>
        <p className="max-w-xs text-balance font-medium text-foreground/75">
          Something went sideways on our end. Give it another go — it usually passes quickly.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-blob bg-coral px-8 py-3 font-display text-lg font-semibold text-white shadow-pop-coral transition active:translate-y-1 active:shadow-none"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-blob border-2 border-coral/30 bg-white px-8 py-3 font-display text-lg font-semibold text-coral shadow-clay transition active:translate-y-1"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
