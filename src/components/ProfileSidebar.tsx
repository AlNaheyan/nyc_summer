import type { Profile } from "@/lib/types";
import { BADGES } from "@/lib/gamification/badges";
import { Avatar, handleFor } from "./Avatar";
import { SignOutButton } from "./SignOutButton";

interface Props {
  profile: Profile;
  earnedBadges: string[];
}

export function ProfileSidebar({ profile, earnedBadges }: Props) {
  const earned = new Set(earnedBadges);

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={profile.display_name} url={profile.avatar_url} size={56} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold leading-tight">{profile.display_name}</p>
          <p className="truncate text-sm text-foreground/45">{handleFor(profile.display_name)}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="Points" value={profile.points} />
        <Stat label="Streak" value={`${profile.current_streak}🔥`} />
        <Stat label="Best" value={profile.longest_streak} />
      </div>

      <h2 className="mb-3 font-display text-base font-bold">Badges</h2>
      <ul className="grid grid-cols-3 gap-2">
        {BADGES.map((badge) => {
          const has = earned.has(badge.id);
          return (
            <li
              key={badge.id}
              title={badge.description}
              className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 text-center ${
                has ? "bg-sun-soft" : "bg-white/60"
              }`}
            >
              <span className="text-2xl" aria-hidden style={{ filter: has ? "none" : "grayscale(1)", opacity: has ? 1 : 0.45 }}>
                {badge.icon ?? "🏅"}
              </span>
              <span className="text-[10px] font-medium leading-tight">{badge.name}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-2">
        {profile.is_admin && (
          <a
            href="/admin"
            className="rounded-full bg-foreground/5 py-2.5 text-center text-sm font-semibold text-foreground/70 transition hover:bg-foreground/10"
          >
            🛡️ Moderation queue
          </a>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <div className="font-display text-xl font-extrabold text-coral">{value}</div>
      <div className="text-[11px] text-foreground/55">{label}</div>
    </div>
  );
}
