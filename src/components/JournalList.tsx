export interface JournalEntry {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  date: string;
  caption: string | null;
}

export function JournalList({ entries }: { entries: JournalEntry[] }) {
  return (
    <div className="p-4">
      <h2 className="mb-3 font-display text-lg font-extrabold text-coral">My Journal</h2>

      {entries.length === 0 ? (
        <div className="rounded-card bg-white/70 p-6 text-center text-sm text-foreground/60">
          <div className="mb-2 text-3xl" aria-hidden>📔</div>
          No completed quests yet. Spin one and go explore!
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-xl" aria-hidden>{e.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.title}</p>
                  <p className="truncate text-xs text-foreground/55">{e.subtitle}</p>
                </div>
                <time className="shrink-0 text-[11px] text-foreground/45">
                  {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </time>
              </div>
              {e.caption && <p className="mt-1.5 text-xs text-foreground/70">{e.caption}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
