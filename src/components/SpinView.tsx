"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sun,
  Flame,
  RotateCw,
  Camera,
  Check,
  Share2,
  ArrowRight,
  Trophy,
  Sparkles,
} from "lucide-react";
import type { QuestTemplate } from "@/lib/types";
import type { MatchedOption } from "@/lib/matcher";
import { LocationDeck } from "@/components/LocationDeck";
import { Button } from "@/components/ui/button";
import { BOROUGHS } from "@/lib/geo/borough";
import { POINTS } from "@/lib/gamification/points";
import { MAX_QUESTS_PER_DAY } from "@/lib/quests/day-rules";

type Phase = "idle" | "spinning" | "quest" | "done" | "allDone";

export interface SpinViewProps {
  displayName: string;
  points: number;
  currentStreak: number;
  initialQuest: QuestTemplate | null;
  completedToday: number;
  questsRemaining: number;
  freeRerollAvailable: boolean;
  allDone: boolean;
}

interface DoneResult {
  pointsAwarded: number;
  streak: number;
  newBadges: string[];
  feedStatus: "allowed" | "held" | "blocked" | "rate_limited" | "none";
  feedPostId: string | null;
  questsRemaining: number;
  allDone: boolean;
}

export function SpinView(props: SpinViewProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  // Always open on the wheel (unless the day is done). Spinning reveals the
  // active quest if one already exists, or rolls the next one.
  const [phase, setPhase] = useState<Phase>(props.allDone ? "allDone" : "idle");
  const [quest, setQuest] = useState<QuestTemplate | null>(props.initialQuest);
  const [points, setPoints] = useState(props.points);
  const [completedToday, setCompletedToday] = useState(props.completedToday);
  const [freeReroll, setFreeReroll] = useState(props.freeRerollAvailable);
  const [options, setOptions] = useState<MatchedOption[] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [borough, setBorough] = useState("");
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
    setResult(null);
    setOptions(null);
    setPhase("spinning");
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTimeout(
        () => {
          if (data.allDone || !data.questTemplate) {
            setPhase("allDone");
            return;
          }
          setQuest(data.questTemplate);
          setFreeReroll(data.freeRerollAvailable);
          setCompletedToday(data.completedToday);
          setPhase("quest");
        },
        reduce ? 0 : 1100,
      );
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
      setFreeReroll(data.freeRerollAvailable);
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
        feedPostId: data.feedPostId ?? null,
        questsRemaining: data.questsRemaining ?? 0,
        allDone: data.allDone ?? false,
      });
      setPoints((p) => p + data.pointsAwarded);
      setCompletedToday(data.questsCompletedToday ?? completedToday + 1);
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
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">Hello, {props.displayName}</p>
          <h1 className="font-display text-[1.7rem] font-semibold leading-none tracking-tight">
            Today&apos;s quests
          </h1>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            {completedToday} of {MAX_QUESTS_PER_DAY} done today
          </p>
        </div>
        <div className="flex gap-2">
          <Stat label="Points" value={points} />
          <Stat
            label="Streak"
            value={
              <span className="inline-flex items-center gap-1">
                {props.currentStreak}
                <Flame className="h-3.5 w-3.5 text-primary" />
              </span>
            }
          />
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {(phase === "idle" || phase === "spinning") && (
        <div className="flex flex-col items-center gap-9 py-10 animate-rise-in">
          <SunDial spinning={phase === "spinning"} reduce={!!reduce} />
          <Button
            onClick={spin}
            disabled={phase === "spinning"}
            size="lg"
            className="rounded-full px-9"
          >
            {phase === "spinning" ? (
              "Spinning…"
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {completedToday > 0 ? "Spin your next quest" : "Spin the wheel"}
              </>
            )}
          </Button>
        </div>
      )}

      {phase === "quest" && quest && (
        <div className="flex flex-col gap-6 animate-rise-in">
          <QuestCard quest={quest} index={completedToday + 1} />

          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="eyebrow text-muted-foreground">Where to go</h2>
              <Button
                onClick={reroll}
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCw className="h-3.5 w-3.5" />
                {freeReroll ? "Re-roll" : `Re-roll · ${POINTS.rerollCost}pt`}
              </Button>
            </div>

            <div className="mt-3">
              {optionsLoading && (
                <p className="text-sm text-muted-foreground">Finding spots near you…</p>
              )}

              {!optionsLoading && options && options.length === 0 && (
                <EvergreenNote
                  borough={borough}
                  setBorough={(b) => {
                    setBorough(b);
                    void loadOptions(quest.id, b);
                  }}
                />
              )}

              {!optionsLoading && options && options.length > 0 && (
                <LocationDeck
                  options={options}
                  onDid={(activityId) => setSheet({ activityId })}
                  disabled={submitting}
                />
              )}
            </div>
          </div>

          <Button
            onClick={() => setSheet({})}
            disabled={submitting}
            variant="outline"
            className="rounded-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Check className="h-4 w-4" />
            I did it
          </Button>
        </div>
      )}

      {phase === "done" && (
        <DoneCard
          result={result}
          onNext={() => {
            setQuest(null);
            void spin();
          }}
          onJournal={() => router.push("/journal")}
        />
      )}

      {phase === "allDone" && <AllDoneCard onJournal={() => router.push("/journal")} />}

      {sheet && (
        <MarkDoneSheet
          submitting={submitting}
          onClose={() => setSheet(null)}
          onSubmit={(o) => submitDone({ ...o, activityId: sheet.activityId })}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-[3.5rem] rounded-md border border-border bg-card px-3 py-1.5 text-center">
      <div className="font-display text-lg font-semibold leading-none text-foreground">{value}</div>
      <div className="eyebrow mt-1 text-[0.5625rem] text-muted-foreground">{label}</div>
    </div>
  );
}

/** A sun-faded medallion dial that spins to reveal the quest. */
function SunDial({ spinning, reduce }: { spinning: boolean; reduce: boolean }) {
  return (
    <div className="relative h-52 w-52">
      {/* pointer */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[-2px] z-20 h-0 w-0 -translate-x-1/2"
        style={{
          borderLeft: "9px solid transparent",
          borderRight: "9px solid transparent",
          borderTop: "15px solid hsl(var(--terracotta))",
        }}
      />
      <motion.div
        animate={spinning && !reduce ? { rotate: 360 * 4 + 90 } : { rotate: 0 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="h-52 w-52 rounded-full p-[6px] shadow-paper ring-1 ring-border"
        style={{
          background:
            "conic-gradient(hsl(16 55% 52%) 0deg 60deg, hsl(38 60% 56%) 60deg 120deg, hsl(174 26% 44%) 120deg 180deg, hsl(40 46% 86%) 180deg 240deg, hsl(16 55% 52%) 240deg 300deg, hsl(38 60% 56%) 300deg 360deg)",
        }}
        aria-label="Prize wheel"
      >
        {/* inner paper face with tick ring */}
        <div
          className="grid h-full w-full place-items-center rounded-full bg-card"
          style={{
            backgroundImage:
              "repeating-conic-gradient(hsl(var(--border)) 0deg 0.6deg, transparent 0.6deg 30deg)",
          }}
        >
          <div className="grid h-[58%] w-[58%] place-items-center rounded-full border border-border bg-card text-primary shadow-paper">
            <Sun className="h-9 w-9" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function QuestCard({ quest, index }: { quest: QuestTemplate; index: number }) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-paper">
      {/* faint sun wash, top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(38 70% 58% / 0.22), transparent 70%)" }}
      />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="eyebrow text-primary">Quest no. {String(index).padStart(2, "0")}</span>
          <span className="h-px flex-1 bg-border" />
          <span
            className="grid h-10 w-10 place-items-center rounded-full bg-gold-soft text-xl ring-1 ring-border"
            aria-hidden
          >
            {quest.icon ?? "✨"}
          </span>
        </div>
        <h2 className="font-display text-[1.9rem] font-semibold leading-[1.08] tracking-tight">
          {quest.title}
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
          {quest.description}
        </p>
      </div>
    </article>
  );
}

function EvergreenNote({
  borough,
  setBorough,
}: {
  borough: string;
  setBorough: (b: string) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-teal-soft/40 p-4 text-sm text-foreground/80">
      <p className="font-medium">
        No scheduled spots matched right now — this one&apos;s evergreen. Just go do it.
      </p>
      <label className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Try a borough</span>
        <select
          value={borough}
          onChange={(e) => setBorough(e.target.value)}
          className="rounded-md border border-input bg-card px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">—</option>
          {BOROUGHS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
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
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-rise-in rounded-t-2xl border-t border-border bg-card p-5 pb-8 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-foreground/15" />
        <h3 className="font-display text-xl font-semibold tracking-tight">Mark it done</h3>
        <p className="mt-1 text-sm text-muted-foreground">Add a photo to share it (optional).</p>

        <label className="mt-4 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-foreground/25 bg-background/60 text-muted-foreground transition hover:border-primary/40">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4" /> Tap to add a photo
            </span>
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
          className="mt-3 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          rows={2}
        />

        {photo && (
          <label className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Post to the public feed (after moderation)</span>
          </label>
        )}

        <div className="mt-5 flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ photo, caption: caption.trim() || undefined, isPublic })}
            disabled={submitting}
            className="flex-1 rounded-full"
          >
            {submitting ? "Saving…" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const FEED_MESSAGE: Record<DoneResult["feedStatus"], string | null> = {
  allowed: "Your photo is live on the feed.",
  held: "Your photo is in review and will appear once approved.",
  blocked: "Your photo couldn't be posted (failed moderation), but the quest still counts.",
  rate_limited: "You've hit today's post limit — quest still counts.",
  none: null,
};

function DoneCard({
  result,
  onNext,
  onJournal,
}: {
  result: DoneResult | null;
  onNext: () => void;
  onJournal: () => void;
}) {
  const moreLeft = result ? !result.allDone && result.questsRemaining > 0 : false;
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center animate-rise-in">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-soft text-primary ring-1 ring-border animate-scale-in">
        <Check className="h-8 w-8" strokeWidth={2.5} />
      </span>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Quest complete</h2>
      {result && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          +{result.pointsAwarded} points
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            {result.streak}-day streak <Flame className="h-3.5 w-3.5 text-primary" />
          </span>
        </p>
      )}
      {result && result.newBadges.length > 0 && (
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-gold-soft px-4 py-1.5 text-sm font-semibold animate-scale-in">
          <Trophy className="h-4 w-4 text-primary" /> New badge
          {result.newBadges.length > 1 ? "s" : ""}: {result.newBadges.join(", ")}
        </p>
      )}
      {result && FEED_MESSAGE[result.feedStatus] && (
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          {FEED_MESSAGE[result.feedStatus]}
        </p>
      )}
      {result?.feedStatus === "allowed" && result.feedPostId && (
        <ShareButton feedPostId={result.feedPostId} questHint="my summer quest" />
      )}

      {moreLeft ? (
        <>
          <p className="text-sm text-muted-foreground">
            {result?.questsRemaining} more quest
            {result && result.questsRemaining > 1 ? "s" : ""} available today
          </p>
          <Button onClick={onNext} className="rounded-full px-8">
            Spin next quest <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={onJournal}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            See my journal
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            That&apos;s all {MAX_QUESTS_PER_DAY} quests today — wonderful. See you tomorrow.
          </p>
          <Button onClick={onJournal} className="rounded-full px-8">
            See my journal
          </Button>
        </>
      )}
    </div>
  );
}

function AllDoneCard({ onJournal }: { onJournal: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center animate-rise-in">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-soft text-primary ring-1 ring-border animate-scale-in">
        <Trophy className="h-8 w-8" strokeWidth={1.75} />
      </span>
      <h2 className="font-display text-2xl font-semibold tracking-tight">All done for today</h2>
      <p className="max-w-xs text-balance text-muted-foreground">
        You&apos;ve completed all {MAX_QUESTS_PER_DAY} quests today. Come back tomorrow for more.
      </p>
      <Button onClick={onJournal} className="rounded-full px-8">
        See my journal
      </Button>
    </div>
  );
}

function ShareButton({ feedPostId, questHint }: { feedPostId: string; questHint: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/s/${feedPostId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Summer Quest NYC", text: questHint, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* ignore */
    }
  }
  return (
    <Button onClick={share} variant="teal" className="rounded-full px-8">
      <Share2 className="h-4 w-4" />
      {copied ? "Link copied" : "Share your card"}
    </Button>
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
