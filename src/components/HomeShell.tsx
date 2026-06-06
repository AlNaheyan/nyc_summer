"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { SpinView, type SpinViewProps } from "./SpinView";
import { FeedView } from "./FeedView";
import { ProfileSidebar } from "./ProfileSidebar";
import { JournalList, type JournalEntry } from "./JournalList";

type Tab = "spin" | "feed" | "journal" | "profile";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "spin", label: "Spin", icon: "🎡" },
  { id: "feed", label: "Feed", icon: "📸" },
  { id: "journal", label: "Journal", icon: "📔" },
  { id: "profile", label: "Profile", icon: "🏅" },
];

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
  const vis = (t: Tab) => (tab === t ? "block" : "hidden") + " lg:block";
  const col3Vis = (tab === "spin" || tab === "journal" ? "block" : "hidden") + " lg:block";

  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-[clamp(220px,22vw,280px)_minmax(0,1fr)_clamp(300px,28vw,360px)] lg:gap-5 lg:px-4 lg:py-6">
        {/* Left — profile */}
        <aside className={`${vis("profile")} lg:sticky lg:top-6 lg:self-start`}>
          <div className="lg:overflow-hidden lg:rounded-card lg:bg-white/40 lg:shadow-card">
            <ProfileSidebar profile={profile} earnedBadges={earnedBadges} />
          </div>
        </aside>

        {/* Center — feed */}
        <main className={`${vis("feed")} border-foreground/10 lg:rounded-card lg:border-x lg:bg-white/30`}>
          <FeedView />
        </main>

        {/* Right — spin + journal */}
        <aside
          className={`${col3Vis} lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto`}
        >
          <div className={vis("spin")}>
            <div className="lg:overflow-hidden lg:rounded-card lg:bg-white/40 lg:shadow-card">
              <SpinView {...spin} />
            </div>
          </div>
          <div className={`${(tab === "journal" ? "block" : "hidden") + " lg:block"} lg:mt-5`}>
            <div className="lg:overflow-hidden lg:rounded-card lg:bg-white/40 lg:shadow-card">
              <JournalList entries={journal} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile section nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground/10 bg-white/90 backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id} className="flex-1">
                <button
                  onClick={() => setTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                    active ? "text-coral" : "text-foreground/50"
                  }`}
                >
                  <span className="text-xl" aria-hidden>{t.icon}</span>
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
