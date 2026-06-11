import Link from "next/link";
import { Sunset, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Farewell screen shown after the season ends (TECH_SPEC §13). */
export function EndOfSeason({ points, longestStreak }: { points: number; longestStreak: number }) {
  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span
        className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card text-primary shadow-paper"
        aria-hidden
      >
        <Sunset className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <p className="eyebrow text-muted-foreground">The season has set</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        That&apos;s a wrap on summer
      </h1>
      <p className="max-w-xs text-balance text-muted-foreground">
        Summer Quest NYC is done for the season. Thanks for getting out there and exploring the city.
      </p>
      <div className="flex divide-x divide-border overflow-hidden rounded-lg border border-border bg-card shadow-paper">
        <div className="px-6 py-4">
          <div className="font-display text-2xl font-semibold">{points}</div>
          <div className="eyebrow mt-1 text-[0.5625rem] text-muted-foreground">Points</div>
        </div>
        <div className="px-6 py-4">
          <div className="inline-flex items-center gap-1 font-display text-2xl font-semibold">
            {longestStreak}
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <div className="eyebrow mt-1 text-[0.5625rem] text-muted-foreground">Best streak</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">The feed is still here to browse.</p>
      <Button asChild className="rounded-full px-8">
        <Link href="/feed">Browse the feed</Link>
      </Button>
    </main>
  );
}
