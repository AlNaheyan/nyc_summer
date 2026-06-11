import Link from "next/link";

/** Farewell screen shown after the season ends (TECH_SPEC §13). */
export function EndOfSeason({ points, longestStreak }: { points: number; longestStreak: number }) {
  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="animate-bounce-soft text-6xl" aria-hidden>🌇</span>
      <h1 className="font-display text-3xl font-bold text-coral">That&apos;s a wrap on summer</h1>
      <p className="max-w-xs text-balance font-medium text-foreground/70">
        Summer Quest NYC is done for the season. Thanks for getting out there and
        exploring the city.
      </p>
      <div className="flex gap-6 rounded-card border-2 border-white bg-white/80 px-6 py-4 shadow-clay">
        <div>
          <div className="font-display text-2xl font-bold text-coral">{points}</div>
          <div className="text-xs font-semibold text-foreground/55">Points</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-coral">{longestStreak}🔥</div>
          <div className="text-xs font-semibold text-foreground/55">Best streak</div>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground/55">The feed is still here to browse.</p>
      <Link href="/feed" className="rounded-full bg-coral px-8 py-3 font-display font-semibold text-white shadow-pop-coral transition-transform active:translate-y-1 active:shadow-none">
        Browse the feed
      </Link>
    </main>
  );
}
