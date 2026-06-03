import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/quests/templates";

export default async function JournalPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: completions } = await supabase
    .from("completions")
    .select("id, quest_template_id, caption, completed_at, activity:activities(title, location_name, borough)")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const rows = completions ?? [];

  return (
    <main className="px-5 pb-8 pt-6">
      <h1 className="mb-5 font-display text-2xl font-extrabold text-coral">My Journal</h1>

      {rows.length === 0 ? (
        <div className="rounded-card bg-white/70 p-8 text-center text-foreground/60">
          <div className="mb-2 text-4xl" aria-hidden>📔</div>
          No completed quests yet. Spin one and go explore!
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((c) => {
            const template = getTemplate(c.quest_template_id);
            const activity = c.activity as { title?: string; location_name?: string; borough?: string } | null;
            return (
              <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{template?.icon ?? "✅"}</span>
                  <div className="min-w-0">
                    <p className="font-semibold">{template?.title ?? "Quest"}</p>
                    <p className="truncate text-sm text-foreground/60">
                      {activity?.title ?? activity?.location_name ?? "Honor-system completion"}
                    </p>
                  </div>
                  <time className="ml-auto shrink-0 text-xs text-foreground/45">
                    {new Date(c.completed_at).toLocaleDateString()}
                  </time>
                </div>
                {c.caption && <p className="mt-2 text-sm text-foreground/70">{c.caption}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
