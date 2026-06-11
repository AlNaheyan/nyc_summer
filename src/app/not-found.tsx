import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 404 — a missing or mistyped route. Matches the login screen's identity. */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span
          className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card text-primary shadow-paper"
          aria-hidden
        >
          <Compass className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <p className="eyebrow text-muted-foreground">Error 404</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Off the map</h1>
        <p className="max-w-xs text-balance text-muted-foreground">
          We couldn’t find that page. It may have wandered off to enjoy the summer.
        </p>
      </div>

      <Button asChild size="lg" className="rounded-full px-8">
        <Link href="/">Back to base</Link>
      </Button>
    </main>
  );
}
