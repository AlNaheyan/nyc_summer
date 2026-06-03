export default function FeedPage() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-5xl" aria-hidden>📸</div>
      <h1 className="font-display text-2xl font-extrabold text-coral">Feed</h1>
      <p className="max-w-xs text-balance text-foreground/60">
        Coming soon: a public stream of everyone&apos;s summer quests. Photos and the
        feed arrive in Phase 2 once moderation is in place.
      </p>
    </main>
  );
}
