import type { Metadata } from "next";
import Link from "next/link";
import { Sun } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { getShareablePost } from "@/lib/feed/share";
import { Button } from "@/components/ui/button";

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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12">
      {post ? (
        <div className="w-full max-w-sm animate-scale-in overflow-hidden rounded-lg border border-border bg-card shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.photoUrl} alt={post.questTitle} className="aspect-square w-full object-cover" />
          <div className="p-5">
            <p className="eyebrow text-primary">Summer Quest NYC</p>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">
              {post.questTitle}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {post.authorName} did it{post.locationName ? ` at ${post.locationName}` : ""}.
            </p>
            {post.caption && (
              <p className="mt-2 border-l-2 border-border pl-3 text-sm italic text-foreground/75">
                {post.caption}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <span
            className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card text-primary shadow-paper"
            aria-hidden
          >
            <Sun className="h-8 w-8" strokeWidth={1.5} />
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">Summer Quest NYC</h1>
          <p className="mt-1 text-muted-foreground">This post isn&apos;t available.</p>
        </div>
      )}

      <Button asChild className="rounded-full px-8">
        <Link href="/spin">Spin your own quest</Link>
      </Button>
    </main>
  );
}
