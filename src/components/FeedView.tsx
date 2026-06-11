"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicFeedPost } from "@/lib/feed/reads";
import { Avatar, handleFor } from "./Avatar";

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
      <header className="sticky top-0 z-10 border-b-2 border-white/60 bg-background/80 px-4 py-3 backdrop-blur lg:rounded-t-card">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <span aria-hidden>📸</span> Summer Feed
        </h1>
      </header>

      {posts.length === 0 && done && (
        <p className="m-4 rounded-card border-2 border-white bg-white/70 p-8 text-center font-medium text-foreground/60 shadow-clay">
          No posts yet. Complete a quest with a public photo to be first! 📸
        </p>
      )}

      <ul>
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </ul>

      {!done && (
        <button
          onClick={load}
          disabled={loading}
          className="mx-auto my-5 block rounded-full border-2 border-white bg-white px-6 py-2.5 text-sm font-bold text-coral shadow-clay transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
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
    <li className="flex gap-3 border-b border-foreground/10 px-4 py-3 transition hover:bg-white/40">
      <Avatar name={post.authorName} size={44} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="truncate font-bold">{post.authorName}</span>
          <span className="truncate text-foreground/45">{handleFor(post.authorName)}</span>
          <span className="text-foreground/40">· {relativeTime(post.createdAt)}</span>
          <div className="relative ml-auto">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Post options"
              className="rounded-full px-2 text-foreground/40 hover:bg-foreground/10"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-10 w-28 rounded-xl border border-foreground/10 bg-white py-1 shadow-lg">
                <button onClick={report} className="block w-full px-3 py-1.5 text-left text-sm text-coral">
                  Report
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-1">
          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-sky/10 px-2.5 py-1 text-xs font-bold text-sky">
            🎯 {post.questTitle}
            {post.locationName && <span className="truncate font-semibold text-sky/70"> · 📍 {post.locationName}</span>}
          </span>
        </p>

        {post.caption && (
          <p className="mt-1.5 whitespace-pre-wrap text-[15px] font-medium leading-snug text-foreground/90">{post.caption}</p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.photoUrl}
          alt={post.questTitle}
          loading="lazy"
          className="mt-2.5 aspect-square w-full rounded-card border-2 border-white object-cover shadow-clay"
        />

        <div className="mt-2 flex items-center gap-1 text-foreground/50">
          <button
            onClick={toggleReaction}
            aria-pressed={reacted}
            className={`group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold transition active:scale-90 ${
              reacted ? "bg-coral/15 text-coral" : "hover:bg-coral/10 hover:text-coral"
            }`}
          >
            <span className={reacted ? "inline-block animate-wiggle" : "inline-block"} aria-hidden>👍</span>
            <span className="min-w-3 text-left">{reactionCount > 0 ? reactionCount : ""}</span>
          </button>
          <button
            onClick={share}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold transition hover:bg-sky/10 hover:text-sky active:scale-90"
          >
            <span aria-hidden>↗</span> Share
          </button>
          {reported && <span className="ml-2 text-xs text-foreground/40">Reported, thanks</span>}
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
