import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getShareablePost } from "@/lib/feed/share";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getShareablePost(createAdminClient(), params.id).catch(() => null);
  if (!post) return { title: "Summer Quest NYC" };
  const title = `${post.authorName} did: ${post.questTitle}`;
  const description = post.caption ?? "One real NYC summer activity a day. Spin yours.";
  // og:image is auto-wired from opengraph-image.tsx in this route.
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const post = await getShareablePost(createAdminClient(), params.id).catch(() => null);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-sun-soft via-background to-sky-soft px-5 py-12">
      {post ? (
        <div className="w-full max-w-sm animate-pop-in overflow-hidden rounded-card border-2 border-white bg-white shadow-clay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.photoUrl} alt={post.questTitle} className="aspect-square w-full object-cover" />
          <div className="p-5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-coral">Summer Quest NYC</p>
            <h1 className="mt-1 font-display text-2xl font-bold">{post.questTitle}</h1>
            <p className="mt-1 font-medium text-foreground/70">
              {post.authorName} did it{post.locationName ? ` at ${post.locationName}` : ""}.
            </p>
            {post.caption && <p className="mt-2 text-sm font-medium text-foreground/70">{post.caption}</p>}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-bounce-soft text-5xl" aria-hidden>☀️</div>
          <h1 className="mt-3 font-display text-2xl font-bold text-coral">Summer Quest NYC</h1>
          <p className="mt-1 font-medium text-foreground/70">This post isn&apos;t available.</p>
        </div>
      )}

      <Link href="/spin" className="rounded-full bg-coral px-8 py-3.5 font-display font-semibold text-white shadow-pop-coral transition-transform active:translate-y-1 active:shadow-none">
        Spin your own quest
      </Link>
    </main>
  );
}
