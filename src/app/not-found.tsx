import Link from "next/link";

/** 404 — a missing or mistyped route. Matches the login screen's identity. */
export default function NotFound() {
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
          <span className="animate-bounce-soft">🧭</span>
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-coral">Off the map</h1>
        <p className="max-w-xs text-balance font-medium text-foreground/75">
          We couldn’t find that page. It may have wandered off to enjoy the summer.
        </p>
      </div>

      <Link
        href="/"
        className="relative z-10 rounded-blob bg-coral px-8 py-3 font-display text-lg font-semibold text-white shadow-pop-coral transition active:translate-y-1 active:shadow-none"
      >
        Back to base
      </Link>
    </main>
  );
}
