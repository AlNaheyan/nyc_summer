import { NotebookText } from "lucide-react";

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
    <div className="p-5">
      <p className="eyebrow text-muted-foreground">Field notes</p>
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">My Journal</h2>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          <NotebookText className="mx-auto mb-2 h-6 w-6 opacity-60" aria-hidden />
          No completed quests yet. Spin one and go explore.
        </div>
      ) : (
        <ul className="relative flex flex-col">
          {entries.map((e, i) => (
            <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
              {/* timeline rail */}
              {i < entries.length - 1 && (
                <span aria-hidden className="absolute left-[1.0625rem] top-9 bottom-0 w-px bg-border" />
              )}
              <span
                className="z-10 grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-full border border-border bg-gold-soft text-base"
                aria-hidden
              >
                {e.icon}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2">
                  <p className="min-w-0 flex-1 truncate font-display text-[0.95rem] font-semibold leading-tight">
                    {e.title}
                  </p>
                  <time className="shrink-0 text-[11px] font-medium text-muted-foreground">
                    {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </time>
                </div>
                <p className="truncate text-xs text-muted-foreground">{e.subtitle}</p>
                {e.caption && (
                  <p className="mt-1.5 border-l-2 border-border pl-2.5 text-xs italic text-foreground/70">
                    {e.caption}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
