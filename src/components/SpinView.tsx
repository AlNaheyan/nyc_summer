"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { QuestTemplate } from "@/lib/types";
import type { MatchedOption } from "@/lib/matcher";
import { BOROUGHS } from "@/lib/geo/borough";
import { POINTS } from "@/lib/gamification/points";

type Phase = "idle" | "spinning" | "quest" | "done";

interface Props {
  displayName: string;
  points: number;
  currentStreak: number;
  initialQuest: QuestTemplate | null;
  completedToday: boolean;
}

interface DoneResult {
  pointsAwarded: number;
  streak: number;
  newBadges: string[];
  feedStatus: "allowed" | "held" | "blocked" | "rate_limited" | "none";
}

export function SpinView(props: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(
    props.completedToday ? "done" : props.initialQuest ? "quest" : "idle",
  );
  const [quest, setQuest] = useState<QuestTemplate | null>(props.initialQuest);
  const [points, setPoints] = useState(props.points);
  const [options, setOptions] = useState<MatchedOption[] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [borough, setBorough] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DoneResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sheet, setSheet] = useState<{ activityId?: number } | null>(null);

  const loadOptions = useCallback(
    async (templateId: string, boroughOverride?: string) => {
      setOptionsLoading(true);
      setOptions(null);
      const params = new URLSearchParams({ questTemplateId: templateId });
      const b = boroughOverride ?? borough;
      const coords = await getCoords();
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      } else if (b) {
        params.set("borough", b);
      }
      try {
        const res = await fetch(`/api/options?${params.toString()}`);
        const data = await res.json();
        setOptions(data.options ?? []);
      } catch {
        setOptions([]);
      } finally {
        setOptionsLoading(false);
      }
    },
    [borough],
  );

  useEffect(() => {
    if (phase === "quest" && quest && options === null && !optionsLoading) {
      void loadOptions(quest.id);
    }
  }, [phase, quest, options, optionsLoading, loadOptions]);

  async function spin() {
    setError(null);
    setPhase("spinning");
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Let the wheel turn briefly before revealing.
      setTimeout(() => {
        setQuest(data.questTemplate);
        setPhase("quest");
      }, reduce ? 0 : 1100);
    } catch {
      setError("Couldn't spin. Try again.");
      setPhase("idle");
    }
  }

  async function reroll() {
    setError(null);
    try {
      const res = await fetch("/api/spin/reroll", { method: "POST" });
      if (res.status === 402) {
        setError(`Not enough points to re-roll (costs ${POINTS.rerollCost}).`);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuest(data.questTemplate);
      setPoints(data.pointsRemaining);
      setOptions(null);
    } catch {
      setError("Couldn't re-roll. Try again.");
    }
  }

  async function submitDone(opts: {
    activityId?: number;
    photo?: File | null;
    caption?: string;
    isPublic?: boolean;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      let res: Response;
      if (opts.photo) {
        const form = new FormData();
        if (opts.activityId) form.set("activityId", String(opts.activityId));
        if (opts.caption) form.set("caption", opts.caption);
        form.set("isPrivate", opts.isPublic === false ? "true" : "false");
        form.set("photo", opts.photo);
        res = await fetch("/api/completions", { method: "POST", body: form });
      } else {
        res = await fetch("/api/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityId: opts.activityId ?? null, caption: opts.caption ?? null }),
        });
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({
        pointsAwarded: data.pointsAwarded,
        streak: data.streak,
        newBadges: data.newBadges,
        feedStatus: data.feedStatus ?? "none",
      });
      setPoints((p) => p + data.pointsAwarded);
      setSheet(null);
      setPhase("done");
      router.refresh();
    } catch {
      setError("Couldn't mark done. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-5 pb-8 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground/60">Hey {props.displayName} 👋</p>
          <h1 className="font-display text-2xl font-extrabold text-coral">Today&apos;s Quest</h1>
        </div>
        <div className="flex gap-3 text-right text-sm">
          <Stat label="Points" value={points} />
          <Stat label="Streak" value={`${props.currentStreak}🔥`} />
        </div>
      </header>

      {error && <p className="mb-4 rounded-xl bg-coral/10 px-4 py-2 text-sm text-coral">{error}</p>}

      {(phase === "idle" || phase === "spinning") && (
        <div className="flex flex-col items-center gap-8 py-10">
          <motion.div
            animate={phase === "spinning" && !reduce ? { rotate: 360 * 4 } : { rotate: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-sun via-coral to-sky text-6xl shadow-card"
          >
            🎡
          </motion.div>
          <button
            onClick={spin}
            disabled={phase === "spinning"}
            className="rounded-full bg-coral px-10 py-4 text-lg font-bold text-white shadow-card transition active:scale-[0.97] disabled:opacity-70"
          >
            {phase === "spinning" ? "Spinning…" : "Spin the wheel"}
          </button>
        </div>
      )}

      {phase === "quest" && quest && (
        <div className="flex flex-col gap-5">
          <QuestCard quest={quest} />

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Where to go</h2>
            <button onClick={reroll} className="text-sm font-medium text-sky underline-offset-2 hover:underline">
              Re-roll ({POINTS.rerollCost} pts)
            </button>
          </div>

          {optionsLoading && <p className="text-sm text-foreground/55">Finding spots near you…</p>}

          {!optionsLoading && options && options.length === 0 && (
            <EvergreenNote borough={borough} setBorough={(b) => { setBorough(b); void loadOptions(quest.id, b); }} />
          )}

          {!optionsLoading &&
            options?.map((o) => (
              <OptionCard key={o.id} option={o} onDid={() => setSheet({ activityId: o.id })} disabled={submitting} />
            ))}

          <button
            onClick={() => setSheet({})}
            disabled={submitting}
            className="mt-2 rounded-full border-2 border-coral px-6 py-3 font-semibold text-coral transition active:scale-[0.98] disabled:opacity-60"
          >
            I did it (mark done)
          </button>
        </div>
      )}

      {sheet && (
        <MarkDoneSheet
          submitting={submitting}
          onClose={() => setSheet(null)}
          onSubmit={(o) => submitDone({ ...o, activityId: sheet.activityId })}
        />
      )}

      {phase === "done" && (
        <DoneCard result={result} onJournal={() => router.push("/journal")} />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-bold">{value}</div>
      <div className="text-xs text-foreground/50">{label}</div>
    </div>
  );
}

function QuestCard({ quest }: { quest: QuestTemplate }) {
  return (
    <div className="rounded-card bg-gradient-to-br from-sun-soft to-coral-soft p-6 shadow-card">
      <div className="mb-2 text-5xl" aria-hidden>{quest.icon ?? "✨"}</div>
      <h2 className="font-display text-2xl font-extrabold">{quest.title}</h2>
      <p className="mt-1 text-foreground/75">{quest.description}</p>
    </div>
  );
}

function OptionCard({ option, onDid, disabled }: { option: MatchedOption; onDid: () => void; disabled: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{option.title}</h3>
          <p className="truncate text-sm text-foreground/60">
            {option.location_name ?? option.borough ?? "NYC"}
            {option.distanceKm != null && ` · ${option.distanceKm.toFixed(1)} km`}
          </p>
          {option.start_date && (
            <p className="text-xs text-foreground/50">{new Date(option.start_date).toLocaleDateString()}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={option.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-full bg-sky/10 py-2 text-center text-sm font-medium text-sky"
        >
          Details ↗
        </a>
        <button
          onClick={onDid}
          disabled={disabled}
          className="flex-1 rounded-full bg-coral py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          I did this
        </button>
      </div>
    </div>
  );
}

function EvergreenNote({ borough, setBorough }: { borough: string; setBorough: (b: string) => void }) {
  return (
    <div className="rounded-2xl bg-sky-soft/30 p-4 text-sm text-foreground/75">
      <p>No scheduled spots matched right now — this one&apos;s evergreen. Just go do it! 🌎</p>
      <label className="mt-3 flex items-center gap-2">
        <span className="text-xs">Try a borough:</span>
        <select
          value={borough}
          onChange={(e) => setBorough(e.target.value)}
          className="rounded-lg border border-foreground/15 bg-white px-2 py-1 text-sm"
        >
          <option value="">—</option>
          {BOROUGHS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function MarkDoneSheet({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (o: { photo?: File | null; caption?: string; isPublic?: boolean }) => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  function pick(file: File | null) {
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-card bg-background p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-extrabold">Mark it done</h3>
        <p className="mt-1 text-sm text-foreground/60">Add a photo to share it (optional).</p>

        <label className="mt-4 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-foreground/20 bg-white/60 text-foreground/50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm">📷 Tap to add a photo</span>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
          placeholder="Say something (optional)…"
          className="mt-3 w-full rounded-2xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-coral"
          rows={2}
        />

        {photo && (
          <label className="mt-3 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-5 w-5 accent-coral" />
            <span>Post to the public feed (after moderation)</span>
          </label>
        )}

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-foreground/20 py-3 font-semibold text-foreground/70">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ photo, caption: caption.trim() || undefined, isPublic })}
            disabled={submitting}
            className="flex-1 rounded-full bg-coral py-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Done!"}
          </button>
        </div>
      </div>
    </div>
  );
}

const FEED_MESSAGE: Record<DoneResult["feedStatus"], string | null> = {
  allowed: "📸 Your photo is live on the feed!",
  held: "📸 Your photo is in review and will appear once approved.",
  blocked: "Your photo couldn't be posted (failed moderation), but the quest still counts.",
  rate_limited: "You've hit today's post limit — quest still counts!",
  none: null,
};

function DoneCard({ result, onJournal }: { result: DoneResult | null; onJournal: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="text-6xl" aria-hidden>🎉</div>
      <h2 className="font-display text-2xl font-extrabold text-coral">Quest complete!</h2>
      {result && (
        <p className="text-foreground/75">
          +{result.pointsAwarded} points · {result.streak}-day streak 🔥
        </p>
      )}
      {result && result.newBadges.length > 0 && (
        <p className="rounded-full bg-sun-soft px-4 py-2 text-sm font-medium">
          🏅 New badge{result.newBadges.length > 1 ? "s" : ""}: {result.newBadges.join(", ")}
        </p>
      )}
      {result && FEED_MESSAGE[result.feedStatus] && (
        <p className="max-w-xs text-balance text-sm text-foreground/65">{FEED_MESSAGE[result.feedStatus]}</p>
      )}
      <p className="text-sm text-foreground/55">Come back tomorrow for a new quest.</p>
      <button onClick={onJournal} className="rounded-full bg-coral px-8 py-3 font-semibold text-white shadow-card">
        See my journal
      </button>
    </div>
  );
}

/** Best-effort browser geolocation; resolves null on denial/timeout. */
function getCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 },
    );
  });
}
