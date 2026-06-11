import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { listModerationQueue } from "@/lib/feed/admin";
import { approveAction, removeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) notFound(); // hidden gated route

  const queue = await listModerationQueue(createAdminClient());

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <p className="eyebrow text-muted-foreground">Admin</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Moderation queue</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Held (flagged) and reported posts. {queue.length} item{queue.length === 1 ? "" : "s"}.
      </p>

      {queue.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground shadow-paper">
          Nothing to review.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {queue.map((post) => (
            <li
              key={post.id}
              className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-paper"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.photo_url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-md border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold">{post.quest_title}</p>
                {post.caption && <p className="text-sm text-foreground/70">{post.caption}</p>}
                <p className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                    {post.moderation_status}
                  </span>
                  {post.report_count > 0 && (
                    <span className="font-medium text-destructive">
                      {post.report_count} report(s)
                    </span>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="rounded-full bg-teal/12 px-3.5 py-1.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/20">
                      Approve
                    </button>
                  </form>
                  <form action={removeAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="rounded-full bg-destructive/12 px-3.5 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20">
                      Remove
                    </button>
                  </form>
                  <form action={removeAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="ban" value="true" />
                    <button className="rounded-full bg-destructive px-3.5 py-1.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90">
                      Remove + ban
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
