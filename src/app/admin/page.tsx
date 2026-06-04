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
      <h1 className="mb-1 font-display text-2xl font-extrabold text-coral">Moderation queue</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Held (flagged) and reported posts. {queue.length} item{queue.length === 1 ? "" : "s"}.
      </p>

      {queue.length === 0 ? (
        <p className="rounded-card bg-white/70 p-8 text-center text-foreground/60">
          Nothing to review. 🎉
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {queue.map((post) => (
            <li key={post.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.photo_url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{post.quest_title}</p>
                {post.caption && <p className="text-sm text-foreground/70">{post.caption}</p>}
                <p className="mt-1 text-xs text-foreground/50">
                  <span className="rounded bg-foreground/10 px-1.5 py-0.5">{post.moderation_status}</span>
                  {post.report_count > 0 && (
                    <span className="ml-2 text-coral">{post.report_count} report(s)</span>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="rounded-full bg-sky/15 px-3 py-1.5 text-sm font-medium text-sky">
                      Approve
                    </button>
                  </form>
                  <form action={removeAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="rounded-full bg-coral/15 px-3 py-1.5 text-sm font-medium text-coral">
                      Remove
                    </button>
                  </form>
                  <form action={removeAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="ban" value="true" />
                    <button className="rounded-full bg-coral px-3 py-1.5 text-sm font-medium text-white">
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
