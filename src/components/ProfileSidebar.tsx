import { Flame, Shield } from "lucide-react";
import type { Profile } from "@/lib/types";
import { BADGES } from "@/lib/gamification/badges";
import { Avatar, handleFor } from "./Avatar";
import { SignOutButton } from "./SignOutButton";
import { cn } from "@/lib/utils";

interface Props {
  profile: Profile;
  earnedBadges: string[];
}

export function ProfileSidebar({ profile, earnedBadges }: Props) {
  const earned = new Set(earnedBadges);

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-full p-0.5 ring-1 ring-border">
          <Avatar name={profile.display_name} url={profile.avatar_url} size={52} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold leading-tight">
            {profile.display_name}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {handleFor(profile.display_name)}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="Points" value={profile.points} />
        <Stat
          label="Streak"
          value={
            <span className="inline-flex items-center gap-1">
              {profile.current_streak}
              <Flame className="h-3.5 w-3.5 text-primary" />
            </span>
          }
        />
        <Stat label="Best" value={profile.longest_streak} />
      </div>

      <p className="eyebrow mb-3 text-muted-foreground">Badges</p>
      <ul className="grid grid-cols-3 gap-2">
        {BADGES.map((badge) => {
          const has = earned.has(badge.id);
          return (
            <li
              key={badge.id}
              title={badge.description}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border p-2.5 text-center transition-transform duration-200",
                has
                  ? "border-border bg-gold-soft hover:-translate-y-0.5"
                  : "border-dashed border-border bg-card/40",
              )}
            >
              <span
                className="text-2xl"
                aria-hidden
                style={{ filter: has ? "none" : "grayscale(1)", opacity: has ? 1 : 0.35 }}
              >
                {badge.icon ?? "🏅"}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-tight",
                  !has && "text-muted-foreground",
                )}
              >
                {badge.name}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        {profile.is_admin && (
          <a
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-center text-sm font-semibold text-foreground/70 transition-colors hover:bg-secondary"
          >
            <Shield className="h-4 w-4" /> Moderation queue
          </a>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-center">
      <div className="font-display text-xl font-semibold leading-none">{value}</div>
      <div className="eyebrow mt-1.5 text-[0.5625rem] text-muted-foreground">{label}</div>
    </div>
  );
}
