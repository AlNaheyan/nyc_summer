"use client";

import { useState } from "react";
import { Compass, Images, NotebookText, Award, type LucideIcon } from "lucide-react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SpinView, type SpinViewProps } from "./SpinView";
import { FeedView } from "./FeedView";
import { ProfileSidebar } from "./ProfileSidebar";
import { JournalList, type JournalEntry } from "./JournalList";

type Tab = "spin" | "feed" | "journal" | "profile";

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: "spin", label: "Spin", Icon: Compass },
  { id: "feed", label: "Feed", Icon: Images },
  { id: "journal", label: "Journal", Icon: NotebookText },
  { id: "profile", label: "Profile", Icon: Award },
];

const PANEL =
  "lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-card lg:shadow-paper";

interface Props {
  profile: Profile;
  earnedBadges: string[];
  journal: JournalEntry[];
  spin: SpinViewProps;
}

/**
 * Single-page dashboard: profile (left) · feed (center) · spin + journal
 * (right). On desktop all three columns show at once; on phones it collapses to
 * one column and the bottom nav switches sections.
 */
export function HomeShell({ profile, earnedBadges, journal, spin }: Props) {
  const [tab, setTab] = useState<Tab>("spin");

  // Per-panel mobile visibility (always visible on lg+).
  const vis = (t: Tab) => cn(tab === t ? "block" : "hidden", "lg:block");
  const col3Vis = cn(tab === "spin" || tab === "journal" ? "block" : "hidden", "lg:block");

  return (
    <div className="relative min-h-dvh bg-background pb-24 lg:pb-0">
      <div className="relative z-10 mx-auto grid max-w-6xl lg:grid-cols-[clamp(220px,22vw,280px)_minmax(0,1fr)_clamp(300px,28vw,360px)] lg:gap-5 lg:px-4 lg:py-6">
        {/* Left — profile */}
        <aside className={cn(vis("profile"), "lg:sticky lg:top-6 lg:self-start")}>
          <div className={PANEL}>
            <ProfileSidebar profile={profile} earnedBadges={earnedBadges} />
          </div>
        </aside>

        {/* Center — feed */}
        <main className={cn(vis("feed"), PANEL)}>
          <FeedView />
        </main>

        {/* Right — spin + journal */}
        <aside
          className={cn(
            col3Vis,
            "lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:no-scrollbar",
          )}
        >
          <div className={vis("spin")}>
            <div className={PANEL}>
              <SpinView {...spin} />
            </div>
          </div>
          <div className={cn(tab === "journal" ? "block" : "hidden", "lg:mt-5 lg:block")}>
            <div className={PANEL}>
              <JournalList entries={journal} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile section nav — hairline-topped paper bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <li key={id} className="flex-1">
                <button
                  onClick={() => setTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full transition-colors",
                      active ? "bg-primary/12" : "group-active:bg-foreground/5",
                    )}
                  >
                    <Icon
                      className={cn("h-[18px] w-[18px]", active && "stroke-[2.25]")}
                      aria-hidden
                    />
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
