"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudLightning } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span
          className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card text-primary shadow-paper"
          aria-hidden
        >
          <CloudLightning className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <p className="eyebrow text-muted-foreground">Something broke</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">A summer storm</h1>
        <p className="max-w-xs text-balance text-muted-foreground">
          Something went sideways on our end. Give it another go — it usually passes quickly.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} size="lg" className="rounded-full">
          Try again
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full bg-card">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
