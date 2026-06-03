export default function Home() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-sun-soft via-background to-sky-soft px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <span className="text-5xl" aria-hidden>
          ☀️
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-coral">
          Summer Quest NYC
        </h1>
        <p className="text-balance text-lg text-foreground/80">
          One real, doable NYC summer activity a day. Spin it, go do it, share
          the proof.
        </p>
        <div className="rounded-card bg-white/70 px-5 py-4 shadow-card">
          <p className="text-sm font-medium text-foreground/70">
            Phase&nbsp;0 setup is live. Core loop coming next.
          </p>
        </div>
      </div>
    </main>
  );
}
