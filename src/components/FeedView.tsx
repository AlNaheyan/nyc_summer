"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicFeedPost } from "@/lib/feed/reads";

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
    <main className="px-4 pb-8 pt-6">
      <h1 className="mb-4 px-1 font-display text-2xl font-extrabold text-coral">Feed</h1>

      {posts.length === 0 && done && (
        <p className="rounded-card bg-white/70 p-8 text-center text-foreground/60">
          No posts yet. Complete a quest with a public photo to be first! 📸
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </ul>

      {!done && (
        <button
          onClick={load}
          disabled={loading}
          className="mx-auto mt-6 block rounded-full bg-white px-6 py-2.5 text-sm font-medium shadow-sm disabled:opacity-60"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}

function FeedCard({ post }: { post: PublicFeedPost }) {
  const [reported, setReported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function report() {
    setMenuOpen(false);
    setReported(true);
    await fetch(`/api/feed/${post.id}/report`, { method: "POST" });
  }

  return (
    <li className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{post.authorName}</p>
          <p className="truncate text-xs text-foreground/55">
            {post.questTitle}
            {post.locationName && ` · ${post.locationName}`}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Post options"
            className="px-2 text-foreground/40"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 w-28 rounded-xl border border-foreground/10 bg-white py-1 shadow-lg">
              <button
                onClick={report}
                className="block w-full px-3 py-1.5 text-left text-sm text-coral"
              >
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.photoUrl} alt={post.questTitle} loading="lazy" className="aspect-square w-full object-cover" />

      <div className="px-4 py-3">
        {post.caption && <p className="text-sm text-foreground/80">{post.caption}</p>}
        <p className="mt-1 text-xs text-foreground/45">
          {new Date(post.createdAt).toLocaleDateString()}
          {reported && <span className="ml-2 text-foreground/40">· Reported, thanks</span>}
        </p>
      </div>
    </li>
  );
}
