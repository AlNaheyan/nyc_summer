"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Share2, MoreHorizontal, Flag, MapPin, Target } from "lucide-react";
import type { PublicFeedPost } from "@/lib/feed/reads";
import { Avatar, handleFor } from "./Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FeedView() {
  const [posts, setPosts] = useState<PublicFeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  const load = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const url = cursor ? `/api/feed?cursor=${encodeURIComponent(cursor)}` : "/api/feed";
      const res = await fetch(url);
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      setCursor(data.nextCursor);
      if (!data.nextCursor) setDone(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, done, loading]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void load();
    }
  }, [load]);

  return (
    <div className="min-h-dvh lg:min-h-0">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur lg:rounded-t-lg">
        <p className="eyebrow text-muted-foreground">Out there today</p>
        <h1 className="font-display text-xl font-semibold tracking-tight">Summer Feed</h1>
      </header>

      {posts.length === 0 && done && (
        <p className="m-5 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-paper">
          No posts yet. Complete a quest with a public photo to be first.
        </p>
      )}

      <ul>
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </ul>

      {!done && (
        <div className="flex justify-center py-5">
          <Button onClick={load} disabled={loading} variant="outline" size="sm" className="rounded-full">
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FeedCard({ post }: { post: PublicFeedPost }) {
  const [reported, setReported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reacted, setReacted] = useState(post.viewerReacted);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);

  async function report() {
    setMenuOpen(false);
    setReported(true);
    await fetch(`/api/feed/${post.id}/report`, { method: "POST" });
  }

  async function toggleReaction() {
    const next = !reacted;
    setReacted(next);
    setReactionCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/feed/${post.id}/react`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReacted(data.reacted);
        setReactionCount(data.count);
      } else throw new Error();
    } catch {
      setReacted(!next);
      setReactionCount((c) => c + (next ? -1 : 1));
    }
  }

  async function share() {
    const url = `${window.location.origin}/s/${post.id}`;
    const shareData = { title: "Summer Quest NYC", text: `${post.questTitle} — ${post.authorName}`, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }

  return (
    <li className="flex gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-secondary/30">
      <Avatar name={post.authorName} size={44} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="truncate font-semibold">{post.authorName}</span>
          <span className="truncate text-muted-foreground">{handleFor(post.authorName)}</span>
          <span className="text-muted-foreground">· {relativeTime(post.createdAt)}</span>
          <div className="relative ml-auto">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Post options"
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-32 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lift">
                <button
                  onClick={report}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-1.5">
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <Target className="h-3 w-3 shrink-0" />
            <span className="truncate">{post.questTitle}</span>
            {post.locationName && (
              <span className="inline-flex items-center gap-1 truncate font-medium text-primary/70">
                <span className="text-primary/40">·</span>
                <MapPin className="h-3 w-3 shrink-0" />
                {post.locationName}
              </span>
            )}
          </span>
        </p>

        {post.caption && (
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-snug text-foreground/90">
            {post.caption}
          </p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.photoUrl}
          alt={post.questTitle}
          loading="lazy"
          className="mt-2.5 aspect-square w-full rounded-lg border border-border object-cover shadow-paper"
        />

        <div className="mt-2.5 flex items-center gap-1 text-muted-foreground">
          <button
            onClick={toggleReaction}
            aria-pressed={reacted}
            className={cn(
              "group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors active:scale-95",
              reacted ? "text-primary" : "hover:text-primary",
            )}
          >
            <Heart className={cn("h-4 w-4 transition-transform group-active:scale-110", reacted && "fill-current")} />
            <span className="min-w-3 text-left">{reactionCount > 0 ? reactionCount : ""}</span>
          </button>
          <button
            onClick={share}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors hover:text-teal active:scale-95"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          {reported && <span className="ml-2 text-xs text-muted-foreground">Reported, thanks</span>}
        </div>
      </div>
    </li>
  );
}

/** Compact relative time: 12s · 5m · 3h · 2d · then a date. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
