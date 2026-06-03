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

  async function markDone(activityId?: number) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activityId ?? null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({ pointsAwarded: data.pointsAwarded, streak: data.streak, newBadges: data.newBadges });
      setPoints((p) => p + data.pointsAwarded);
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
            options?.map((o) => <OptionCard key={o.id} option={o} onDid={() => markDone(o.id)} disabled={submitting} />)}

          <button
            onClick={() => markDone()}
            disabled={submitting}
            className="mt-2 rounded-full border-2 border-coral px-6 py-3 font-semibold text-coral transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "I did it (mark done)"}
          </button>
        </div>
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
