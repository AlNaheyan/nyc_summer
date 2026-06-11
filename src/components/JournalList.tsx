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
      <h2 className="mb-3 flex items-center gap-1.5 font-display text-lg font-semibold text-coral">
        <span aria-hidden>📔</span> My Journal
      </h2>

      {entries.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-foreground/15 bg-white/60 p-6 text-center text-sm font-medium text-foreground/60">
          <div className="mb-2 animate-bounce-soft text-3xl" aria-hidden>📔</div>
          No completed quests yet. Spin one and go explore!
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border-2 border-white bg-white p-3 shadow-clay transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sun-soft/50 text-xl" aria-hidden>{e.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{e.title}</p>
                  <p className="truncate text-xs font-medium text-foreground/55">{e.subtitle}</p>
                </div>
                <time className="shrink-0 text-[11px] font-semibold text-foreground/45">
                  {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </time>
              </div>
              {e.caption && <p className="mt-1.5 text-xs font-medium text-foreground/70">{e.caption}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
