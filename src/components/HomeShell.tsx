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
    <div className="relative min-h-dvh overflow-x-clip bg-background pb-24 lg:pb-0">
      {/* Ambient floating candy blobs (decorative, reduced-motion safe). */}
      <div aria-hidden className="blob left-[-4rem] top-24 h-56 w-56 animate-float bg-sun-soft" />
      <div aria-hidden className="blob right-[-5rem] top-1/3 h-72 w-72 animate-float bg-coral-soft [animation-delay:1.5s]" />
      <div aria-hidden className="blob bottom-10 left-1/4 h-64 w-64 animate-float bg-sky-soft [animation-delay:3s]" />

      <div className="relative z-10 mx-auto grid max-w-6xl lg:grid-cols-[clamp(220px,22vw,280px)_minmax(0,1fr)_clamp(300px,28vw,360px)] lg:gap-5 lg:px-4 lg:py-6">
        {/* Left — profile */}
        <aside className={`${vis("profile")} lg:sticky lg:top-6 lg:self-start`}>
          <div className="lg:overflow-hidden lg:rounded-card lg:border-2 lg:border-white lg:bg-white/70 lg:shadow-clay lg:backdrop-blur-sm">
            <ProfileSidebar profile={profile} earnedBadges={earnedBadges} />
          </div>
        </aside>

        {/* Center — feed */}
        <main className={`${vis("feed")} lg:overflow-hidden lg:rounded-card lg:border-2 lg:border-white lg:bg-white/55 lg:shadow-clay lg:backdrop-blur-sm`}>
          <FeedView />
        </main>

        {/* Right — spin + journal */}
        <aside
          className={`${col3Vis} lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto`}
        >
          <div className={vis("spin")}>
            <div className="lg:overflow-hidden lg:rounded-card lg:border-2 lg:border-white lg:bg-white/70 lg:shadow-clay lg:backdrop-blur-sm">
              <SpinView {...spin} />
            </div>
          </div>
          <div className={`${(tab === "journal" ? "block" : "hidden") + " lg:block"} lg:mt-5`}>
            <div className="lg:overflow-hidden lg:rounded-card lg:border-2 lg:border-white lg:bg-white/70 lg:shadow-clay lg:backdrop-blur-sm">
              <JournalList entries={journal} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile section nav — chunky bouncing pills */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-white bg-white/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id} className="flex-1">
                <button
                  onClick={() => setTab(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-extrabold transition-colors ${
                    active ? "text-coral" : "text-foreground/45"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid h-10 w-10 place-items-center rounded-2xl text-xl transition-transform duration-200 ${
                      active
                        ? "scale-100 bg-coral/15 shadow-clay"
                        : "scale-90 group-active:scale-95"
                    }`}
                  >
                    {t.icon}
                  </span>
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
